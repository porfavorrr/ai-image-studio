import type { EditTool, ImageOutputFormat, ImageQuality, ImageSize } from "@/types/image";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SUPPORTED_TOOLS = new Set<EditTool>(["background", "remove", "enhance", "style", "expand", "custom"]);
const SUPPORTED_QUALITIES = new Set<ImageQuality>(["low", "medium", "high", "auto"]);
const SUPPORTED_OUTPUT_FORMATS = new Set<ImageOutputFormat>(["png", "jpeg", "webp"]);
const SUPPORTED_IMAGE_SIZES = new Set<ImageSize>(["1024x1024", "1024x1536", "1536x1024", "auto"]);

export class ImageRequestError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ImageRequestError";
    this.code = code;
    this.status = status;
  }
}

export function getFormString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

export function getRequiredImageFile(formData: FormData) {
  const value = formData.get("image");

  if (!(value instanceof File)) {
    throw new ImageRequestError("IMAGE_REQUIRED", "请先上传一张图片");
  }

  validateImageFile(value);
  return value;
}

export function validateImageFile(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new ImageRequestError("UNSUPPORTED_IMAGE_TYPE", "仅支持 JPEG、PNG、WebP 格式图片");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new ImageRequestError("IMAGE_TOO_LARGE", "图片大小不能超过 10MB");
  }
}

export function normalizeEditTool(value?: string): EditTool {
  if (value && SUPPORTED_TOOLS.has(value as EditTool)) {
    return value as EditTool;
  }

  return "custom";
}

export function normalizeImageQuality(value?: string): ImageQuality {
  if (value && SUPPORTED_QUALITIES.has(value as ImageQuality)) {
    return value as ImageQuality;
  }

  return "auto";
}

export function normalizeOutputFormat(value?: string): ImageOutputFormat {
  if (value && SUPPORTED_OUTPUT_FORMATS.has(value as ImageOutputFormat)) {
    return value as ImageOutputFormat;
  }

  return "png";
}

export function normalizeImageSize(value?: string): ImageSize {
  if (value && SUPPORTED_IMAGE_SIZES.has(value as ImageSize)) {
    return value as ImageSize;
  }

  return "1024x1024";
}
