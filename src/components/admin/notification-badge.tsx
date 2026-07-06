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
        "absolute -left-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-900 px-1.5 text-[10px] font-bold leading-none text-white shadow-soft",
        className
      )}
      aria-label={`${count} تنبيهات غير مقروءة`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
