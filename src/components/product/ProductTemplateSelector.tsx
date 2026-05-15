"use client";

import { Gift, Heart, Package, Sparkles } from "lucide-react";
import { productTemplateLabels } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { ProductTemplate } from "@/types/image";

const templateOptions: Array<{
  key: ProductTemplate;
  description: string;
  icon: typeof Package;
}> = [
  { key: "white-bg", description: "平台主图、详情首屏", icon: Package },
  { key: "lifestyle", description: "真实场景、提升想象", icon: Heart },
  { key: "festival", description: "节日促销、礼盒氛围", icon: Gift },
  { key: "social", description: "内容平台种草封面", icon: Sparkles }
];

interface ProductTemplateSelectorProps {
  value: ProductTemplate;
  onChange: (value: ProductTemplate) => void;
}

export function ProductTemplateSelector({ value, onChange }: ProductTemplateSelectorProps) {
  return (
    <div className="grid gap-3">
      {templateOptions.map((option) => {
        const Icon = option.icon;
        const active = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            className={cn(
              "flex items-center gap-4 rounded-lg border p-4 text-left transition",
              active
                ? "border-studio-500 bg-studio-50 shadow-sm"
                : "border-line bg-white hover:border-studio-200 hover:bg-studio-50/60"
            )}
            onClick={() => onChange(option.key)}
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg",
                active ? "bg-studio-600 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-ink">{productTemplateLabels[option.key]}</span>
              <span className="mt-1 block text-sm text-muted">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
