"use client";

import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { PosterImageResult } from "@/types/image";

interface PosterVariantsProps {
  results: PosterImageResult[];
  activeId: string;
  loading?: boolean;
  onSelect: (result: PosterImageResult, index: number) => void;
}

export function PosterVariants({ results, activeId, loading, onSelect }: PosterVariantsProps) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-studio-600">更多版式推荐</p>
          <h2 className="mt-1 text-xl font-bold text-ink">候选海报缩略图</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">6 个版式</span>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {results.map((result, index) => {
            const active = activeId === result.id;
            return (
              <button
                key={result.id}
                type="button"
                className={cn(
                  "group overflow-hidden rounded-lg border bg-white text-left transition hover:-translate-y-1 hover:shadow-card",
                  active ? "border-studio-500 shadow-lg shadow-indigo-500/15" : "border-line"
                )}
                onClick={() => onSelect(result, index)}
              >
                <div className="relative">
                  <img src={result.url} alt={result.title} className="h-44 w-full object-cover" />
                  {active ? (
                    <span className="absolute right-2 top-2 rounded-full bg-studio-600 p-1 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
                <p className="px-3 py-3 text-sm font-semibold text-ink">{result.title}</p>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
