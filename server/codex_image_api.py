#!/usr/bin/env python3
"""
Small HTTP API that wraps the local Codex CLI for image generation.

Endpoints:
  POST /v1/images/text
    JSON body: {"prompt": "description"}

  POST /v1/images/reference
    multipart/form-data fields:
      prompt: description text
      image: one or more reference image files

Both endpoints return the generated image bytes directly.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import signal
import shlex
import shutil
import subprocess
import time
import uuid
from email.message import EmailMessage
from email.parser import BytesParser
from email.policy import default
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from string import Template
from typing import Any
from urllib.parse import urlparse


BASE_DIR = Path(os.environ.get("CODEX_IMAGE_API_WORKDIR", "/data/codex_image_api_runs"))
CODEX_BIN = os.environ.get("CODEX_BIN", "codex")
CODEX_MODEL = os.environ.get("CODEX_MODEL")
CODEX_TIMEOUT_SECONDS = int(os.environ.get("CODEX_TIMEOUT_SECONDS", "900"))
MAX_UPLOAD_BYTES = int(os.environ.get("MAX_UPLOAD_BYTES", str(20 * 1024 * 1024)))
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
UploadedReference = tuple[bytes, str | None]
ImageJobResult = tuple[Path, Path]


class ApiError(Exception):
    def __init__(self, status: HTTPStatus, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def ensure_codex_available() -> None:
    if shutil.which(CODEX_BIN) is None:
        raise ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, f"Codex CLI not found: {CODEX_BIN}")


def safe_suffix(filename: str | None, fallback: str = ".png") -> str:
    if not filename:
        return fallback
    suffix = Path(filename).suffix.lower()
    return suffix if suffix in IMAGE_EXTENSIONS else fallback


def latest_image(root: Path, started_at: float) -> Path | None:
    candidates: list[Path] = []
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            try:
                if path.stat().st_mtime >= started_at:
                    candidates.append(path)
            except OSError:
                continue
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def cleanup_job_dir(job_dir: Path) -> None:
    try:
        resolved_base = BASE_DIR.resolve()
        resolved_job = job_dir.resolve()
    except OSError:
        return
    if resolved_job == resolved_base or resolved_base not in resolved_job.parents:
        return
    shutil.rmtree(resolved_job, ignore_errors=True)


def build_default_command(prompt_file: Path, output_path: Path, reference_paths: list[Path]) -> tuple[list[str], str | None]:
    prompt = prompt_file.read_text(encoding="utf-8")
    command = [
        CODEX_BIN,
        "exec",
        "--cd",
        str(output_path.parent),
        "--sandbox",
        "workspace-write",
        "--skip-git-repo-check",
        "--ephemeral",
    ]
    if CODEX_MODEL:
        command.extend(["--model", CODEX_MODEL])
    for reference_path in reference_paths:
        command.extend(["--image", str(reference_path)])
    command.extend(["--", "-"])
    return command, prompt


def build_template_command(prompt_file: Path, output_path: Path, reference_paths: list[Path]) -> tuple[list[str], str | None]:
    template = os.environ.get("CODEX_IMAGE_COMMAND")
    if not template:
        return build_default_command(prompt_file, output_path, reference_paths)

    rendered = Template(template).safe_substitute(
        prompt_file=str(prompt_file),
        output_path=str(output_path),
        workdir=str(output_path.parent),
        reference_path=str(reference_paths[0]) if reference_paths else "",
        reference_paths=" ".join(shlex.quote(str(path)) for path in reference_paths),
        codex_bin=CODEX_BIN,
    )
    return shlex.split(rendered), None


def multipart_text(part: EmailMessage) -> str:
    payload = part.get_payload(decode=True)
    if payload is None:
        content = part.get_content()
        return content if isinstance(content, str) else str(content)
    charset = part.get_content_charset() or "utf-8"
    try:
        return payload.decode(charset)
    except UnicodeDecodeError:
        return payload.decode("utf-8", errors="replace")


def terminate_process_group(process: subprocess.Popen[str]) -> None:
    if process.poll() is not None:
        return
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            return
        process.wait(timeout=10)


def codex_prompt(user_prompt: str, output_path: Path) -> str:
    return f"""{user_prompt}

Save the final image result exactly at: {output_path}
"""


def run_codex_image_job(user_prompt: str, references: list[UploadedReference] | None = None) -> ImageJobResult:
    text = user_prompt.strip()
    if not text:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Field 'prompt' must not be empty.")

    ensure_codex_available()
    job_dir = BASE_DIR / time.strftime("%Y%m%d") / uuid.uuid4().hex
    job_dir.mkdir(parents=True, exist_ok=False)
    output_path = job_dir / "result.png"

    reference_paths: list[Path] = []
    for index, (reference_bytes, reference_name) in enumerate(references or [], start=1):
        if not reference_bytes:
            raise ApiError(HTTPStatus.BAD_REQUEST, "Uploaded image must not be empty.")
        reference_path = job_dir / f"reference_{index:02d}{safe_suffix(reference_name)}"
        reference_path.write_bytes(reference_bytes)
        reference_paths.append(reference_path)

    prompt_file = job_dir / "prompt.txt"
    prompt = codex_prompt(text, output_path)
    prompt_file.write_text(prompt, encoding="utf-8")

    started_at = time.time()
    command, stdin_text = build_template_command(prompt_file, output_path, reference_paths)
    process: subprocess.Popen[str] | None = None
    try:
        process = subprocess.Popen(
            command,
            cwd=job_dir,
            text=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True,
        )
        stdout, stderr = process.communicate(input=stdin_text, timeout=CODEX_TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired as exc:
        if process is not None:
            terminate_process_group(process)
        raise ApiError(HTTPStatus.GATEWAY_TIMEOUT, f"Codex timed out after {CODEX_TIMEOUT_SECONDS}s.") from exc
    except OSError as exc:
        raise ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, f"Failed to run Codex: {exc}") from exc
    finally:
        if process is not None:
            terminate_process_group(process)

    image_path = output_path if output_path.exists() else latest_image(job_dir, started_at)
    if process.returncode != 0:
        details = (stderr or stdout or "").strip()[-2000:]
        raise ApiError(HTTPStatus.BAD_GATEWAY, f"Codex failed with exit code {process.returncode}: {details}")
    if image_path is None:
        details = (stdout + "\n" + stderr).strip()[-2000:]
        raise ApiError(HTTPStatus.BAD_GATEWAY, f"Codex completed but no generated image was found. Output: {details}")
    return image_path, job_dir


def json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    server_version = "CodexImageAPI/1.0"

    def do_GET(self) -> None:
        if urlparse(self.path).path == "/health":
            self.send_json(HTTPStatus.OK, {"ok": True})
            return
        self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_POST(self) -> None:
        try:
            path = urlparse(self.path).path
            if path == "/v1/images/text":
                prompt = self.read_json_prompt()
                image_path, job_dir = run_codex_image_job(prompt)
                self.send_image(image_path, job_dir)
                return
            if path == "/v1/images/reference":
                prompt, references = self.read_multipart_reference()
                image_path, job_dir = run_codex_image_job(prompt, references)
                self.send_image(image_path, job_dir)
                return
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
        except ApiError as exc:
            self.send_json(exc.status, {"error": exc.message})
        except (BrokenPipeError, ConnectionResetError):
            return
        except Exception as exc:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(exc)})

    def read_body(self) -> bytes:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as exc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "Invalid Content-Length.") from exc
        if length <= 0:
            raise ApiError(HTTPStatus.BAD_REQUEST, "Request body is required.")
        if length > MAX_UPLOAD_BYTES:
            raise ApiError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "Request body is too large.")
        return self.rfile.read(length)

    def read_json_prompt(self) -> str:
        content_type = self.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            raise ApiError(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, "Use application/json.")
        try:
            payload = json.loads(self.read_body().decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "Invalid JSON body.") from exc
        prompt = payload.get("prompt")
        if not isinstance(prompt, str):
            raise ApiError(HTTPStatus.BAD_REQUEST, "JSON field 'prompt' must be a string.")
        return prompt

    def read_multipart_reference(self) -> tuple[str, list[UploadedReference]]:
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            raise ApiError(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, "Use multipart/form-data.")

        raw = self.read_body()
        message_bytes = (
            f"Content-Type: {content_type}\r\n"
            f"MIME-Version: 1.0\r\n\r\n"
        ).encode("utf-8") + raw
        message = BytesParser(policy=default).parsebytes(message_bytes)
        if not message.is_multipart():
            raise ApiError(HTTPStatus.BAD_REQUEST, "Invalid multipart body.")

        prompt: str | None = None
        references: list[UploadedReference] = []
        for part in message.iter_parts():
            disposition = part.get_content_disposition()
            if disposition != "form-data":
                continue
            name = part.get_param("name", header="content-disposition")
            if name == "prompt":
                prompt = multipart_text(part)
            elif name == "image":
                payload = part.get_payload(decode=True)
                references.append((payload if payload is not None else b"", part.get_filename()))

        if not isinstance(prompt, str):
            raise ApiError(HTTPStatus.BAD_REQUEST, "Multipart field 'prompt' is required.")
        if not references:
            raise ApiError(HTTPStatus.BAD_REQUEST, "At least one multipart file field 'image' is required.")
        return prompt, references

    def send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_image(self, image_path: Path, job_dir: Path | None = None) -> None:
        body = image_path.read_bytes()
        mime_type = mimetypes.guess_type(image_path.name)[0] or "application/octet-stream"
        try:
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Content-Disposition", f'inline; filename="{image_path.name}"')
            self.end_headers()
            self.wfile.write(body)
        finally:
            if job_dir is not None:
                cleanup_job_dir(job_dir)

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"{self.address_string()} - {fmt % args}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="HTTP API for Codex CLI image generation.")
    parser.add_argument("--host", default=os.environ.get("HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")))
    args = parser.parse_args()

    BASE_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Serving on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
