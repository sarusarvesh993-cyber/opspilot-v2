import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionLabelProps = {
  children: ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 shadow-[0_0_30px_rgba(139,92,246,0.10)]",
        className
      )}
    >
      {children}
    </div>
  );
}