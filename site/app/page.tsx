import { notFound } from "next/navigation";

import { PageRenderer } from "@/components/templates/page-renderer";
import { loadPagePayloadByPath } from "@/lib/content/loaders";
import { buildPageMetadata, getPageByPath } from "@/lib/content/site-index";

export const dynamicParams = false;

export async function generateMetadata() {
  const page = getPageByPath("/");
  const payload = await loadPagePayloadByPath("/");

  return page ? buildPageMetadata(page, payload) : undefined;
}

export default function HomePage() {
  const page = getPageByPath("/");

  if (!page) {
    notFound();
  }

  return <PageRenderer page={page} />;
}
