import { NextResponse } from "next/server";
import { ImageRequestError } from "@/lib/server/image-validation";

export type ImageProvider = "openai" | "codex";

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function getImageProvider(): ImageProvider {
  const provider = (process.env.IMAGE_PROVIDER || process.env.IMAGE_API_PROVIDER || "openai").toLowerCase();
  return provider === "codex" ? "codex" : "openai";
}

export function shouldUseMockImageApi() {
  if (process.env.IMAGE_API_MODE !== "real") {
    return true;
  }

  if (getImageProvider() === "openai") {
    return !process.env.OPENAI_API_KEY;
  }

  return false;
}

export function imageErrorResponse(error: unknown) {
  if (error instanceof ImageRequestError) {
    return NextResponse.json(
      {
        status: "failed",
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.status }
    );
  }

  const message = error instanceof Error ? error.message : "图片生成失败，请稍后重试";

  return NextResponse.json(
    {
      status: "failed",
      error: {
        code: message.includes("返回结果为空") || message.includes("空图片") ? "EMPTY_MODEL_RESULT" : "MODEL_CALL_FAILED",
        message: message.includes("OpenAI SDK") ? message : `模型调用失败：${message}`
      }
    },
    { status: 502 }
  );
}
