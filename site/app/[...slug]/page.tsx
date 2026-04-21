import { notFound } from "next/navigation";

import { PageRenderer } from "@/components/templates/page-renderer";
import { loadPagePayloadByPath } from "@/lib/content/loaders";
import {
  buildPageMetadata,
  getPageByPath,
  getStaticSlugParams,
  resolvePathFromSlug,
} from "@/lib/content/site-index";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticSlugParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const pathname = resolvePathFromSlug(slug);
  const page = getPageByPath(pathname);
  const payload = await loadPagePayloadByPath(pathname);

  return page ? buildPageMetadata(page, payload) : undefined;
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = getPageByPath(resolvePathFromSlug(slug));

  if (!page) {
    notFound();
  }

  return <PageRenderer page={page} />;
}
