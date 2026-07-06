type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ eyebrow, title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold text-oud-gold">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-3xl font-bold text-oud-brown md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-oud-muted">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
