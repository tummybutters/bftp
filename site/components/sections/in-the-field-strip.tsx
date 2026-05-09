import Image from "next/image";

type StripConfig = {
  title: {
    primary: string;
    accent: string;
  };
  insertAfterKinds: string[];
  photos: Array<{
    src: string;
    alt: string;
  }>;
};

const stripConfigs: Record<string, StripConfig> = {
  "/about-us": {
    title: {
      primary: "OUR",
      accent: "CREW",
    },
    insertAfterKinds: ["bullet_columns", "tabbed_content"],
    photos: [
      {
        src: "/assets/photos/eddie-john-installation.jpg",
        alt: "Backflow technician on a job site",
      },
      {
        src: "/assets/photos/about-crew-2-2026.jpg",
        alt: "Backflow Test Pros crew member in the field",
      },
      {
        src: "/assets/photos/about-crew-3-2026.jpg",
        alt: "Backflow Test Pros technician preparing field service work",
      },
      {
        src: "/assets/photos/about-crew-4-2026.jpg",
        alt: "Backflow Test Pros technician at a commercial property",
      },
    ],
  },
  "/backflow-installation": {
    title: {
      primary: "NEW",
      accent: "INSTALLS",
    },
    insertAfterKinds: ["rich_text"],
    photos: [
      {
        src: "/assets/photos/install-new-1-2026.jpg",
        alt: "Backflow installation work in the field",
      },
      {
        src: "/assets/photos/installation-santa-ana.jpg",
        alt: "Freshly installed backflow device in Santa Ana",
      },
      {
        src: "/assets/photos/install-new-3-2026.jpg",
        alt: "Newly installed backflow preventer assembly",
      },
      {
        src: "/assets/photos/rp-installation-seal-beach.jpg",
        alt: "Installed reduced pressure assembly in the field",
      },
    ],
  },
  "/backflow-repair-replacement-services": {
    title: {
      primary: "REPAIR",
      accent: "WORK",
    },
    insertAfterKinds: ["rich_text"],
    photos: [
      {
        src: "/assets/photos/repair-work-1-2026.jpg",
        alt: "Backflow repair work in the field",
      },
      {
        src: "/assets/photos/repair-work-2-2026.jpg",
        alt: "Backflow repair detail during service",
      },
      {
        src: "/assets/photos/preventer-repair-best-oc.jpg",
        alt: "Repaired backflow preventer assembly",
      },
      {
        src: "/assets/photos/repair-work-4-2026.jpg",
        alt: "Backflow repair technician working on an assembly",
      },
    ],
  },
};

export function shouldRenderInTheFieldStrip(path: string) {
  return Boolean(stripConfigs[path]);
}

export function getInTheFieldStripInsertIndex(
  path: string,
  sections: Array<{ kind: string }>,
) {
  const config = stripConfigs[path];

  if (!config) {
    return -1;
  }

  for (const targetKind of config.insertAfterKinds) {
    const sectionIndex = sections.findIndex((section) => section.kind === targetKind);

    if (sectionIndex >= 0) {
      return sectionIndex;
    }
  }

  return sections.length > 0 ? Math.min(2, sections.length - 1) : -1;
}

export function InTheFieldStrip({ path }: { path: string }) {
  const config = stripConfigs[path];

  if (!config) {
    return null;
  }

  const isServiceStrip =
    path === "/backflow-installation" ||
    path === "/backflow-repair-replacement-services";
  const className = ["bftp-field-strip", isServiceStrip ? "bftp-field-strip--service" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className} aria-label="In the field project photography">
      <div className="bftp-field-strip__grid">
        {config.photos.map((photo, index) => (
          <div key={`${path}-${photo.src}`} className="bftp-field-strip__panel">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority={index < 2}
              sizes="(max-width: 767px) 50vw, 25vw"
              className="bftp-field-strip__image"
            />
          </div>
        ))}
      </div>
      <div className="bftp-field-strip__overlay" aria-hidden="true" />
      <div className="bftp-field-strip__title-wrap">
        <h2 className="bftp-field-strip__title">
          <span>{config.title.primary}</span>
          <span className="is-gold">{config.title.accent}</span>
        </h2>
      </div>
    </section>
  );
}
