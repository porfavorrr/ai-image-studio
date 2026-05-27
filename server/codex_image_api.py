#!/usr/bin/env python3
"""
HTTP image API backed by Codex CLI.

Endpoints:
  GET  /health
  GET  /debug
  POST /v1/images/text
       JSON: {"prompt": "description"}
  POST /v1/images/reference
       multipart/form-data:
         prompt: description
         image: one or more reference images

Successful image endpoints return image bytes directly.
Failed jobs keep their job directory by default for debugging.
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
CODEX_MODEL = os.environ.get("CODEX_MODEL", "")
CODEX_TIMEOUT_SECONDS = int(os.environ.get("CODEX_TIMEOUT_SECONDS", "1800"))
MAX_UPLOAD_BYTES = int(os.environ.get("MAX_UPLOAD_BYTES", str(20 * 1024 * 1024)))
KEEP_SUCCESS_JOBS = os.environ.get("CODEX_IMAGE_API_KEEP_SUCCESS_JOBS") == "1"
KEEP_FAILED_JOBS = os.environ.get("CODEX_IMAGE_API_KEEP_FAILED_JOBS", "1") != "0"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}

UploadedReference = tuple[bytes, str | None]
ImageJobResult = tuple[Path, Path]


class ApiError(Exception):
    def __init__(self, status: HTTPStatus, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def ensure_codex_available() -> None:
    if shutil.which(CODEX_BIN) is None:
        raise ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, f"Codex CLI not found: {CODEX_BIN}")


def safe_suffix(filename: str | None, fallback: str = ".png") -> str:
    suffix = Path(filename or "").suffix.lower()
    return suffix if suffix in IMAGE_EXTENSIONS else fallback


def safe_cleanup_job_dir(job_dir: Path) -> None:
    try:
        resolved_base = BASE_DIR.resolve()
        resolved_job = job_dir.resolve()
    except OSError:
        return
    if resolved_job == resolved_base or resolved_base not in resolved_job.parents:
        return
    shutil.rmtree(resolved_job, ignore_errors=True)


def latest_image(root: Path, started_at: float) -> Path | None:
    candidates: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        try:
            if path.stat().st_size > 0 and path.stat().st_mtime >= started_at:
                candidates.append(path)
        except OSError:
            continue
    return max(candidates, key=lambda item: item.stat().st_mtime) if candidates else None


def image_looks_valid(path: Path) -> bool:
    try:
        header = path.read_bytes()[:16]
    except OSError:
        return False
    return (
        header.startswith(b"\x89PNG\r\n\x1a\n")
        or header.startswith(b"\xff\xd8\xff")
        or (header.startswith(b"RIFF") and b"WEBP" in header)
        or header.startswith(b"GIF87a")
        or header.startswith(b"GIF89a")
    )


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


def codex_prompt(user_prompt: str, output_path: Path, reference_paths: list[Path]) -> str:
    references = "\n".join(f"- {path}" for path in reference_paths) or "- none"
    return f"""You are performing an image generation or image editing job.

User request:
{user_prompt}

Reference image paths:
{references}

Required output:
- Create a real raster image file, not a text description.
- Save the final image exactly at: {output_path}
- Use PNG format unless the user explicitly asks for another image format.
- If reference images are provided, use them as source material.
- Do not ask questions or wait for confirmation.
- Before finishing, verify that the output file exists and is a valid image.
"""


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


def build_command(prompt_file: Path, output_path: Path, reference_paths: list[Path]) -> tuple[list[str], str | None]:
    template = os.environ.get("CODEX_IMAGE_COMMAND", "").strip()
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


def write_debug_file(job_dir: Path, name: str, content: str) -> None:
    try:
        (job_dir / name).write_text(content, encoding="utf-8")
    except OSError:
        pass


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


def run_codex_image_job(user_prompt: str, references: list[UploadedReference] | None = None) -> ImageJobResult:
    prompt_text = user_prompt.strip()
    if not prompt_text:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Field 'prompt' must not be empty.")

    ensure_codex_available()
    job_dir = BASE_DIR / time.strftime("%Y%m%d") / uuid.uuid4().hex
    job_dir.mkdir(parents=True, exist_ok=False)
    output_path = job_dir / "result.png"

    reference_paths: list[Path] = []
    for index, (content, filename) in enumerate(references or [], start=1):
        if not content:
            raise ApiError(HTTPStatus.BAD_REQUEST, "Uploaded image must not be empty.")
        reference_path = job_dir / f"reference_{index:02d}{safe_suffix(filename)}"
        reference_path.write_bytes(content)
        reference_paths.append(reference_path)

    prompt_file = job_dir / "prompt.txt"
    prompt_file.write_text(codex_prompt(prompt_text, output_path, reference_paths), encoding="utf-8")

    command, stdin_text = build_command(prompt_file, output_path, reference_paths)
    write_debug_file(job_dir, "command.txt", shlex.join(command))
    started_at = time.time()
    print(f"[job] start {job_dir}", flush=True)
    print(f"[job] command {shlex.join(command)}", flush=True)

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
        stdout = exc.stdout if isinstance(exc.stdout, str) else (exc.stdout or b"").decode("utf-8", errors="replace")
        stderr = exc.stderr if isinstance(exc.stderr, str) else (exc.stderr or b"").decode("utf-8", errors="replace")
        write_debug_file(job_dir, "stdout.txt", stdout)
        write_debug_file(job_dir, "stderr.txt", stderr)
        if process is not None:
            terminate_process_group(process)
        raise ApiError(
            HTTPStatus.GATEWAY_TIMEOUT,
            f"Codex timed out after {CODEX_TIMEOUT_SECONDS}s. Job dir: {job_dir}",
        ) from exc
    except OSError as exc:
        raise ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, f"Failed to run Codex: {exc}") from exc
    finally:
        if process is not None:
            terminate_process_group(process)

    write_debug_file(job_dir, "stdout.txt", stdout)
    write_debug_file(job_dir, "stderr.txt", stderr)

    if process.returncode != 0:
        details = (stderr or stdout or "").strip()[-2000:]
        raise ApiError(HTTPStatus.BAD_GATEWAY, f"Codex failed with exit code {process.returncode}. Job dir: {job_dir}. {details}")

    image_path = output_path if output_path.exists() else latest_image(job_dir, started_at)
    if image_path is None:
        details = (stdout + "\n" + stderr).strip()[-2000:]
        raise ApiError(HTTPStatus.BAD_GATEWAY, f"Codex completed but no image was found. Job dir: {job_dir}. {details}")

    if not image_looks_valid(image_path):
        raise ApiError(HTTPStatus.BAD_GATEWAY, f"Generated file is not a valid image. Job dir: {job_dir}. File: {image_path}")

    print(f"[job] success {image_path}", flush=True)
    return image_path, job_dir


def debug_payload() -> dict[str, Any]:
    codex_path = shutil.which(CODEX_BIN)
    return {
        "ok": True,
        "codexBin": CODEX_BIN,
        "codexPath": codex_path,
        "codexAvailable": codex_path is not None,
        "codexModel": CODEX_MODEL or None,
        "timeoutSeconds": CODEX_TIMEOUT_SECONDS,
        "maxUploadBytes": MAX_UPLOAD_BYTES,
        "baseDir": str(BASE_DIR),
        "baseDirExists": BASE_DIR.exists(),
        "keepSuccessJobs": KEEP_SUCCESS_JOBS,
        "keepFailedJobs": KEEP_FAILED_JOBS,
        "customCommandEnabled": bool(os.environ.get("CODEX_IMAGE_COMMAND", "").strip()),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "CodexImageAPI/2.0"

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in {"/", "/health"}:
            self.safe_send_json(HTTPStatus.OK, {"ok": True})
            return
        if path == "/debug":
            self.safe_send_json(HTTPStatus.OK, debug_payload())
            return
        self.safe_send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_POST(self) -> None:
        try:
            path = urlparse(self.path).path
            if path == "/v1/images/text":
                image_path, job_dir = run_codex_image_job(self.read_json_prompt())
                self.send_image(image_path, job_dir)
                return
            if path == "/v1/images/reference":
                prompt, references = self.read_multipart_reference()
                image_path, job_dir = run_codex_image_job(prompt, references)
                self.send_image(image_path, job_dir)
                return
            self.safe_send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
        except ApiError as exc:
            self.safe_send_json(exc.status, {"error": exc.message})
        except (BrokenPipeError, ConnectionResetError):
            return
        except Exception as exc:
            self.safe_send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(exc)})

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

        message_bytes = (
            f"Content-Type: {content_type}\r\n"
            f"MIME-Version: 1.0\r\n\r\n"
        ).encode("utf-8") + self.read_body()
        message = BytesParser(policy=default).parsebytes(message_bytes)
        if not message.is_multipart():
            raise ApiError(HTTPStatus.BAD_REQUEST, "Invalid multipart body.")

        prompt: str | None = None
        references: list[UploadedReference] = []
        for part in message.iter_parts():
            if part.get_content_disposition() != "form-data":
                continue
            name = part.get_param("name", header="content-disposition")
            if name == "prompt":
                prompt = multipart_text(part)
            elif name == "image":
                references.append((part.get_payload(decode=True) or b"", part.get_filename()))

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

    def safe_send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        try:
            self.send_json(status, payload)
        except (BrokenPipeError, ConnectionResetError):
            return

    def send_image(self, image_path: Path, job_dir: Path) -> None:
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
            if not KEEP_SUCCESS_JOBS:
                safe_cleanup_job_dir(job_dir)

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"{self.address_string()} - {fmt % args}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="HTTP API for Codex CLI image generation.")
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")))
    args = parser.parse_args()

    BASE_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Serving on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
