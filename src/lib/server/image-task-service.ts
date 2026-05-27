import { randomUUID } from "crypto";
import { assertHasCredits, consumeCredit } from "@/lib/billing";
import { buildEditPrompt, buildPosterPrompt, buildProductPrompt, editToolLabels } from "@/lib/server/image-prompt-builder";
import { getImageProviderService } from "@/lib/server/image-provider";
import { normalizeResultImages, saveUploadFile } from "@/lib/server/image-storage";
import { withDb, getDbSnapshot } from "@/lib/db";
import type {
  EditTool,
  ImageOutputFormat,
  ImageQuality,
  ImageSize,
  PosterRatio,
  PosterStyle,
  PosterUsage,
  ProductRatio,
  ProductScene,
  ProductStyle,
  ProductTemplate
} from "@/types/image";
import type { ImageTaskRecord, ImageTaskType } from "@/types/task";

function nowIso() {
  return new Date().toISOString();
}

function createTask(input: {
  userId: string;
  type: ImageTaskType;
  prompt: string;
  tool?: ImageTaskRecord["tool"];
  provider?: ImageTaskRecord["provider"];
}) {
  const now = nowIso();
  return {
    id: randomUUID(),
    userId: input.userId,
    type: input.type,
    prompt: input.prompt,
    tool: input.tool ?? null,
    status: "processing" as const,
    provider: input.provider ?? null,
    inputImageUrl: null,
    resultImageUrl: null,
    resultImages: [],
    errorMessage: null,
    createdAt: now,
    updatedAt: now
  };
}

async function insertTask(task: ImageTaskRecord) {
  await withDb((db) => {
    db.imageTasks.push(task);
  });
}

async function updateTask(taskId: string, patch: Partial<ImageTaskRecord>) {
  await withDb((db) => {
    const task = db.imageTasks.find((item) => item.id === taskId);
    if (!task) return;
    Object.assign(task, patch, { updatedAt: nowIso() });
  });
}

async function failTask(taskId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "生成失败，请稍后重试";
  await updateTask(taskId, {
    status: "failed",
    errorMessage: message
  });
}

async function saveResults(userId: string, taskId: string, urls: string[]) {
  const savedImages = await normalizeResultImages(urls, userId, taskId);
  return {
    resultImages: savedImages,
    resultImageUrl: savedImages[0] ?? null
  };
}

export async function runEditTask(input: {
  userId: string;
  image: File;
  prompt?: string;
  tool: EditTool;
  size: ImageSize;
  quality: ImageQuality;
  outputFormat: ImageOutputFormat;
}) {
  const provider = getImageProviderService();
  const prompt = buildEditPrompt(input.tool, input.prompt);
  await assertHasCredits(input.userId);
  const task = createTask({
    userId: input.userId,
    type: "edit",
    prompt,
    tool: input.tool,
    provider: provider.name
  });

  await insertTask(task);

  try {
    const inputImageUrl = await saveUploadFile(input.image, input.userId, task.id);
    await updateTask(task.id, { inputImageUrl });

    const generated = await provider.editImage({
      image: input.image,
      prompt,
      size: input.size,
      quality: input.quality,
      outputFormat: input.outputFormat
    });
    const saved = await saveResults(input.userId, task.id, [generated.url]);

    await updateTask(task.id, {
      status: "succeeded",
      ...saved
    });
    const latestCredits = await consumeCredit(input.userId, "图片生成");

    return {
      taskId: task.id,
      status: "succeeded" as const,
      mode: provider.name === "mock" ? "mock" : "real",
      provider: provider.name,
      results: [
        {
          id: "result-1",
          url: saved.resultImageUrl || generated.url,
          type: "edited" as const,
          label: "效果图 1"
        }
      ],
      latestCredits,
      historyItem: {
        id: task.id,
        title: editToolLabels[input.tool],
        createdAt: task.createdAt,
        thumbnail: saved.resultImageUrl || generated.url
      }
    };
  } catch (error) {
    await failTask(task.id, error);
    throw error;
  }
}

export async function runProductTask(input: {
  userId: string;
  image: File;
  template: ProductTemplate;
  scene: ProductScene;
  style: ProductStyle;
  sellingPoints: string;
  ratio: ProductRatio;
  size: ImageSize;
}) {
  const provider = getImageProviderService();
  const prompt = buildProductPrompt(input);
  await assertHasCredits(input.userId);
  const task = createTask({
    userId: input.userId,
    type: "product",
    prompt,
    tool: "product",
    provider: provider.name
  });

  await insertTask(task);

  try {
    const inputImageUrl = await saveUploadFile(input.image, input.userId, task.id);
    await updateTask(task.id, { inputImageUrl });

    const generated = await provider.editImage({
      image: input.image,
      prompt,
      size: input.size,
      quality: "auto",
      outputFormat: "png"
    });
    const saved = await saveResults(input.userId, task.id, [generated.url]);

    await updateTask(task.id, {
      status: "succeeded",
      ...saved
    });
    const latestCredits = await consumeCredit(input.userId, "图片生成");

    return {
      taskId: task.id,
      status: "succeeded" as const,
      mode: provider.name === "mock" ? "mock" : "real",
      provider: provider.name,
      latestCredits,
      results: [
        {
          id: "product-result-1",
          url: saved.resultImageUrl || generated.url,
          template: "商品图",
          title: "AI 商品图"
        }
      ]
    };
  } catch (error) {
    await failTask(task.id, error);
    throw error;
  }
}

export async function runPosterTask(input: {
  userId: string;
  title: string;
  subtitle: string;
  usage: PosterUsage;
  style: PosterStyle;
  ratio: PosterRatio;
  size: ImageSize;
}) {
  const provider = getImageProviderService();
  const prompt = buildPosterPrompt(input);
  await assertHasCredits(input.userId);
  const task = createTask({
    userId: input.userId,
    type: "poster",
    prompt,
    tool: "poster",
    provider: provider.name
  });

  await insertTask(task);

  try {
    const generated = await provider.generateImage({
      prompt,
      size: input.size,
      quality: "auto",
      outputFormat: "png"
    });
    const saved = await saveResults(input.userId, task.id, [generated.url]);

    await updateTask(task.id, {
      status: "succeeded",
      ...saved
    });
    const latestCredits = await consumeCredit(input.userId, "图片生成");

    return {
      taskId: task.id,
      status: "succeeded" as const,
      mode: provider.name === "mock" ? "mock" : "real",
      provider: provider.name,
      latestCredits,
      results: [
        {
          id: "poster-result-1",
          url: saved.resultImageUrl || generated.url,
          title: "AI 海报背景"
        }
      ]
    };
  } catch (error) {
    await failTask(task.id, error);
    throw error;
  }
}

export async function listUserTasks(userId: string) {
  const db = await getDbSnapshot();
  return db.imageTasks
    .filter((task) => task.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUserTask(userId: string, taskId: string) {
  const db = await getDbSnapshot();
  return db.imageTasks.find((task) => task.userId === userId && task.id === taskId) || null;
}
