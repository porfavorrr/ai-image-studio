import { NextResponse } from "next/server";
import { buildPosterPrompt } from "@/lib/server/image-prompt-builder";
import { createId, getImageProvider, imageErrorResponse, shouldUseMockImageApi } from "@/lib/server/image-route-utils";
import { ImageRequestError } from "@/lib/server/image-validation";
import { generateImage as generateImageWithCodex } from "@/lib/server/codex-image-api-service";
import { generateImage as generateImageWithOpenAI } from "@/lib/server/openai-image-service";
import { createPosterImages as createMockPosterImages } from "@/lib/services/image-service";
import type { ImageSize, PosterImageRequest, PosterRatio, PosterStyle, PosterUsage } from "@/types/image";

export const runtime = "nodejs";

const usages = new Set<PosterUsage>(["xiaohongshu", "wechat", "community", "course", "checkin"]);
const styles = new Set<PosterStyle>(["clean", "premium", "cute", "tech", "handdrawn"]);
const ratios = new Set<PosterRatio>(["3:4", "1:1", "16:9", "9:16", "4:5"]);

function normalize<T extends string>(value: unknown, allowed: Set<T>, fallback: T) {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback;
}

function sizeFromRatio(ratio: PosterRatio): ImageSize {
  if (ratio === "16:9") return "1536x1024";
  if (ratio === "3:4" || ratio === "4:5" || ratio === "9:16") return "1024x1536";
  return "1024x1024";
}

export async function POST(request: Request) {
  try {
    let body: Partial<PosterImageRequest>;

    try {
      body = (await request.json()) as Partial<PosterImageRequest>;
    } catch {
      throw new ImageRequestError("INVALID_JSON", "请求参数格式不正确");
    }

    const title = typeof body.title === "string" ? body.title : "";
    const subtitle = typeof body.subtitle === "string" ? body.subtitle : "";
    const usage = normalize(body.usage, usages, "xiaohongshu");
    const style = normalize(body.style, styles, "clean");
    const ratio = normalize(body.ratio, ratios, "3:4");

    if (shouldUseMockImageApi()) {
      const data = await createMockPosterImages({
        title,
        subtitle,
        usage,
        style,
        ratio
      });
      return NextResponse.json(data);
    }

    const prompt = buildPosterPrompt({
      title,
      subtitle,
      usage,
      style,
      ratio
    });
    const provider = getImageProvider();
    const result =
      provider === "codex"
        ? await generateImageWithCodex({
            prompt
          })
        : await generateImageWithOpenAI({
            prompt,
            size: sizeFromRatio(ratio),
            quality: "auto",
            outputFormat: "png"
          });

    return NextResponse.json({
      taskId: createId("poster-task"),
      status: "succeeded",
      mode: "real",
      provider,
      results: [
        {
          id: "poster-result-1",
          url: result.url,
          title: "AI 海报背景"
        }
      ]
    });
  } catch (error) {
    return imageErrorResponse(error);
  }
}
