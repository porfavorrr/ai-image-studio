import { NextResponse } from "next/server";
import { BillingError, confirmOrderPaid } from "@/lib/billing";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录" } }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "没有管理员权限" } }, { status: 403 });
    }

    const result = await confirmOrderPaid(params.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "ORDER_CONFIRM_FAILED", message: "确认订单失败，请稍后重试" } }, { status: 500 });
  }
}
