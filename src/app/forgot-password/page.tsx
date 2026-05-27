"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, getImageErrorMessage } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResetUrl(null);

    try {
      const response = await apiClient.forgotPassword({ email });
      setMessage(response.message);
      setResetUrl(response.resetUrl);
    } catch (requestError) {
      setError(getImageErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px] items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md p-7">
        <p className="text-sm font-semibold text-studio-600">找回密码</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">生成本地重置链接</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          当前为本地开发模式，提交后会在页面上显示可用的重置链接。后续接入邮件服务后，可发送到用户邮箱。
        </p>

        {error ? <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
        {message ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        {resetUrl ? (
          <div className="mt-4 rounded-lg border border-line bg-slate-50 p-4">
            <p className="text-xs font-semibold text-muted">本地重置链接</p>
            <Link href={resetUrl} className="mt-2 block break-all text-sm font-semibold text-studio-700 underline">
              {resetUrl}
            </Link>
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">邮箱</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-4 text-sm outline-none transition focus:border-studio-400 focus:ring-4 focus:ring-studio-500/10"
            />
          </label>
          <Button type="submit" size="lg" loading={loading} className="w-full">
            生成重置链接
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          想起密码了？{" "}
          <Link href="/login" className="font-semibold text-studio-700">
            返回登录
          </Link>
        </p>
      </Card>
    </main>
  );
}
