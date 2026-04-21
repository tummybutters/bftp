import Link from "next/link";

interface SplitChecklistProps {
  heading: string;
  body: string;
  groups: Array<{ items: string[] }>;
  ctaLabel?: string;
  ctaHref?: string;
}

function splitBody(body: string) {
  return body
    .replaceAll("\u200d", "\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
}

export function SplitChecklist({
  heading,
  body,
  groups,
  ctaLabel = "Schedule Service",
  ctaHref = "/contact-backflowtestpros",
}: SplitChecklistProps) {
  const allItems = groups.flatMap((g) => g.items);
  const mid = Math.ceil(allItems.length / 2);
  const col1 = allItems.slice(0, mid);
  const col2 = allItems.slice(mid);
  const paragraphs = splitBody(body);

  return (
    <div className="bftp-split-check">
      <div className="bftp-split-check__text">
        <h2 className="bftp-split-check__heading">{heading}</h2>
        {paragraphs.map((p) => (
          <p key={p} className="bftp-split-check__copy">{p}</p>
        ))}
        <Link href={ctaHref} className="bftp-cta-button">
          {ctaLabel}
        </Link>
      </div>
      <div className="bftp-split-check__list">
        <div className="bftp-split-check__col">
          {col1.map((item) => (
            <div key={item} className="bftp-split-check__item">
              <svg
                className="bftp-split-check__check"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 10.5L8 14.5L16 6.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="bftp-split-check__col">
          {col2.map((item) => (
            <div key={item} className="bftp-split-check__item">
              <svg
                className="bftp-split-check__check"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 10.5L8 14.5L16 6.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
