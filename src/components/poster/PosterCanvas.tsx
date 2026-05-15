"use client";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { PosterRatio, PosterStyle } from "@/types/image";

const ratioClasses: Record<PosterRatio, string> = {
  "3:4": "aspect-[3/4]",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "4:5": "aspect-[4/5]"
};

const styleCopy: Record<PosterStyle, string> = {
  clean: "蓝白清爽",
  premium: "高级质感",
  cute: "轻快亲和",
  tech: "科技秩序",
  handdrawn: "手绘感"
};

interface PosterCanvasProps {
  title: string;
  subtitle: string;
  style: PosterStyle;
  ratio: PosterRatio;
  palette: string[];
  variantIndex: number;
}

export function PosterCanvas({ title, subtitle, style, ratio, palette, variantIndex }: PosterCanvasProps) {
  const alignLeft = variantIndex % 3 === 1;
  const compact = ratio === "16:9";

  return (
    <div className="flex min-h-[620px] items-center justify-center rounded-lg border border-line bg-slate-100 p-6 studio-grid">
      <div
        className={cn(
          "relative max-h-[590px] w-full max-w-[430px] overflow-hidden rounded-lg border border-white/80 shadow-2xl",
          ratioClasses[ratio],
          ratio === "16:9" && "max-w-[680px]",
          ratio === "9:16" && "max-w-[330px]"
        )}
        style={{
          background: `linear-gradient(145deg, ${palette[0]} 0%, ${palette[1]} 56%, ${palette[2]} 100%)`
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.38)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.28)_1px,transparent_1px)] bg-[length:34px_34px]" />
        <div className="absolute left-0 top-0 h-full w-3 bg-white/45" />
        <div className="absolute bottom-0 right-0 h-28 w-2/3 bg-white/22" />
        <div className="absolute right-7 top-7 rounded-lg border border-white/55 bg-white/38 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur">
          {styleCopy[style]}
        </div>

        <div
          className={cn(
            "relative z-10 flex h-full flex-col p-8 text-slate-950",
            compact ? "justify-center" : "justify-between",
            alignLeft ? "items-start text-left" : "items-center text-center"
          )}
        >
          <div className={cn("w-full", compact && "max-w-[520px]")}>
            <Badge variant="blue" className="bg-white/72 text-studio-700 ring-white/70">
              精选封面
            </Badge>
            <h2
              className={cn(
                "mt-5 font-bold leading-tight tracking-normal",
                compact ? "text-4xl" : "text-5xl",
                ratio === "9:16" && "text-4xl"
              )}
            >
              {title || "输入封面标题"}
            </h2>
            <p className={cn("mt-4 leading-7 text-slate-700", compact ? "text-base" : "text-lg")}>
              {subtitle || "输入副标题，让信息更完整"}
            </p>
          </div>

          {!compact ? (
            <div className={cn("mt-8 w-full rounded-lg border border-white/60 bg-white/46 p-4 backdrop-blur", alignLeft ? "max-w-[88%]" : "max-w-[78%]")}>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-16 rounded-lg bg-white/80" />
                <div className="h-16 rounded-lg bg-white/58" />
                <div className="h-16 rounded-lg bg-white/80" />
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/76" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-white/58" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
