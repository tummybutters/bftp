"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

interface TrackedSectionProps {
  sectionType: string;
  sectionIndex: number;
  children: React.ReactNode;
  className?: string;
}

export function TrackedSection({
  sectionType,
  sectionIndex,
  children,
  className,
}: TrackedSectionProps) {
  const posthog = usePostHog();
  const ref = useRef<HTMLDivElement>(null);
  const hasFired = useRef(false);

  useEffect(() => {
    hasFired.current = false;
  }, [sectionType, sectionIndex]);

  useEffect(() => {
    const el = ref.current;

    if (!el || !posthog) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFired.current) {
          timer = setTimeout(() => {
            if (!hasFired.current) {
              hasFired.current = true;
              posthog.capture("section_viewed", {
                section_type: sectionType,
                section_index: sectionIndex,
              });
            }
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [posthog, sectionType, sectionIndex]);

  return (
    <div ref={ref} className={className} data-track-section={sectionType}>
      {children}
    </div>
  );
}
