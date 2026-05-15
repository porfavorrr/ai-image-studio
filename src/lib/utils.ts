import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsageCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)} 万人使用`;
  }

  return `${value.toLocaleString("zh-CN")} 人使用`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
