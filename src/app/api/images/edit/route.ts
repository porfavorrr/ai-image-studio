import { NextResponse } from "next/server";
import { buildEditPrompt, editToolLabels } from "@/lib/server/image-prompt-builder";
import { createId, getImageProvider, imageErrorResponse, shouldUseMockImageApi } from "@/lib/server/image-route-utils";
import {
  getFormString,
  getRequiredImageFile,
  normalizeEditTool,
  normalizeImageQuality,
  normalizeImageSize,
  normalizeOutputFormat
} from "@/lib/server/image-validation";
import { editImage as editImageWithCodex } from "@/lib/server/codex-image-api-service";
import { editImage as editImageWithOpenAI } from "@/lib/server/openai-image-service";
import { editImage as createMockEditResponse } from "@/lib/services/image-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = getRequiredImageFile(formData);
    const prompt = getFormString(formData, "prompt");
    const tool = normalizeEditTool(getFormString(formData, "tool", "custom"));
    const size = normalizeImageSize(getFormString(formData, "size", "1024x1024"));
    const quality = normalizeImageQuality(getFormString(formData, "quality", "auto"));
    const outputFormat = normalizeOutputFormat(getFormString(formData, "outputFormat", "png"));

    if (shouldUseMockImageApi()) {
      const data = await createMockEditResponse({
        image,
        prompt,
        tool,
        size,
        quality,
        outputFormat
      });
      return NextResponse.json(data);
    }

    const finalPrompt = buildEditPrompt(tool, prompt);
    const provider = getImageProvider();
    const result =
      provider === "codex"
        ? await editImageWithCodex({
            image,
            prompt: finalPrompt
          })
        : await editImageWithOpenAI({
            image,
            prompt: finalPrompt,
            size,
            quality,
            outputFormat
          });

    const resultItem = {
      id: "result-1",
      url: result.url,
      type: "edited" as const,
      label: "效果图 1"
    };

    return NextResponse.json({
      taskId: createId("image-task"),
      status: "succeeded",
      mode: "real",
      provider,
      results: [resultItem],
      historyItem: {
        id: createId("history"),
        title: editToolLabels[tool],
        createdAt: new Date().toISOString(),
        thumbnail: result.url
      }
    });
  } catch (error) {
    return imageErrorResponse(error);
  }
}
