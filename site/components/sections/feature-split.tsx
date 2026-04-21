interface FeatureItem {
  title: string;
  body: string;
}

export function FeatureSplit({
  heading,
  body,
  items,
}: {
  heading: string;
  body: string;
  items: FeatureItem[];
}) {
  const paragraphs = body
    .replaceAll("\u200d", "\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);

  return (
    <div className="bftp-feat-split">
      <div className="bftp-feat-split__text">
        <h2 className="bftp-feat-split__heading">{heading}</h2>
        {paragraphs.map((p) => (
          <p key={p} className="bftp-feat-split__copy">{p}</p>
        ))}
      </div>
      <div className="bftp-feat-split__grid">
        {items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="bftp-feat-split__card">
            <span className="bftp-feat-split__number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="bftp-feat-split__card-title">{item.title}</h3>
            <p className="bftp-feat-split__card-copy">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
