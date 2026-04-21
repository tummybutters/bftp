interface ReviewCard {
  title: string;
  body: string;
}

function splitReviewBody(body: string) {
  return body
    .replaceAll("‍", "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ReviewGrid({ items }: { items: ReviewCard[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const paragraphs = splitReviewBody(item.body);

        return (
          <article
            key={`${item.title}-${index}`}
            className="rounded-[1.75rem] border border-[color:rgba(31,45,78,0.1)] bg-white p-6 shadow-[0_18px_48px_rgba(31,45,78,0.08)]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-blue)]">
                  Client Review
                </p>
                <h3 className="mt-2 text-xl font-bold text-[color:var(--color-foreground)]">
                  {item.title}
                </h3>
              </div>
              <span className="text-4xl font-black leading-none text-[color:rgba(20,87,184,0.18)]">
                “
              </span>
            </div>
            <div className="space-y-3 text-sm leading-7 text-[color:var(--color-muted)]">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
