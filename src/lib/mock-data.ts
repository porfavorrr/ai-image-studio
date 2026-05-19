import type {
  EditImageResult,
  EditTool,
  PosterImageResult,
  PosterStyle,
  ProductImageResult,
  ProductStyle,
  ProductTemplate
} from "@/types/image";
import { mockImages } from "@/lib/mock-images";
import type { TemplateItem } from "@/types/template";

export { mockImages };

export const toolPrompts: Record<EditTool, string> = {
  background: "把背景换成干净明亮的商业摄影背景，主体保持不变",
  remove: "去除画面中的多余杂物，背景自然补全",
  enhance: "提升图片清晰度、细节和光影表现，画面更干净自然",
  style: "改成更高级、更专业的商业视觉风格，保持主体内容不变",
  expand: "将画面边缘自然扩展，适合封面、海报或横竖版裁切",
  custom: ""
};

export const toolLabels: Record<EditTool, string> = {
  background: "换背景",
  remove: "去杂物",
  enhance: "增强清晰度",
  style: "改风格",
  expand: "扩图",
  custom: "自定义修图"
};

export const editMockResults: EditImageResult[] = [
  { id: "result-1", url: mockImages.edit1, type: "edited", label: "效果图 1" },
  { id: "result-2", url: mockImages.edit2, type: "edited", label: "效果图 2" },
  { id: "result-3", url: mockImages.edit3, type: "edited", label: "效果图 3" }
];

export const productTemplateLabels: Record<ProductTemplate, string> = {
  "white-bg": "白底主图",
  lifestyle: "生活场景图",
  festival: "节日促销图",
  social: "种草封面"
};

export const productStyleLabels: Record<ProductStyle, string> = {
  minimal: "简约",
  premium: "高级",
  warm: "温暖",
  fresh: "清新"
};

export const productMockResults: ProductImageResult[] = [
  { id: "product-1", url: mockImages.product1, template: "白底主图", title: "白底商品图" },
  { id: "product-2", url: mockImages.product2, template: "生活场景图", title: "晨光厨房场景" },
  { id: "product-3", url: mockImages.product3, template: "节日促销图", title: "礼盒氛围主图" },
  { id: "product-4", url: mockImages.product4, template: "种草封面", title: "清新内容封面" }
];

export const posterStyleLabels: Record<PosterStyle, string> = {
  clean: "清爽",
  premium: "高级",
  cute: "可爱",
  tech: "科技",
  handdrawn: "手绘"
};

export const posterMockResults: PosterImageResult[] = [
  { id: "poster-1", url: mockImages.poster1, title: "清爽蓝白版式" },
  { id: "poster-2", url: mockImages.poster2, title: "高质感内容封面" },
  { id: "poster-3", url: mockImages.poster3, title: "轻盈打卡版式" },
  { id: "poster-4", url: mockImages.poster4, title: "活动信息海报" },
  { id: "poster-5", url: mockImages.poster5, title: "课程封面版式" },
  { id: "poster-6", url: mockImages.poster6, title: "科技感封面" }
];

export const taskCards = [
  {
    title: "修一张图",
    description: "上传照片，用自然语言描述修改点。",
    route: "/editor",
    accent: "from-blue-500 to-indigo-500"
  },
  {
    title: "换背景",
    description: "一键生成白底、棚拍、场景化背景。",
    route: "/editor",
    tool: "background",
    accent: "from-cyan-500 to-blue-500"
  },
  {
    title: "去杂物",
    description: "移除路人、杂乱物体并自然补全。",
    route: "/editor",
    tool: "remove",
    accent: "from-violet-500 to-fuchsia-500"
  },
  {
    title: "做商品图",
    description: "为电商主图、详情页和种草封面出图。",
    route: "/product",
    accent: "from-amber-400 to-rose-500"
  },
  {
    title: "做封面海报",
    description: "快速生成封面、活动海报和课程视觉。",
    route: "/poster",
    accent: "from-emerald-400 to-teal-500"
  }
] as const;

export const templates: TemplateItem[] = [
  {
    id: "template-white-product",
    name: "白底商品图",
    category: "商品图",
    description: "适合电商主图，主体突出，光影干净。",
    thumbnail: mockImages.product1,
    usageCount: 28400,
    route: "/product"
  },
  {
    id: "template-xhs-cover",
    name: "小红书封面",
    category: "封面海报",
    description: "醒目的标题层级和清爽配色，适合内容种草。",
    thumbnail: mockImages.poster1,
    usageCount: 35600,
    route: "/poster"
  },
  {
    id: "template-portrait",
    name: "职业头像",
    category: "头像",
    description: "自然修饰五官与光线，保留真实质感。",
    thumbnail: mockImages.portraitBusiness,
    usageCount: 17320,
    route: "/editor"
  },
  {
    id: "template-checkin",
    name: "学习打卡图",
    category: "封面海报",
    description: "适合社群打卡和每日内容分享。",
    thumbnail: mockImages.posterStudy,
    usageCount: 12680,
    route: "/poster"
  },
  {
    id: "template-lifestyle-product",
    name: "商品场景图",
    category: "商品图",
    description: "把单品放进真实生活场景，提升购买想象。",
    thumbnail: mockImages.product2,
    usageCount: 24110,
    route: "/product"
  },
  {
    id: "template-campaign",
    name: "活动海报",
    category: "运营活动",
    description: "活动信息清晰，适合社群、门店和私域传播。",
    thumbnail: mockImages.poster4,
    usageCount: 19750,
    route: "/poster"
  },
  {
    id: "template-remove",
    name: "智能去物",
    category: "修图",
    description: "清理画面杂物，保留自然背景纹理。",
    thumbnail: mockImages.edit3,
    usageCount: 21940,
    route: "/editor"
  },
  {
    id: "template-festival",
    name: "节日礼盒图",
    category: "商品图",
    description: "快速生成节日氛围主视觉和促销图。",
    thumbnail: mockImages.product3,
    usageCount: 16200,
    route: "/product"
  }
];

export const industryTemplates = ["美妆个护", "食品饮料", "3C 数码", "家居日用", "服饰鞋包", "母婴玩具"];

export const apiCapabilities = [
  "图片生成 API",
  "图片编辑 API",
  "局部编辑 API",
  "商品图 API",
  "海报生成 API",
  "任务查询 API"
];
