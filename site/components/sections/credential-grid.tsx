interface CredentialItem {
  title: string;
  body: string;
}

export function CredentialGrid({ items }: { items: CredentialItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={`${item.title}-${index}`}
          className="rounded-[1.4rem] border border-[color:rgba(20,87,184,0.12)] bg-[color:rgba(20,87,184,0.04)] px-5 py-4 text-center shadow-[0_12px_30px_rgba(31,45,78,0.06)]"
        >
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-blue)]">
            {item.title}
          </h3>
          {item.body ? (
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
              {item.body}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
