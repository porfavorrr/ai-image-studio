import { NextResponse } from "next/server";
import { BillingError, getOrderForUser, updateOrderRemark } from "@/lib/billing";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录后查看订单" } }, { status: 401 });
  }

  const order = await getOrderForUser(params.id, user.id, user.role === "admin");
  if (!order) {
    return NextResponse.json({ error: { code: "ORDER_NOT_FOUND", message: "订单不存在" } }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录后更新订单" } }, { status: 401 });
    }

    const body = (await request.json()) as Partial<{ remark: string }>;
    const order = await updateOrderRemark(params.id, user.id, String(body.remark || ""));
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "ORDER_UPDATE_FAILED", message: "订单更新失败，请稍后重试" } }, { status: 500 });
  }
}
