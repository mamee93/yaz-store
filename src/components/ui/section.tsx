import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type SectionTone = "default" | "ivory" | "beige" | "brown";

type SectionProps = HTMLAttributes<HTMLElement> & {
  tone?: SectionTone;
};

const sectionTones: Record<SectionTone, string> = {
  default: "",
  ivory: "bg-oud-ivory",
  beige: "bg-oud-beige/35",
  brown: "bg-oud-brown text-oud-ivory"
};

export function Section({ className, tone = "default", ...props }: SectionProps) {
  return (
    <section
      className={cn("py-10 md:py-16", sectionTones[tone], className)}
      {...props}
    />
  );
}
