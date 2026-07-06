import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-oud-brown text-oud-ivory shadow-soft hover:bg-oud-coffee disabled:bg-oud-brown/45",
  secondary:
    "border border-oud-brown/20 bg-oud-pearl text-oud-brown hover:bg-oud-beige/45 disabled:text-oud-muted",
  ghost:
    "bg-transparent text-oud-brown hover:bg-oud-beige/45 disabled:text-oud-muted",
  gold:
    "bg-oud-gold text-oud-brown shadow-gold hover:bg-oud-gold/85 disabled:bg-oud-gold/40",
  danger:
    "bg-red-900 text-white hover:bg-red-950 disabled:bg-red-900/45"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 rounded-md px-3 text-xs",
  md: "h-11 rounded-oud px-5 text-sm",
  lg: "h-12 rounded-oud px-7 text-base",
  icon: "size-10 rounded-oud p-0"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-w-0 shrink-0 items-center justify-center gap-2 text-center font-semibold transition duration-200",
        "focus-visible:ring-0 disabled:cursor-not-allowed disabled:shadow-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : leftIcon}
      {isLoading && loadingText ? loadingText : children}
      {!isLoading ? rightIcon : null}
    </button>
  );
}
