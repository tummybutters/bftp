import { SiteShell } from "@/components/chrome/site-shell";
import { PageContextRegistrar } from "@/components/templates/page-context-registrar";
import { loadPagePayloadByPath } from "@/lib/content/loaders";
import { getSiteCatalog } from "@/lib/content/site-index";
import { getTemplateDefinition } from "@/lib/templates/registry";
import type { PageEntry } from "@/lib/site-schema";

export async function PageRenderer({ page }: { page: PageEntry }) {
  const catalog = getSiteCatalog();
  const payload = await loadPagePayloadByPath(page.path);
  const definition = getTemplateDefinition(payload?.family ?? page.templateFamily);
  const Template = definition.component;

  return (
    <SiteShell>
      <PageContextRegistrar
        template={payload?.family ?? page.templateFamily}
        path={page.path}
        title={page.title}
      />
      <Template
        page={page}
        catalog={catalog}
        sectionOrder={definition.sectionOrder}
        templateLabel={definition.label}
        payload={payload}
      />
    </SiteShell>
  );
}
