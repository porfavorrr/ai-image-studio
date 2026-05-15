import type {
  EditImageRequest,
  EditImageResponse,
  PosterImageRequest,
  PosterImageResponse,
  ProductImageRequest,
  ProductImageResponse
} from "@/types/image";
import type { TemplateItem } from "@/types/template";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  editImage(payload: EditImageRequest) {
    return request<EditImageResponse>("/api/images/edit", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  createProductImages(payload: ProductImageRequest) {
    return request<ProductImageResponse>("/api/images/product", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  createPosterImages(payload: PosterImageRequest) {
    return request<PosterImageResponse>("/api/images/poster", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  listTemplates() {
    return request<TemplateItem[]>("/api/templates");
  }
};
