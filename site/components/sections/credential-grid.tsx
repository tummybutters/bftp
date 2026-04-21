import Image from "next/image";

import { featureIcons } from "@/lib/design";

interface CredentialItem {
  title: string;
  body: string;
}

const credentialIconMap: Record<string, string> = {
  licensedCertified: "contractor|license|licensed",
  promoGift: "discount|pricing|multi-device",
  waterDroplet: "awwa|backflow certified|water",
  sameDayCertificationBlue: "bonded|insured|shield",
  repairCoverageBlue: "repair|coverage|free repair",
  calendarBlue: "same day|same-day|certification",
};

function resolveCredentialIcon(title: string) {
  const matcher = title.toLowerCase();

  for (const [iconKey, patterns] of Object.entries(credentialIconMap)) {
    const keywords = patterns.split("|");
    if (keywords.some((kw) => matcher.includes(kw))) {
      const icon = featureIcons.find((i) => i.key === iconKey);
      if (icon) return icon;
    }
  }

  return featureIcons.find((i) => i.key === "licensedCertified") ?? featureIcons[0];
}

export function CredentialGrid({ items }: { items: CredentialItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bftp-credential-grid">
      {items.map((item, index) => {
        const icon = resolveCredentialIcon(item.title);

        return (
          <article key={`${item.title}-${index}`} className="bftp-credential-grid__card">
            <div className="bftp-credential-grid__icon-wrap">
              <Image
                src={icon.src}
                alt={icon.alt}
                width={40}
                height={40}
                className="bftp-credential-grid__icon"
              />
            </div>
            <h3 className="bftp-credential-grid__title">{item.title}</h3>
            {item.body ? (
              <p className="bftp-credential-grid__copy">{item.body}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
