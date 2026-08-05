import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  neon?: boolean;
};

export function GlassPanel({
  children,
  className,
  neon = false,
}: GlassPanelProps) {
  return (
    <div className={cn("glass-panel", neon && "neon-border", className)}>
      {children}
    </div>
  );
}