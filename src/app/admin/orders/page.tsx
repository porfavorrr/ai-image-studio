"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, getImageErrorMessage } from "@/lib/api-client";
import type { OrderRecord } from "@/types/billing";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(() => {
    setLoading(true);
    apiClient
      .listAdminOrders()
      .then((response) => setOrders(response.orders))
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleConfirm = async (orderId: string) => {
    setConfirmingId(orderId);
    setError("");

    try {
      await apiClient.confirmAdminOrder(orderId);
      setOrders((items) => items.filter((item) => item.id !== orderId));
    } catch (requestError) {
      setError(getImageErrorMessage(requestError));
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold text-studio-600">管理员</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">待确认订单</h1>
      </div>

      {error ? <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      {loading ? (
        <Card className="h-56 animate-pulse p-6" />
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center text-sm font-semibold text-muted">当前没有待确认订单。</Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-studio-600">{order.packageName}</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">
                    ¥{order.amountCny} / {order.credits} 积分
                  </h2>
                  <p className="mt-2 text-sm text-muted">用户：{order.userId}</p>
                  <p className="mt-1 text-sm text-muted">备注：{order.remark || "未填写"}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(order.createdAt).toLocaleString("zh-CN")}</p>
                </div>
                <Button loading={confirmingId === order.id} onClick={() => handleConfirm(order.id)}>
                  确认收款
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
