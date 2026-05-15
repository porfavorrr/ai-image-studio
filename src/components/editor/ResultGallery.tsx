"use client";

import { CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { EditImageResult } from "@/types/image";

interface ResultGalleryProps {
  results: EditImageResult[];
  selectedId?: string;
  loading?: boolean;
  placeholder?: boolean;
  onSelect: (result: EditImageResult) => void;
}

export function ResultGallery({ results, selectedId, loading, placeholder, onSelect }: ResultGalleryProps) {
  return (
    <Card className="min-h-[420px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-studio-600">生成结果</p>
          <h2 className="mt-1 text-xl font-bold text-ink">3 张候选效果</h2>
        </div>
        {placeholder ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">示例</span>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[315px] animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {results.map((result) => {
            const active = selectedId === result.id;
            return (
              <button
                key={result.id}
                type="button"
                className={cn(
                  "group overflow-hidden rounded-lg border bg-white text-left transition duration-200",
                  active ? "border-studio-500 shadow-lg shadow-indigo-500/15" : "border-line hover:-translate-y-1 hover:shadow-card"
                )}
                onClick={() => onSelect(result)}
              >
                <div className="relative">
                  <img src={result.url} alt={result.label} className="h-[270px] w-full object-cover" />
                  {active ? (
                    <span className="absolute right-3 top-3 rounded-full bg-studio-600 p-1 text-white shadow-lg">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <ImageIcon className="h-4 w-4 text-studio-500" />
                  <span className="text-sm font-semibold text-ink">{result.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
