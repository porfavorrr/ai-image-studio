"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "产品介绍", href: "/" },
  { label: "模板中心", href: "/templates" },
  { label: "商品图", href: "/product" },
  { label: "封面海报", href: "/poster" },
  { label: "API 平台", href: "/api-platform" }
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-button-gradient text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-normal text-ink">AI 图片助手</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "bg-studio-50 text-studio-700" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden sm:inline-flex">
            登录/注册
          </Button>
          <Link href="/editor">
            <Button size="md">
              立即体验
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
