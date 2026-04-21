"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

interface PageContextProps {
  template: string;
  path: string;
  title: string;
}

export function PageContextRegistrar({ template, path, title }: PageContextProps) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    posthog.register({
      page_template: template,
      page_path: path,
      page_title: title,
      page_depth: path.split("/").filter(Boolean).length,
    });

    return () => {
      posthog.unregister("page_template");
      posthog.unregister("page_path");
      posthog.unregister("page_title");
      posthog.unregister("page_depth");
    };
  }, [posthog, template, path, title]);

  return null;
}
