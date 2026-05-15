"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-button-gradient text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/25 active:scale-[0.98]",
  secondary: "bg-white text-ink shadow-sm ring-1 ring-line hover:bg-slate-50 active:scale-[0.98]",
  outline: "border border-line bg-white/70 text-ink hover:border-studio-200 hover:bg-studio-50 active:scale-[0.98]",
  ghost: "bg-transparent text-muted hover:bg-slate-100 hover:text-ink active:scale-[0.98]",
  dark: "bg-slate-950 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-200",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-500/20",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
);

Button.displayName = "Button";
