export type CreditTransactionType = "grant" | "consume" | "purchase" | "refund" | "admin_adjust";
export type OrderStatus = "pending" | "paid" | "cancelled";
export type PaymentMethod = "manual" | "wechat" | "alipay" | "stripe";
export type CreditPackageId = "starter" | "standard" | "pro" | "business";

export interface CreditPackage {
  id: CreditPackageId;
  name: string;
  priceCny: number;
  credits: number;
  subtitle: string;
}

export interface CreditTransactionRecord {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  userId: string;
  packageId: CreditPackageId;
  packageName: string;
  amountCny: number;
  credits: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  remark?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

export interface OrderDetailResponse {
  order: OrderRecord;
}

export interface CreditTransactionsResponse {
  transactions: CreditTransactionRecord[];
}
