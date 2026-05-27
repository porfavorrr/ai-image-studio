import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createPasswordResetToken } from "@/lib/auth";
import { assertRateLimit, clientIp, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MESSAGE = "如果该邮箱存在，重置链接已生成。";

export async function POST(request: Request) {
  try {
    assertRateLimit(`forgot-password:${clientIp(request)}`, 6, 60_000);
    const body = (await request.json()) as Partial<{ email: string }>;
    const token = (await createPasswordResetToken(body.email)) || randomBytes(32).toString("base64url");

    return NextResponse.json({
      message: MESSAGE,
      resetUrl: `/reset-password?token=${encodeURIComponent(token)}`
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: { code: "RATE_LIMITED", message: error.message } }, { status: 429 });
    }

    return NextResponse.json({ error: { code: "FORGOT_PASSWORD_FAILED", message: "重置链接生成失败，请稍后重试" } }, { status: 500 });
  }
}
