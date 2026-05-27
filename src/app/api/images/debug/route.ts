import { NextResponse } from "next/server";
import { getImageProviderService } from "@/lib/server/image-provider";

export const runtime = "nodejs";

function getCodexApiBaseUrl() {
  return (process.env.CODEX_IMAGE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
}

async function checkCodex() {
  const provider = (process.env.IMAGE_PROVIDER || "codex").toLowerCase();
  if (provider !== "codex") return null;

  try {
    const response = await fetch(`${getCodexApiBaseUrl()}/health`, { cache: "no-store" });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "图片服务连接失败" };
  }
}

export async function GET() {
  const provider = getImageProviderService();
  return NextResponse.json({
    imageApiMode: process.env.IMAGE_API_MODE || "mock",
    provider: provider.name,
    usingMock: provider.name === "mock",
    codex: {
      baseUrl: getCodexApiBaseUrl(),
      health: await checkCodex()
    }
  });
}
