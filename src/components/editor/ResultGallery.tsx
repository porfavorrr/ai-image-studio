"use client";

import { CheckCircle2, Download, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";
import { downloadImage } from "@/lib/api-client";
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
          <h2 className="mt-1 text-xl font-bold text-ink">{results.length} 张候选效果</h2>
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
              <div
                key={result.id}
                className={cn(
                  "group overflow-hidden rounded-lg border bg-white text-left transition duration-200",
                  active ? "border-studio-500 shadow-lg shadow-indigo-500/15" : "border-line hover:-translate-y-1 hover:shadow-card"
                )}
              >
                <button type="button" className="relative block w-full text-left" onClick={() => onSelect(result)}>
                  <SmartImage src={result.url} alt={result.label} className="h-[270px] w-full rounded-none border-0" />
                  {active ? (
                    <span className="absolute right-3 top-3 rounded-full bg-studio-600 p-1 text-white shadow-lg">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : null}
                </button>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <button type="button" className="flex min-w-0 items-center gap-2" onClick={() => onSelect(result)}>
                    <ImageIcon className="h-4 w-4 shrink-0 text-studio-500" />
                    <span className="truncate text-sm font-semibold text-ink">{result.label}</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-slate-600 transition hover:border-studio-200 hover:bg-studio-50 hover:text-studio-700"
                    aria-label={`下载${result.label}`}
                    onClick={() => downloadImage(result.url)}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
