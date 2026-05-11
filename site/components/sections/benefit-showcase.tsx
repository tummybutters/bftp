import Image from "next/image";
import Link from "next/link";

interface BenefitItem {
  title: string;
  body: string;
  icon?: {
    src?: string | null;
    alt?: string | null;
  } | null;
}

const SERVICE_AREA_CARD_PATHS: Record<string, string> = {
  "ventura county": "/ventura-county-backflow-testing-installation-repair-service-areas",
  "los angeles county": "/los-angeles-county-backflow-testing-installation-repair-service-areas",
  "orange county": "/orange-county-backflow-testing-installation-repair-service-areas",
  "san bernardino county":
    "/san-bernardino-county-backflow-testing-installation-repair-service-areas",
  "riverside county": "/riverside-county-backflow-testing-installation-repair-service-areas",
  "san diego county": "/san-diego-county-backflow-testing-installation-repair-service-areas",
};

function splitHeading(heading: string) {
  const normalized = heading.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return { primary: "", secondary: "" };
  }

  const words = normalized.split(" ");

  if (words.length < 5) {
    return { primary: normalized, secondary: "" };
  }

  let bestSplit = Math.ceil(words.length / 2);
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let index = 2; index <= words.length - 2; index += 1) {
    const primaryLength = words.slice(0, index).join(" ").length;
    const secondaryLength = words.slice(index).join(" ").length;
    const delta = Math.abs(primaryLength - secondaryLength);

    if (delta < bestDelta) {
      bestDelta = delta;
      bestSplit = index;
    }
  }

  return {
    primary: words.slice(0, bestSplit).join(" "),
    secondary: words.slice(bestSplit).join(" "),
  };
}

function normalizeBody(body: string) {
  return body
    .replaceAll("\u200d", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveBenefitHref(title: string) {
  const normalized = title.toLowerCase();

  for (const [countyName, href] of Object.entries(SERVICE_AREA_CARD_PATHS)) {
    if (normalized.includes(countyName)) {
      return href;
    }
  }

  return null;
}

export function BenefitShowcase({
  heading,
  body,
  items,
  ctaLabel,
  ctaHref,
}: {
  heading: string;
  body: string;
  items: BenefitItem[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const { primary, secondary } = splitHeading(heading);
  const gridClassName =
    items.length === 6
      ? "bftp-benefit-showcase__grid bftp-benefit-showcase__grid--three-up"
      : "bftp-benefit-showcase__grid";

  return (
    <div className="bftp-benefit-showcase">
      <div className="bftp-benefit-showcase__header">
        <h2 className="bftp-benefit-showcase__heading">
          <span>{primary}</span>
          {secondary ? <span>{` ${secondary}`}</span> : null}
        </h2>
      </div>
      <p className="bftp-benefit-showcase__body">{normalizeBody(body)}</p>
      <div className={gridClassName}>
        {items.map((item, index) => {
          const href = resolveBenefitHref(item.title);
          const className = href
            ? "bftp-benefit-showcase__item bftp-benefit-showcase__item--interactive"
            : "bftp-benefit-showcase__item";

          const content = (
            <>
              {item.icon?.src ? (
                <Image
                  src={item.icon.src}
                  alt={item.icon.alt || item.title}
                  width={82}
                  height={82}
                  className="bftp-benefit-showcase__icon"
                />
              ) : null}
              <h3 className="bftp-benefit-showcase__title">{item.title}</h3>
              <p className="bftp-benefit-showcase__copy">{item.body}</p>
            </>
          );

          if (href) {
            return (
              <Link
                key={`${item.title}-${index}`}
                href={href}
                className={className}
                aria-label={`Open ${item.title}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <article key={`${item.title}-${index}`} className={className}>
              {content}
            </article>
          );
        })}
      </div>
      {ctaLabel && ctaHref ? (
        <div className="bftp-benefit-showcase__actions">
          <Link href={ctaHref} className="bftp-cta-button bftp-benefit-showcase__button">
            {ctaLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
