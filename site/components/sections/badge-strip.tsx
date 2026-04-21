export function BadgeStrip({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="rounded-[2rem] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-blue)]">
        {label}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-[color:var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[color:var(--color-foreground)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
