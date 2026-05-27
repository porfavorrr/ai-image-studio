import { NextResponse } from "next/server";
import { createCaptchaChallenge } from "@/lib/captcha";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(createCaptchaChallenge());
}
