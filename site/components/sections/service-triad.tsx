import Image from "next/image";

interface ServiceTriadItem {
  title: string;
  body: string;
  icon?: {
    src?: string | null;
    alt?: string | null;
  } | null;
}

function splitParagraphs(body: string) {
  return body
    .replaceAll("\u200d", "\n")
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function ServiceTriad({ items }: { items: ServiceTriadItem[] }) {
  return (
    <div className="bftp-service-triad">
      {items.map((item, index) => (
        <article key={`${item.title}-${index}`} className="bftp-service-triad__card">
          <div className="bftp-service-triad__media">
            {item.icon?.src ? (
              <Image
                src={item.icon.src}
                alt={item.icon.alt || item.title}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1200px) 33vw, 420px"
                className="bftp-service-triad__image"
              />
            ) : null}
          </div>
          <div className="bftp-service-triad__body">
            <h3 className="bftp-service-triad__title">{item.title}</h3>
            <div className="bftp-service-triad__copy">
              {splitParagraphs(item.body).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
