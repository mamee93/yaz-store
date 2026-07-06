import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type PriceProps = HTMLAttributes<HTMLSpanElement> & {
  value: number | string;
  currency?: string;
  locale?: string;
};

export function Price({
  className,
  value,
  currency = "OMR",
  locale = "ar-OM",
  ...props
}: PriceProps) {
  const numericValue = typeof value === "string" ? Number(value) : value;
  const formattedPrice = Number.isFinite(numericValue)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(numericValue)
    : `${value} ${currency}`;

  return (
    <span
      dir="ltr"
      className={cn("inline-flex font-semibold tabular-nums text-oud-brown", className)}
      {...props}
    >
      {formattedPrice}
    </span>
  );
}
