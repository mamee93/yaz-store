import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "gold" | "soft" | "success" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const badgeVariants: Record<BadgeVariant, string> = {
  default: "border-oud-brown/15 bg-oud-pearl text-oud-brown",
  gold: "border-oud-gold/35 bg-oud-gold/15 text-oud-brown",
  soft: "border-oud-beige bg-oud-beige/45 text-oud-muted",
  success: "border-green-900/15 bg-green-900/10 text-green-900",
  danger: "border-red-900/15 bg-red-900/10 text-red-900"
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
