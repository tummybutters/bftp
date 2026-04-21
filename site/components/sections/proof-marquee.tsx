export function ProofMarquee({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bftp-marquee">
      <div className="bftp-shell">
        <div className="bftp-marquee__track">
          {items.map((item, index) => (
            <div key={item} className="contents">
              <span className="bftp-marquee__item">{item}</span>
              {index < items.length - 1 ? <span className="bftp-marquee__dot" /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
