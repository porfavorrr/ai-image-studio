"use client";

import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";

interface BeforeAfterProps {
  before?: string | null;
  after?: string | null;
}

export function BeforeAfter({ before, after }: BeforeAfterProps) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-studio-600">对比预览</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Before / After</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">左右分屏</span>
      </div>
      <div className="relative h-[280px] overflow-hidden rounded-lg border border-line bg-slate-100">
        {before && after ? (
          <>
            <SmartImage
              src={before}
              alt="Before"
              className="absolute inset-0 h-full w-1/2 rounded-none border-0"
              imageClassName="object-left"
            />
            <SmartImage
              src={after}
              alt="After"
              className="absolute inset-y-0 right-0 h-full w-1/2 rounded-none border-0"
              imageClassName="object-right"
            />
            <div className="absolute inset-y-0 left-1/2 w-px bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.08)]" />
            <span className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-xs font-semibold text-slate-700">
              原图
            </span>
            <span className="absolute right-4 top-4 rounded-full bg-studio-600 px-3 py-1 text-xs font-semibold text-white">
              当前版本
            </span>
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-muted">
            完成一次生成后即可查看前后对比
          </div>
        )}
      </div>
    </Card>
  );
}
