import Image from "next/image";

import { decorativeShapes, serviceImages } from "@/lib/design";
import type { LinkItem } from "@/lib/site-schema";
import { TrackedLink } from "@/lib/analytics/tracked-link";

function splitDescription(description: string) {
  return description
    .replaceAll("\u200d", "\n")
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function buildServiceDescription(label: string) {
  if (/testing/i.test(label)) {
    return "Annual testing, report filing, and certification support managed by certified backflow specialists.";
  }

  if (/repair/i.test(label)) {
    return "Urgent diagnostics, replacement planning, and repair coordination that keeps facilities compliant and online.";
  }

  if (/installation/i.test(label)) {
    return "Approved device selection, permit support, installation, and certification handled as one coordinated scope.";
  }

  return "Turnkey backflow service coverage designed around compliance, scheduling, and dependable follow-through.";
}

export function ServiceCardGrid({ items }: { items: LinkItem[] }) {
  const cards = items.slice(0, 3);

  return (
    <div className="bftp-service-grid">
      {cards.map((item, index) => {
        const image = serviceImages[index % serviceImages.length];

        return (
          <article
            key={`${item.href}-${item.label}-${index}`}
            className="bftp-service-card"
          >
            <div className="bftp-service-card__media">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 33vw"
              />
              <Image
                src={decorativeShapes[0].src}
                alt={decorativeShapes[0].alt}
                width={409}
                height={120}
                className="bftp-service-card__shape"
              />
            </div>
            <div className="bftp-service-card__content">
              <h3 className="bftp-service-card__title">
                <TrackedLink
                  href={item.href}
                  event="service_card_clicked"
                  properties={{ label: item.label }}
                  external={item.external}
                  target={item.target}
                >
                  {item.label}
                </TrackedLink>
              </h3>
              <div className="bftp-service-card__copy">
                {splitDescription(item.description ?? buildServiceDescription(item.label)).map(
                  (paragraph, paragraphIndex) => (
                    <p key={`${item.label}-copy-${paragraphIndex}`}>{paragraph}</p>
                  ),
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
