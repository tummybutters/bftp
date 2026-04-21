import Image from "next/image";

import { clientLogos } from "@/lib/design";
import type { ContentImage } from "@/lib/content/types";

export function LogoBelt({
  logos,
  count,
  useGlobalSet = false,
}: {
  logos?: ContentImage[];
  count?: number;
  useGlobalSet?: boolean;
}) {
  const globalLogos = clientLogos.map((logo) => ({
    src: logo.src,
    alt: logo.alt,
    beltScale: logo.beltScale ?? 1,
    beltWidth: logo.beltWidth ?? 168,
    beltHeight: logo.beltHeight ?? 72,
  }));
  const sourceLogos =
    useGlobalSet || !logos?.length ? globalLogos : logos;
  const visibleLogos =
    typeof count === "number" ? sourceLogos.slice(0, count) : sourceLogos;

  if (visibleLogos.length === 0) {
    return null;
  }

  return (
    <section className="bftp-logo-belt">
      <div className="bftp-shell">
        <div className="bftp-logo-belt__viewport">
          <div className="bftp-logo-belt__track">
            {[0, 1].map((groupIndex) => (
              <div
                key={`group-${groupIndex}`}
                className="bftp-logo-belt__group"
                aria-hidden={groupIndex === 1}
              >
                {visibleLogos.map((logo, index) => (
                  <div
                    key={`${groupIndex}-${logo.src}-${index}`}
                    className="bftp-logo-belt__item"
                    style={{
                      ["--bftp-logo-scale" as string]: String(
                        "beltScale" in logo && typeof logo.beltScale === "number"
                          ? logo.beltScale
                          : 1,
                      ),
                    }}
                  >
                    <div className="bftp-logo-belt__art">
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={
                          "beltWidth" in logo && typeof logo.beltWidth === "number"
                            ? logo.beltWidth
                            : 168
                        }
                        height={
                          "beltHeight" in logo && typeof logo.beltHeight === "number"
                            ? logo.beltHeight
                            : 72
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
