"use client";

import { useRef, useState } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  value?: string | null;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
  onImageSelected: (imageUrl: string, file: File) => void;
}

export function UploadDropzone({
  value,
  title = "上传图片",
  subtitle = "支持点击或拖拽上传 PNG、JPG、WebP",
  compact = false,
  className,
  onImageSelected
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const readFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onImageSelected(String(reader.result), file);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-dashed transition duration-200",
        "bg-white/80 hover:border-studio-300 hover:bg-studio-50/60",
        isDragging ? "border-studio-500 bg-studio-50" : "border-slate-300",
        compact ? "min-h-[220px]" : "min-h-[320px]",
        className
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        readFile(event.dataTransfer.files[0]);
      }}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 cursor-pointer"
        aria-label={title}
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => readFile(event.target.files?.[0])}
      />

      {value ? (
        <img src={value} alt="上传预览" className="h-full min-h-[inherit] w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[inherit] flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-button-gradient text-white shadow-lg shadow-indigo-500/20">
            {compact ? <ImagePlus className="h-7 w-7" /> : <UploadCloud className="h-8 w-8" />}
          </div>
          <p className="text-lg font-semibold text-ink">{title}</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{subtitle}</p>
          <div className="mt-5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            拖到这里即可开始
          </div>
        </div>
      )}

      {value ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 rounded-lg bg-white/88 px-4 py-3 text-sm text-slate-700 opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100">
          点击重新上传或拖拽替换图片
        </div>
      ) : null}
    </div>
  );
}
