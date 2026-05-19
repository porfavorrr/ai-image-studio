import type {
  EditTool,
  PosterRatio,
  PosterStyle,
  PosterUsage,
  ProductRatio,
  ProductScene,
  ProductStyle,
  ProductTemplate
} from "@/types/image";

const DEFAULT_USER_PROMPT = "请根据图片内容进行自然、专业的优化。";

export const editToolLabels: Record<EditTool, string> = {
  background: "换背景",
  remove: "去杂物",
  enhance: "增强清晰度",
  style: "改风格",
  expand: "扩图",
  custom: "自定义修图"
};

const productTemplateLabels: Record<ProductTemplate, string> = {
  "white-bg": "白底主图",
  lifestyle: "生活场景图",
  festival: "节日促销图",
  social: "社交媒体种草图"
};

const productSceneLabels: Record<ProductScene, string> = {
  kitchen: "厨房",
  bedroom: "卧室",
  desk: "办公桌",
  outdoor: "户外",
  gift: "礼盒"
};

const productStyleLabels: Record<ProductStyle, string> = {
  minimal: "简约",
  premium: "高级",
  warm: "温暖",
  fresh: "清新"
};

const posterUsageLabels: Record<PosterUsage, string> = {
  xiaohongshu: "小红书封面",
  wechat: "公众号首图",
  community: "社群活动海报",
  course: "课程封面",
  checkin: "学习打卡图"
};

const posterStyleLabels: Record<PosterStyle, string> = {
  clean: "干净清爽",
  premium: "高级质感",
  cute: "可爱亲和",
  tech: "科技感",
  handdrawn: "手绘感"
};

function withFallback(value?: string) {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_USER_PROMPT;
}

export function buildEditPrompt(tool: EditTool, userPrompt?: string) {
  const prompt = withFallback(userPrompt);

  const templates: Record<EditTool, string> = {
    background:
      "请在保持图片主体外观、材质、颜色、比例和边缘细节尽量不变的前提下，将背景替换为干净、明亮、专业的商业摄影背景。背景应自然、简洁，光影与主体协调，不添加无关元素。用户补充要求：{userPrompt}",
    remove:
      "请移除画面中不必要的杂物、路人或干扰元素，并自然补全背景。保持主要主体不变，不改变主体颜色、形状、材质和位置。用户补充要求：{userPrompt}",
    enhance:
      "请提升图片整体清晰度、细节质感和光影表现，使画面更干净、更自然、更适合发布。不要改变主体结构，不要添加无关物体。用户补充要求：{userPrompt}",
    style:
      "请将图片调整为更高级、更专业的商业视觉风格，提升构图、光影、色彩和整体质感。保持主体内容不变。用户补充要求：{userPrompt}",
    expand:
      "请在保持主体不变的前提下，自然扩展画面边缘，使图片适合封面、海报或横竖版裁切。扩展区域应与原图风格、光线和背景自然一致。用户补充要求：{userPrompt}",
    custom: "请根据用户需求编辑图片，保持主体自然真实，避免添加无关元素。用户补充要求：{userPrompt}"
  };

  return templates[tool].replace("{userPrompt}", prompt);
}

export function buildProductPrompt(input: {
  template: ProductTemplate;
  scene: ProductScene;
  style: ProductStyle;
  sellingPoints?: string;
  ratio: ProductRatio;
}) {
  return [
    "请基于上传的商品图生成一张高质量商业商品图。",
    "保持商品主体、包装、颜色、比例和文字标识尽量一致。",
    `图片类型为：${productTemplateLabels[input.template]}。`,
    `图片场景为：${productSceneLabels[input.scene]}。`,
    `整体风格为：${productStyleLabels[input.style]}。`,
    `商品卖点为：${withFallback(input.sellingPoints)}。`,
    `画面比例倾向为：${input.ratio}。`,
    "画面应干净、专业、适合电商平台或社交媒体发布。"
  ].join("");
}

export function buildPosterPrompt(input: {
  title: string;
  subtitle?: string;
  usage: PosterUsage;
  style: PosterStyle;
  ratio: PosterRatio;
}) {
  return [
    `请生成一张适合作为海报或封面的高质量视觉背景，主题为：${withFallback(input.title)}。`,
    input.subtitle?.trim() ? `辅助语义为：${input.subtitle.trim()}。` : "",
    `风格为：${posterStyleLabels[input.style]}。`,
    `用途为：${posterUsageLabels[input.usage]}。`,
    `画面比例倾向为：${input.ratio}。`,
    "画面应干净、现代、有视觉吸引力。",
    "请预留清晰的文字排版区域，不要生成复杂文字、价格、二维码或不可编辑文本。"
  ]
    .filter(Boolean)
    .join("");
}
