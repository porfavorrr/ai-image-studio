"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, getImageErrorMessage, isUnauthorizedError } from "@/lib/api-client";
import { creditPackages, unitPrice } from "@/lib/billing";
import type { CreditPackageId } from "@/types/billing";

export default function PricingPage() {
  const router = useRouter();
  const [loadingPackage, setLoadingPackage] = useState<CreditPackageId | null>(null);
  const [error, setError] = useState("");

  const handleBuy = async (packageId: CreditPackageId) => {
    setLoadingPackage(packageId);
    setError("");

    try {
      const response = await apiClient.createOrder({ packageId });
      router.push(`/checkout/${response.orderId}`);
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        router.push("/login?redirect=/pricing");
        return;
      }
      setError(getImageErrorMessage(requestError));
    } finally {
      setLoadingPackage(null);
    }
  };

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold text-studio-600">购买积分</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">选择适合你的积分包</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
          新用户注册赠送 1 次免费生成，积分用完后可按需购买。每次生成消耗 1 积分。
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {creditPackages.map((item) => (
          <Card key={item.id} className="flex flex-col p-6 hover:-translate-y-1 hover:border-studio-200 hover:shadow-soft">
            <h2 className="text-xl font-bold text-ink">{item.name}</h2>
            <p className="mt-2 text-sm text-muted">{item.subtitle}</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-ink">¥{item.priceCny}</span>
              <span className="ml-2 text-sm font-semibold text-muted">/ {item.credits} 次</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-studio-600">¥{unitPrice(item).toFixed(2)}/次</p>
            <div className="mt-6 grid gap-3 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item.credits} 个生成积分
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                手动确认后到账
              </p>
            </div>
            <Button className="mt-6 w-full" loading={loadingPackage === item.id} onClick={() => handleBuy(item.id)}>
              购买积分
            </Button>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
