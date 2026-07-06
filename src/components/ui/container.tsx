import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ContainerSize = "default" | "narrow" | "wide";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: ContainerSize;
};

const containerSizes: Record<ContainerSize, string> = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl"
};

export function Container({ className, size = "default", ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", containerSizes[size], className)}
      {...props}
    />
  );
}
