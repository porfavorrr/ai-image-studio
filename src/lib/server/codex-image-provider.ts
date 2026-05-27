import { bytesToDataUrl } from "@/lib/server/image-storage";
import type { ImageProviderService, ProviderEditInput, ProviderGenerateInput } from "@/lib/server/image-provider";

function getCodexApiBaseUrl() {
  return (process.env.CODEX_IMAGE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
}

function getCodexApiTimeoutMs() {
  const seconds = Number(process.env.CODEX_IMAGE_API_TIMEOUT_SECONDS || "900");
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 900_000;
}

async function readError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `图片服务请求失败：${response.status}`;

  try {
    const payload = JSON.parse(text) as { error?: string };
    return payload.error || text;
  } catch {
    return text;
  }
}

async function requestCodexImage(path: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getCodexApiTimeoutMs());

  try {
    const response = await fetch(`${getCodexApiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength === 0) {
      throw new Error("图片服务返回了空结果");
    }

    const contentType = response.headers.get("content-type") || "image/png";
    return {
      url: bytesToDataUrl(bytes, contentType.split(";")[0] || "image/png")
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("图片服务处理超时，请稍后重试");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function createCodexImageProvider(): ImageProviderService {
  return {
    name: "codex",
    editImage(input: ProviderEditInput) {
      const formData = new FormData();
      formData.append("prompt", input.prompt);
      formData.append("image", input.image, input.image.name || "reference.png");

      return requestCodexImage("/v1/images/reference", {
        method: "POST",
        body: formData
      });
    },
    generateImage(input: ProviderGenerateInput) {
      return requestCodexImage("/v1/images/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: input.prompt })
      });
    }
  };
}
