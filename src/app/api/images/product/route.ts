import { NextResponse } from "next/server";
import { buildProductPrompt } from "@/lib/server/image-prompt-builder";
import { createId, getImageProvider, imageErrorResponse, shouldUseMockImageApi } from "@/lib/server/image-route-utils";
import { getFormString, getRequiredImageFile } from "@/lib/server/image-validation";
import { editImage as editImageWithCodex } from "@/lib/server/codex-image-api-service";
import { editImage as editImageWithOpenAI } from "@/lib/server/openai-image-service";
import { createProductImages as createMockProductImages } from "@/lib/services/image-service";
import type { ImageSize, ProductRatio, ProductScene, ProductStyle, ProductTemplate } from "@/types/image";

export const runtime = "nodejs";

const templateLabels: Record<ProductTemplate, string> = {
  "white-bg": "白底主图",
  lifestyle: "生活场景图",
  festival: "节日促销图",
  social: "社交媒体种草图"
};

const templates = new Set<ProductTemplate>(["white-bg", "lifestyle", "festival", "social"]);
const scenes = new Set<ProductScene>(["kitchen", "bedroom", "desk", "outdoor", "gift"]);
const styles = new Set<ProductStyle>(["minimal", "premium", "warm", "fresh"]);
const ratios = new Set<ProductRatio>(["1:1", "3:4", "4:3", "16:9"]);

function normalize<T extends string>(value: string, allowed: Set<T>, fallback: T) {
  return allowed.has(value as T) ? (value as T) : fallback;
}

function sizeFromRatio(ratio: ProductRatio): ImageSize {
  if (ratio === "3:4") return "1024x1536";
  if (ratio === "4:3" || ratio === "16:9") return "1536x1024";
  return "1024x1024";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = getRequiredImageFile(formData);
    const template = normalize(getFormString(formData, "template", "white-bg"), templates, "white-bg");
    const scene = normalize(getFormString(formData, "scene", "desk"), scenes, "desk");
    const style = normalize(getFormString(formData, "style", "premium"), styles, "premium");
    const sellingPoints = getFormString(formData, "sellingPoints");
    const ratio = normalize(getFormString(formData, "ratio", "1:1"), ratios, "1:1");

    if (shouldUseMockImageApi()) {
      const data = await createMockProductImages({
        image,
        template,
        scene,
        style,
        sellingPoints,
        ratio
      });
      return NextResponse.json(data);
    }

    const prompt = buildProductPrompt({
      template,
      scene,
      style,
      sellingPoints,
      ratio
    });
    const provider = getImageProvider();
    const result =
      provider === "codex"
        ? await editImageWithCodex({
            image,
            prompt
          })
        : await editImageWithOpenAI({
            image,
            prompt,
            size: sizeFromRatio(ratio),
            quality: "auto",
            outputFormat: "png"
          });

    return NextResponse.json({
      taskId: createId("product-task"),
      status: "succeeded",
      mode: "real",
      provider,
      results: [
        {
          id: "product-result-1",
          url: result.url,
          template: templateLabels[template],
          title: "AI 商品图"
        }
      ]
    });
  } catch (error) {
    return imageErrorResponse(error);
  }
}
