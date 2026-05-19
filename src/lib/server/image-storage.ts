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

export async function saveBase64Image(input: {
  base64: string;
  outputFormat?: ImageOutputFormat;
  filename?: string;
}) {
  return base64ToDataUrl(input.base64, input.outputFormat);
}
