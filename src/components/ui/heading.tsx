import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type HeadingLevel = 1 | 2 | 3 | 4;
type HeadingTone = "default" | "light" | "muted";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: HeadingLevel;
  eyebrow?: string;
  description?: string;
  tone?: HeadingTone;
};

const titleSizes: Record<HeadingLevel, string> = {
  1: "text-3xl leading-tight sm:text-4xl md:text-5xl",
  2: "text-2xl leading-tight sm:text-3xl md:text-4xl",
  3: "text-xl leading-8 sm:text-2xl sm:leading-9",
  4: "text-xl leading-8"
};

const toneStyles: Record<HeadingTone, string> = {
  default: "text-oud-brown",
  light: "text-oud-ivory",
  muted: "text-oud-ink"
};

export function Heading({
  className,
  level = 2,
  eyebrow,
  description,
  tone = "default",
  children,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as ElementType;
  const descriptionColor = tone === "light" ? "text-oud-beige" : "text-oud-muted";

  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-oud-gold">
          {eyebrow}
        </p>
      ) : null}
      <Tag
        className={cn("max-w-full text-pretty font-display font-bold", titleSizes[level], toneStyles[tone])}
        {...props}
      >
        {children}
      </Tag>
      {description ? (
        <p className={cn("max-w-2xl text-sm leading-7 md:text-base", descriptionColor)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
