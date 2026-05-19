import { editToolLabels } from "@/lib/server/image-prompt-builder";
import { editMockResults, posterMockResults, productMockResults } from "@/lib/mock-data";
import type {
  EditImageRequest,
  EditImageResponse,
  PosterImageRequest,
  PosterImageResponse,
  ProductImageRequest,
  ProductImageResponse
} from "@/types/image";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export async function editImage(input: EditImageRequest): Promise<EditImageResponse> {
  const title = editToolLabels[input.tool] ?? "自定义修图";
  const thumbnail = editMockResults[0]?.url ?? input.imageUrl ?? "";

  return {
    taskId: createId("mock-task"),
    status: "succeeded",
    mode: "mock",
    results: editMockResults,
    historyItem: {
      id: createId("history"),
      title,
      createdAt: new Date().toISOString(),
      thumbnail
    }
  };
}

export async function createProductImages(input: ProductImageRequest): Promise<ProductImageResponse> {
  return {
    taskId: createId("mock-product-task"),
    status: "succeeded",
    mode: "mock",
    results: productMockResults.map((result, index) => ({
      ...result,
      id: `${result.id}-${index + 1}-${input.template}`
    }))
  };
}

export async function createPosterImages(input: PosterImageRequest): Promise<PosterImageResponse> {
  return {
    taskId: createId("mock-poster-task"),
    status: "succeeded",
    mode: "mock",
    results: posterMockResults.map((result, index) => ({
      ...result,
      id: `${result.id}-${index + 1}-${input.style}`
    }))
  };
}
