import type { LinkItem } from "@/lib/site-schema";
import { TrackedLink } from "@/lib/analytics/tracked-link";

export function LinkGrid({
  items,
  variant = "directory",
}: {
  items: LinkItem[];
  variant?: "directory" | "compact";
}) {
  const columns = items.length > 12 ? 1 : items.length > 6 ? 2 : 3;

  return (
    <div
      className={
        columns === 1
          ? `bftp-link-list bftp-link-list--single ${
              variant === "compact" ? "bftp-link-list--compact" : ""
            }`
          : `bftp-link-list ${
              variant === "compact" ? "bftp-link-list--compact" : ""
            }`
      }
      style={{ ["--bftp-link-columns" as string]: String(columns) }}
    >
      <ul className="bftp-link-list__grid">
        {items.map((item, index) => (
          <li
            key={`${item.href}-${item.label}-${index}`}
            className="bftp-link-list__item"
          >
            <TrackedLink
              href={item.href}
              event="link_grid_clicked"
              properties={{ label: item.label }}
              external={item.external}
              target={item.target}
            >
              {item.label}
            </TrackedLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
