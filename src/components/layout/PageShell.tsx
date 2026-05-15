import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("min-h-screen bg-studio-glow", className)}>
      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8">{children}</div>
    </main>
  );
}
