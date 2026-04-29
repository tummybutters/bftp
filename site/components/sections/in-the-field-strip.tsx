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
  "/": {
    title: {
      primary: "IN THE",
      accent: "FIELD",
    },
    insertAfterKinds: ["pricing_tiles", "feature_cards"],
    photos: [
      {
        src: "/assets/photos/technician-eddie-irvine.jpg",
        alt: "Backflow technician working in the field",
      },
      {
        src: "/assets/photos/dcda-test-cock-oc-2.jpg",
        alt: "Close-up of backflow testing hardware",
      },
      {
        src: "/assets/photos/installation-hilton-oc.jpg",
        alt: "Commercial backflow installation in the field",
      },
      {
        src: "/assets/photos/replacement-costco-tustin-1.jpg",
        alt: "Backflow replacement assembly at a commercial property",
      },
    ],
  },
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
        src: "/assets/photos/general-3.jpg",
        alt: "Backflow assembly close-up in the field",
      },
      {
        src: "/assets/photos/testing-oc.jpg",
        alt: "Backflow testing setup at a Southern California property",
      },
      {
        src: "/assets/photos/storefront-2.jpg",
        alt: "Commercial property served by Backflow Test Pros",
      },
    ],
  },
  "/backflow-installation": {
    title: {
      primary: "NEW",
      accent: "INSTALLS",
    },
    insertAfterKinds: ["bullet_columns", "pricing_tiles"],
    photos: [
      {
        src: "/assets/photos/installation-anaheim.jpg",
        alt: "Backflow installation work in Anaheim",
      },
      {
        src: "/assets/photos/technician-6ft-nipple-anaheim.jpg",
        alt: "Technician preparing installation hardware",
      },
      {
        src: "/assets/photos/rp-installation-seal-beach.jpg",
        alt: "Installed reduced pressure assembly in the field",
      },
      {
        src: "/assets/photos/installation-santa-ana.jpg",
        alt: "Freshly installed backflow device in Santa Ana",
      },
    ],
  },
  "/backflow-repair-replacement-services": {
    title: {
      primary: "REPAIR",
      accent: "WORK",
    },
    insertAfterKinds: ["bullet_columns", "link_list"],
    photos: [
      {
        src: "/assets/photos/repair-cypress.jpg",
        alt: "Backflow repair work in Cypress",
      },
      {
        src: "/assets/photos/debris-relief-valve-oc.jpg",
        alt: "Backflow relief valve during repair inspection",
      },
      {
        src: "/assets/photos/preventer-repair-best-oc.jpg",
        alt: "Repaired backflow preventer assembly",
      },
      {
        src: "/assets/photos/replacement-newport-beach.jpg",
        alt: "Replacement backflow assembly in Newport Beach",
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

  return (
    <section className="bftp-field-strip" aria-label="In the field project photography">
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
