import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function GlowButton({
  children,
  className,
  variant = "primary",
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={cn(
        "hero-button",
        variant === "primary" ? "hero-button-primary" : "hero-button-secondary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}