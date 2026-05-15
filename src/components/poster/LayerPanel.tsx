"use client";

import { Eye, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/Card";

const layers = ["标题层", "副标题层", "装饰元素", "背景图层"];

export function LayerPanel() {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-studio-600">图层管理</p>
        <h2 className="mt-1 text-xl font-bold text-ink">画布元素</h2>
      </div>
      <div className="grid gap-2">
        {layers.map((layer) => (
          <div key={layer} className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">{layer}</span>
            </div>
            <Eye className="h-4 w-4 text-slate-400" />
          </div>
        ))}
      </div>
    </Card>
  );
}
