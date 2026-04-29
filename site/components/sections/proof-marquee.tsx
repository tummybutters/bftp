import type { CSSProperties } from "react";

const MARQUEE_COPY_COUNT = 4;

export function ProofMarquee({ items }: { items: string[] }) {
  const visibleItems = items.filter(Boolean);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="bftp-marquee" aria-label="Backflow credentials">
      <div className="bftp-marquee__viewport">
        <div
          className="bftp-marquee__track"
          style={
            {
              ["--bftp-marquee-copy-count" as string]: String(
                MARQUEE_COPY_COUNT,
              ),
            } as CSSProperties
          }
        >
          {Array.from({ length: MARQUEE_COPY_COUNT }, (_, copyIndex) => (
            <div
              key={`marquee-copy-${copyIndex}`}
              className="bftp-marquee__group"
              aria-hidden={copyIndex > 0}
            >
              {visibleItems.map((item) => (
                <span
                  key={`${copyIndex}-${item}`}
                  className="bftp-marquee__entry"
                >
                  <span className="bftp-marquee__item">{item}</span>
                  <span className="bftp-marquee__dot" aria-hidden="true" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
