import { NextResponse } from "next/server";
import { BillingError, createOrder } from "@/lib/billing";
import { getCurrentUser } from "@/lib/session";
import type { CreditPackageId } from "@/types/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录后再购买积分" } }, { status: 401 });
    }

    const body = (await request.json()) as Partial<{ packageId: CreditPackageId }>;
    const order = await createOrder(user.id, String(body.packageId || "") as CreditPackageId);
    return NextResponse.json({ orderId: order.id, order });
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "ORDER_CREATE_FAILED", message: "订单创建失败，请稍后重试" } }, { status: 500 });
  }
}
