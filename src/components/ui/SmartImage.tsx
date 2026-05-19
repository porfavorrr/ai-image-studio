"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type SmartImageRatio = "auto" | "1:1" | "4:3" | "16:9" | "3:4" | "9:16";

const ratioClasses: Record<SmartImageRatio, string> = {
  auto: "",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
  "3:4": "aspect-[3/4]",
  "9:16": "aspect-[9/16]"
};

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  ratio?: SmartImageRatio;
  rounded?: boolean;
  shadow?: boolean;
}

export function SmartImage({
  src,
  alt,
  className,
  imageClassName,
  ratio = "auto",
  rounded = true,
  shadow = false
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-white/70 bg-gradient-to-br from-slate-100 via-white to-studio-100",
        rounded && "rounded-2xl",
        shadow && "shadow-card",
        ratioClasses[ratio],
        className
      )}
    >
      {failed ? (
        <div className="flex h-full min-h-[inherit] w-full flex-col items-center justify-center px-5 text-center text-slate-500">
          <ImageOff className="h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-600">{alt || "图片素材"}</p>
          <p className="mt-1 text-xs text-slate-400">素材加载失败，可在 mock-images.ts 中替换</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
