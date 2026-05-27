"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";
import { apiClient } from "@/lib/api-client";
import { templates as fallbackTemplates } from "@/lib/studio-content";
import { cn, formatUsageCount } from "@/lib/utils";
import type { TemplateCategory, TemplateItem } from "@/types/template";

const categories: Array<"全部" | TemplateCategory> = ["全部", "修图", "商品图", "封面海报", "头像", "运营活动"];

export function TemplateLibrary() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("全部");
  const [items, setItems] = useState<TemplateItem[]>(fallbackTemplates);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .listTemplates()
      .then(setItems)
      .catch(() => setItems(fallbackTemplates))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === "全部") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-studio-600">模板中心</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">把常见图片任务沉淀成可复用模板</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                activeCategory === category
                  ? "bg-studio-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-white text-slate-600 ring-1 ring-line hover:bg-studio-50 hover:text-studio-700"
              )}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="h-[360px] animate-pulse rounded-lg bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredItems.map((template) => (
            <Card
              key={template.id}
              className="group overflow-hidden hover:-translate-y-1 hover:border-studio-200 hover:shadow-soft"
            >
              <div className="relative">
                <SmartImage src={template.thumbnail} alt={template.name} className="h-56 w-full rounded-none border-0" />
                <Badge className="absolute left-3 top-3 bg-white/88 text-studio-700 ring-white/80">
                  {template.category}
                </Badge>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-ink">{template.name}</h2>
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Flame className="h-3.5 w-3.5" />
                    热门
                  </span>
                </div>
                <p className="mt-2 min-h-[48px] text-sm leading-6 text-muted">{template.description}</p>
                <p className="mt-3 text-xs font-semibold text-studio-600">{formatUsageCount(template.usageCount)}</p>
                <Link href={template.route} className="mt-4 block">
                  <Button variant="outline" className="w-full">
                    使用模板
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
