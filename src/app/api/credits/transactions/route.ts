import { NextResponse } from "next/server";
import { listCreditTransactions } from "@/lib/billing";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录" } }, { status: 401 });
  }

  const transactions = await listCreditTransactions(user.id, 50);
  return NextResponse.json({ transactions });
}
