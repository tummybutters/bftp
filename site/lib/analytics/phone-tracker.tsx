"use client";
import { safeCapture } from "./safe-capture";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

// One owner for every website telephone link, including content-authored links.
// No preventDefault and no awaited network work: the dialer opens immediately.
export function PhoneTracker() {
  const posthog = usePostHog();
  useEffect(() => {
    const track = (event: MouseEvent) => {
      const node = event.target instanceof Element ? event.target : null;
      const link = node?.closest<HTMLAnchorElement>('a[href^="tel:"]');
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const digits = href.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
      const offices: Record<string, string> = {
        "8008036658": "main",
        "3107537325": "los_angeles",
        "7148521213": "orange_county",
        "6194156937": "san_diego",
      };
      // Only company numbers belong in analytics; never capture a customer's number.
      if (!offices[digits]) return;
      const quiz = link.closest<HTMLElement>("[data-intake-variant]");
      safeCapture(posthog, "phone_cta_clicked", {
        page_path: location.pathname,
        location:
          link.dataset.phonePlacement ||
          (link.closest("footer")
            ? "footer"
            : link.closest("header")
              ? "header"
              : "page-body"),
        phone_number: digits,
        office: offices[digits],
        ...(quiz
          ? {
              intake_variant: quiz.dataset.intakeVariant,
              quiz_step: Number(quiz.dataset.quizStep),
            }
          : {}),
      });
    };
    document.addEventListener("click", track, true);
    return () => document.removeEventListener("click", track, true);
  }, [posthog]);
  return null;
}
