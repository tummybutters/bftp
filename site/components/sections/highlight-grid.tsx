import Image from "next/image";

import { featureIcons } from "@/lib/design";

interface HighlightCard {
  title: string;
  body: string;
  icon?: {
    src?: string | null;
    alt?: string | null;
  } | null;
}

function resolveLocalIcon(title: string, body: string, index: number) {
  const matcher = `${title} ${body}`.toLowerCase();
  const byKeyword =
    featureIcons.find(
      (icon) =>
        (icon.key === "calendarBlue" && /priority|schedule/.test(matcher)) ||
        (icon.key === "docsRetrievalBlue" &&
          /document|documents|retrieval|city/.test(matcher)) ||
        (icon.key === "repairCoverageBlue" &&
          /repair|coverage|liabilit|risk/.test(matcher)) ||
        (icon.key === "sameDayCertificationBlue" &&
          /same-day|certification|report/.test(matcher)) ||
        (icon.key === "waterDroplet" &&
          /water|municipal|compliance|containment/.test(matcher)) ||
        (icon.key === "permitApproval" && /permit|plan|approval/.test(matcher)) ||
        (icon.key === "licensedCertified" &&
          /approved|device|certified|specialist/.test(matcher)) ||
        (icon.key === "money" &&
          /free testing|warranty|pricing|discount/.test(matcher)),
    ) ?? null;

  return (
    byKeyword ??
    [
      featureIcons.find((icon) => icon.key === "calendarBlue"),
      featureIcons.find((icon) => icon.key === "docsRetrievalBlue"),
      featureIcons.find((icon) => icon.key === "repairCoverageBlue"),
      featureIcons.find((icon) => icon.key === "sameDayCertificationBlue"),
    ][index % 4] ??
    featureIcons[0]
  );
}

export function HighlightGrid({ items }: { items: HighlightCard[] }) {
  const columnClass = items.length === 3 ? "bftp-icon-grid bftp-icon-grid--three" : "bftp-icon-grid";

  return (
    <div className={columnClass}>
      {items.map((item, index) => {
        const resolvedIcon = resolveLocalIcon(item.title, item.body, index);

        return (
          <article key={item.title} className="bftp-icon-grid__card">
            {resolvedIcon ? (
              <Image
                src={resolvedIcon.src}
                alt={item.icon?.alt ?? resolvedIcon.alt}
                width={64}
                height={64}
                className="bftp-icon-grid__icon"
              />
            ) : null}
            <h3 className="bftp-icon-grid__title">{item.title}</h3>
            <p className="bftp-icon-grid__copy">{item.body}</p>
          </article>
        );
      })}
    </div>
  );
}
