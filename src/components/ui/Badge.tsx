import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "gray" | "green" | "purple" | "amber";

const variants: Record<BadgeVariant, string> = {
  blue: "bg-studio-100 text-studio-700 ring-studio-100",
  gray: "bg-slate-100 text-slate-600 ring-slate-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  purple: "bg-violet-50 text-violet-700 ring-violet-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100"
};

export function Badge({
  className,
  variant = "blue",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
