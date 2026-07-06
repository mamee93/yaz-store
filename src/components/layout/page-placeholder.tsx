type PagePlaceholderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PagePlaceholder({ eyebrow, title, description }: PagePlaceholderProps) {
  return (
    <section className="container-page py-12 md:py-16">
      <div className="surface rounded-oud p-6 md:p-10">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-oud-gold">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-bold text-oud-brown md:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-oud-muted md:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
