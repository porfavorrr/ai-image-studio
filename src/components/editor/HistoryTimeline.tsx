"use client";

import { Clock3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";
import type { HistoryItem } from "@/types/image";

interface HistoryTimelineProps {
  items: HistoryItem[];
}

export function HistoryTimeline({ items }: HistoryTimelineProps) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Clock3 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-studio-600">编辑历史</p>
          <h2 className="text-xl font-bold text-ink">从上传到当前版本</h2>
        </div>
      </div>

      <div className="scrollbar-soft flex gap-4 overflow-x-auto pb-2">
        {items.length === 0 ? (
          <div className="min-w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-muted">
            本次编辑记录会在生成后显示。完整历史记录可在个人账户中查看。
          </div>
        ) : null}
        {items.map((item, index) => (
          <div key={item.id} className="min-w-[190px] rounded-lg border border-line bg-slate-50 p-3">
            <div className="relative h-24 overflow-hidden rounded-lg bg-white">
              <SmartImage src={item.thumbnail} alt={item.title} className="h-full w-full rounded-none border-0" />
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-600">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-xs text-muted">
              {new Date(item.createdAt).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
