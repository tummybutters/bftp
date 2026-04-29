import type { LinkItem } from "@/lib/site-schema";
import { TrackedLink } from "@/lib/analytics/tracked-link";

export function LinkGrid({
  items,
  variant = "directory",
}: {
  items: LinkItem[];
  variant?: "directory" | "compact" | "county-directory";
}) {
  const isCountyDirectory = variant === "county-directory";
  const columns = isCountyDirectory ? (items.length > 4 ? 3 : 2) : items.length > 12 ? 1 : items.length > 6 ? 2 : 3;

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
      data-variant={variant}
      style={{ ["--bftp-link-columns" as string]: String(columns) }}
    >
      <ul className="bftp-link-list__grid">
        {items.map((item, index) => (
          <li
            key={`${item.href}-${item.label}-${index}`}
            className={`bftp-link-list__item${
              isCountyDirectory ? " bftp-link-list__item--county-directory" : ""
            }`}
          >
            <TrackedLink
              href={item.href}
              event="link_grid_clicked"
              properties={{ label: item.label }}
              className={isCountyDirectory ? "bftp-link-list__county-link" : undefined}
              external={item.external}
              target={item.target}
            >
              {isCountyDirectory ? (
                <>
                  <span className="bftp-link-list__county-name">{item.label}</span>
                  {item.description ? (
                    <span className="bftp-link-list__county-description">{item.description}</span>
                  ) : null}
                </>
              ) : (
                item.label
              )}
            </TrackedLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
