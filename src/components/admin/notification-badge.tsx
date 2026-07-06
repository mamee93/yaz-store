import { cn } from "@/utils/cn";

type NotificationBadgeProps = {
  count: number;
  className?: string;
};

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "absolute -left-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-900 px-1 text-[9px] font-bold leading-none text-white shadow-soft md:min-h-5 md:min-w-5 md:px-1.5 md:text-[10px]",
        className
      )}
      aria-label={`${count} تنبيهات غير مقروءة`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
