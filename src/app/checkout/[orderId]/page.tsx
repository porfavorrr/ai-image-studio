"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, getImageErrorMessage } from "@/lib/api-client";
import type { OrderRecord } from "@/types/billing";

const statusLabels: Record<OrderRecord["status"], string> = {
  pending: "待确认",
  paid: "已完成，积分已到账",
  cancelled: "已取消"
};

export default function CheckoutPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient
      .getOrder(params.orderId)
      .then((response) => {
        setOrder(response.order);
        setRemark(response.order.remark || "");
      })
      .catch(() => router.push("/pricing"))
      .finally(() => setLoading(false));
  }, [params.orderId, router]);

  const handleSaveRemark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.updateOrderRemark(order.id, { remark });
      setOrder(response.order);
      setMessage("备注已保存，等待管理员确认。");
    } catch (requestError) {
      setError(getImageErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-[1000px] px-5 py-10">
        <Card className="h-[420px] animate-pulse p-6" />
      </main>
    );
  }

  if (!order) return null;

  return (
    <main className="mx-auto max-w-[1000px] px-5 py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold text-studio-600">订单确认</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">手动支付积分订单</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-ink">订单信息</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info label="套餐" value={order.packageName} />
            <Info label="价格" value={`¥${order.amountCny}`} />
            <Info label="积分数" value={`${order.credits} 积分`} />
            <Info label="订单状态" value={statusLabels[order.status]} />
          </div>

          <div className="mt-6 rounded-lg border border-studio-200 bg-studio-50 p-4 text-sm leading-6 text-studio-800">
            当前版本为人工确认支付。请通过微信或支付宝完成转账后，联系管理员确认订单。确认后积分将自动增加到账户。
          </div>

          <form className="mt-6" onSubmit={handleSaveRemark}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">付款备注或联系方式</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-studio-400 focus:ring-4 focus:ring-studio-500/10"
              />
            </label>
            {message ? <p className="mt-3 text-sm font-semibold text-emerald-600">{message}</p> : null}
            {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
            <div className="mt-4 flex gap-3">
              <Button type="submit" loading={saving}>
                保存备注
              </Button>
              <Link href="/account">
                <Button variant="outline">返回账户中心</Button>
              </Link>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-ink">收款码</h2>
          <div className="mt-5 flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm font-semibold text-muted">
            请在正式部署时替换为公司收款码
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            转账后请填写备注，管理员确认收款后，积分会自动到账。
          </p>
        </Card>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
