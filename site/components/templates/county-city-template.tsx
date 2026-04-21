import type { PageTemplateProps } from "@/lib/site-schema";

import { StructuredPageTemplate } from "@/components/templates/structured-page-template";

export function CountyCityTemplate(props: PageTemplateProps) {
  return <StructuredPageTemplate {...props} />;
}
