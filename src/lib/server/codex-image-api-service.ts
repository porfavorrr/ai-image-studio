import { bytesToDataUrl } from "@/lib/server/image-storage";

interface EditImageInput {
  image: File;
  prompt: string;
}

interface GenerateImageInput {
  prompt: string;
}

function getCodexApiBaseUrl() {
  return (process.env.CODEX_IMAGE_API_BASE_URL || process.env.CODEX_IMAGE_API_URL || "http://127.0.0.1:8000").replace(
    /\/+$/,
    ""
  );
}

function getCodexApiTimeoutMs() {
  const seconds = Number(process.env.CODEX_IMAGE_API_TIMEOUT_SECONDS || "900");
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 900_000;
}

async function requestCodexImage(path: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = windowlessSetTimeout(() => controller.abort(), getCodexApiTimeoutMs());

  try {
    const response = await fetch(`${getCodexApiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await readCodexError(response));
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const body = await response.arrayBuffer();

    if (body.byteLength === 0) {
      throw new Error("Codex 图片 API 返回空图片");
    }

    return {
      url: bytesToDataUrl(body, contentType.split(";")[0] || "image/png")
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Codex 图片 API 调用超时");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function windowlessSetTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}

async function readCodexError(response: Response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return `Codex 图片 API 请求失败：${response.status}`;
  }

  try {
    const payload = JSON.parse(text) as { error?: string };
    return payload.error || text;
  } catch {
    return text;
  }
}

export async function editImage(input: EditImageInput) {
  const formData = new FormData();
  formData.append("prompt", input.prompt);
  formData.append("image", input.image, input.image.name || "reference.png");

  return requestCodexImage("/v1/images/reference", {
    method: "POST",
    body: formData
  });
}

export async function generateImage(input: GenerateImageInput) {
  return requestCodexImage("/v1/images/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: input.prompt
    })
  });
}
