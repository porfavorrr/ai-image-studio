import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { ImageOutputFormat } from "@/types/image";

const MIME_TYPES: Record<ImageOutputFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp"
};

export function base64ToDataUrl(base64: string, outputFormat: ImageOutputFormat = "png") {
  return `data:${MIME_TYPES[outputFormat]};base64,${base64}`;
}

export function bytesToDataUrl(bytes: ArrayBuffer, mimeType = "image/png") {
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function extensionFromMime(mimeType: string) {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

export async function saveUploadFile(file: File, userId: string, taskId: string) {
  const extension = extensionFromMime(file.type || "image/png");
  const relativePath = `/generated/${safePathSegment(userId)}/${safePathSegment(taskId)}/input.${extension}`;
  const absolutePath = path.join(process.cwd(), "public", relativePath.slice(1));

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return relativePath;
}

export async function saveResultImage(imageUrl: string, userId: string, taskId: string, index = 1) {
  if (imageUrl.startsWith("/generated/")) {
    return imageUrl;
  }

  let mimeType = "image/png";
  let buffer: Buffer;

  const parsed = parseDataUrl(imageUrl);
  if (parsed) {
    mimeType = parsed.mimeType;
    buffer = parsed.buffer;
  } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return imageUrl;
      }
      mimeType = response.headers.get("content-type") || mimeType;
      buffer = Buffer.from(await response.arrayBuffer());
    } catch {
      return imageUrl;
    }
  } else {
    return imageUrl;
  }

  const extension = extensionFromMime(mimeType);
  const relativePath = `/generated/${safePathSegment(userId)}/${safePathSegment(taskId)}/result-${index}.${extension}`;
  const absolutePath = path.join(process.cwd(), "public", relativePath.slice(1));

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return relativePath;
}

export async function normalizeResultImages(imageUrls: string[], userId: string, taskId: string) {
  const saved = await Promise.all(imageUrls.map((url, index) => saveResultImage(url, userId, taskId, index + 1)));
  return saved.filter(Boolean);
}

export async function saveBase64Image(input: { base64: string; outputFormat?: ImageOutputFormat }) {
  return base64ToDataUrl(input.base64, input.outputFormat);
}
