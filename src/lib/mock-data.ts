import { imageAssets } from "@/lib/image-assets";
import type { EditImageResult, PosterImageResult, ProductImageResult } from "@/types/image";

export const editMockResults: EditImageResult[] = [
  { id: "result-1", url: imageAssets.edit1, type: "edited", label: "效果图 1" },
  { id: "result-2", url: imageAssets.edit2, type: "edited", label: "效果图 2" },
  { id: "result-3", url: imageAssets.edit3, type: "edited", label: "效果图 3" }
];

export const productMockResults: ProductImageResult[] = [
  { id: "product-1", url: imageAssets.product1, template: "白底主图", title: "白底商品图" },
  { id: "product-2", url: imageAssets.product2, template: "生活场景图", title: "晨光厨房场景" },
  { id: "product-3", url: imageAssets.product3, template: "节日促销图", title: "礼盒氛围主图" },
  { id: "product-4", url: imageAssets.product4, template: "种草封面", title: "清新内容封面" }
];

export const posterMockResults: PosterImageResult[] = [
  { id: "poster-1", url: imageAssets.poster1, title: "清爽蓝白版式" },
  { id: "poster-2", url: imageAssets.poster2, title: "高质感内容封面" },
  { id: "poster-3", url: imageAssets.poster3, title: "轻盈打卡版式" },
  { id: "poster-4", url: imageAssets.poster4, title: "活动信息海报" },
  { id: "poster-5", url: imageAssets.poster5, title: "课程封面版式" },
  { id: "poster-6", url: imageAssets.poster6, title: "科技感封面" }
];
