export type EditTool = "background" | "remove" | "enhance" | "style" | "expand" | "custom";

export type ProductTemplate = "white-bg" | "lifestyle" | "festival" | "social";
export type ProductScene = "kitchen" | "bedroom" | "desk" | "outdoor" | "gift";
export type ProductStyle = "minimal" | "premium" | "warm" | "fresh";
export type ProductRatio = "1:1" | "3:4" | "4:3" | "16:9";

export type PosterUsage = "xiaohongshu" | "wechat" | "community" | "course" | "checkin";
export type PosterStyle = "clean" | "premium" | "cute" | "tech" | "handdrawn";
export type PosterRatio = "3:4" | "1:1" | "16:9" | "9:16" | "4:5";

export interface EditImageRequest {
  imageUrl: string;
  prompt: string;
  tool: EditTool;
}

export interface EditImageResult {
  id: string;
  url: string;
  type: "edited";
  label: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  createdAt: string;
  thumbnail: string;
}

export interface EditImageResponse {
  taskId: string;
  status: "succeeded";
  results: EditImageResult[];
  historyItem: HistoryItem;
}

export interface ProductImageRequest {
  imageUrl: string;
  template: ProductTemplate;
  scene: ProductScene;
  style: ProductStyle;
  sellingPoints: string;
  ratio: ProductRatio;
}

export interface ProductImageResult {
  id: string;
  url: string;
  template: string;
  title: string;
}

export interface ProductImageResponse {
  taskId: string;
  status: "succeeded";
  results: ProductImageResult[];
}

export interface PosterImageRequest {
  title: string;
  subtitle: string;
  usage: PosterUsage;
  style: PosterStyle;
  ratio: PosterRatio;
}

export interface PosterImageResult {
  id: string;
  url: string;
  title: string;
}

export interface PosterImageResponse {
  taskId: string;
  status: "succeeded";
  results: PosterImageResult[];
}
