import type { PageTemplateProps } from "@/lib/site-schema";

import { StructuredPageTemplate } from "@/components/templates/structured-page-template";

export function HomeTemplate(props: PageTemplateProps) {
  return <StructuredPageTemplate {...props} />;
}
