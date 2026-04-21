import Link from "next/link";

import { SiteShell } from "@/components/chrome/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="hero-surface">
        <div className="page-shell py-24">
          <p className="eyebrow">Not Found</p>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl font-bold text-white">
            That path is outside the current dossier registry.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Routing here is driven from the captured URL inventory. If a slug is
            missing, it likely needs to be added to the data source instead of
            being hard-coded into the app.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className="bftp-cta-button">
              Return home
            </Link>
            <Link
              href="/backflow-testing-installation-repair-service-areas"
              className="bftp-cta-button is-inverse"
            >
              Browse service areas
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
