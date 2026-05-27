import "server-only";
import { randomUUID } from "crypto";
import { getDbSnapshot, withDb } from "@/lib/db";
import type {
  CreditPackage,
  CreditPackageId,
  CreditTransactionRecord,
  OrderRecord
} from "@/types/billing";

export const creditPackages: CreditPackage[] = [
  { id: "starter", name: "体验包", priceCny: 6.9, credits: 10, subtitle: "适合轻量体验" },
  { id: "standard", name: "标准包", priceCny: 19.9, credits: 40, subtitle: "适合日常修图" },
  { id: "pro", name: "高级包", priceCny: 49.9, credits: 120, subtitle: "适合内容创作者" },
  { id: "business", name: "专业包", priceCny: 99, credits: 300, subtitle: "适合高频使用" }
];

export class BillingError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "BillingError";
    this.code = code;
    this.status = status;
  }
}

export function unitPrice(packageItem: CreditPackage) {
  return packageItem.priceCny / packageItem.credits;
}

export function findCreditPackage(packageId: string) {
  return creditPackages.find((item) => item.id === packageId);
}

function nowIso() {
  return new Date().toISOString();
}

export async function getCreditBalance(userId: string) {
  const db = await getDbSnapshot();
  return db.users.find((user) => user.id === userId)?.credits ?? 0;
}

export async function assertHasCredits(userId: string) {
  const credits = await getCreditBalance(userId);
  if (credits <= 0) {
    throw new BillingError("INSUFFICIENT_CREDITS", "当前积分不足，请购买积分后继续生成", 402);
  }
  return credits;
}

export async function consumeCredit(userId: string, reason = "图片生成") {
  return withDb((db) => {
    const user = db.users.find((item) => item.id === userId);
    if (!user || user.credits <= 0) {
      throw new BillingError("INSUFFICIENT_CREDITS", "当前积分不足，请购买积分后继续生成", 402);
    }

    user.credits -= 1;
    user.updatedAt = nowIso();
    db.creditTransactions.push({
      id: randomUUID(),
      userId,
      type: "consume",
      amount: -1,
      balanceAfter: user.credits,
      reason,
      createdAt: nowIso()
    });

    return user.credits;
  });
}

export async function listCreditTransactions(userId: string, limit = 50) {
  const db = await getDbSnapshot();
  return db.creditTransactions
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function createOrder(userId: string, packageId: CreditPackageId) {
  const packageItem = findCreditPackage(packageId);
  if (!packageItem) {
    throw new BillingError("INVALID_PACKAGE", "积分包不存在");
  }

  const order: OrderRecord = {
    id: randomUUID(),
    userId,
    packageId: packageItem.id,
    packageName: packageItem.name,
    amountCny: packageItem.priceCny,
    credits: packageItem.credits,
    status: "pending",
    paymentMethod: "manual",
    remark: null,
    createdAt: nowIso(),
    paidAt: null
  };

  await withDb((db) => {
    db.orders.push(order);
  });

  return order;
}

export async function getOrderForUser(orderId: string, userId: string, isAdmin = false) {
  const db = await getDbSnapshot();
  const order = db.orders.find((item) => item.id === orderId);
  if (!order || (!isAdmin && order.userId !== userId)) {
    return null;
  }
  return order;
}

export async function updateOrderRemark(orderId: string, userId: string, remark: string) {
  return withDb((db) => {
    const order = db.orders.find((item) => item.id === orderId && item.userId === userId);
    if (!order) {
      throw new BillingError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    if (order.status !== "pending") {
      throw new BillingError("ORDER_LOCKED", "当前订单状态不可修改");
    }
    order.remark = remark.trim().slice(0, 500);
    return order;
  });
}

export async function listPendingOrders() {
  const db = await getDbSnapshot();
  return db.orders
    .filter((order) => order.status === "pending")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function confirmOrderPaid(orderId: string) {
  return withDb((db) => {
    const order = db.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new BillingError("ORDER_NOT_FOUND", "订单不存在", 404);
    }
    if (order.status === "paid") {
      throw new BillingError("ORDER_ALREADY_PAID", "订单已确认，请勿重复操作");
    }
    if (order.status !== "pending") {
      throw new BillingError("ORDER_NOT_PAYABLE", "当前订单状态不可确认");
    }

    const user = db.users.find((item) => item.id === order.userId);
    if (!user) {
      throw new BillingError("USER_NOT_FOUND", "用户不存在", 404);
    }

    const now = nowIso();
    user.credits += order.credits;
    user.updatedAt = now;
    order.status = "paid";
    order.paidAt = now;

    const transaction: CreditTransactionRecord = {
      id: randomUUID(),
      userId: user.id,
      type: "purchase",
      amount: order.credits,
      balanceAfter: user.credits,
      reason: `购买积分包：${order.packageName}`,
      createdAt: now
    };
    db.creditTransactions.push(transaction);

    return { order, latestCredits: user.credits };
  });
}
