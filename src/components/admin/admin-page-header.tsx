type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ eyebrow, title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold text-oud-gold">{eyebrow}</p> : null}
        <h1 className="mt-2 text-pretty font-display text-2xl font-bold text-oud-brown sm:text-3xl md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-oud-muted">{description}</p>
      </div>
      {action ? <div className="w-full shrink-0 md:w-auto">{action}</div> : null}
    </div>
  );
}
