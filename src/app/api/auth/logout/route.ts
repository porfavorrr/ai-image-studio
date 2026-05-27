import { NextResponse } from "next/server";
import { destroyUserSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  await destroyUserSession();
  return NextResponse.json({ ok: true });
}
