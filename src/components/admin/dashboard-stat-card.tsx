import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";

type DashboardStatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
};

const toneStyles = {
  default: "bg-oud-brown text-oud-gold",
  warning: "bg-oud-gold/20 text-oud-brown",
  success: "bg-green-900/10 text-green-900"
};

export function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default"
}: DashboardStatCardProps) {
  return (
    <Card className="p-5 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-oud-muted">{title}</p>
          <p className="mt-3 text-3xl font-bold text-oud-brown">{value}</p>
        </div>
        <span className={cn("grid size-11 place-items-center rounded-oud", toneStyles[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-xs leading-6 text-oud-muted">{description}</p>
    </Card>
  );
}
