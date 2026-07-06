import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/utils/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-oud border border-dashed border-oud-brown/20 bg-oud-pearl px-5 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-oud-beige/45 text-oud-brown">
        {icon ?? <SearchX className="size-5" aria-hidden="true" />}
      </div>
      <h3 className="font-display text-xl font-bold text-oud-brown">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-7 text-oud-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
