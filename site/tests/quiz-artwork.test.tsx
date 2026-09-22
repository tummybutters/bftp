// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import {
  QuizArtworkPreloads,
  QuizOptionVisual,
} from "@/components/contact/quiz-option-visual";
import { serviceOptions, propertyOptions, timingOptions } from "@/lib/contact-intake";

it("preloads each later answer's exact image before that question mounts", () => {
  const hints = new DOMParser().parseFromString(
    renderToStaticMarkup(<QuizArtworkPreloads />),
    "text/html",
  );
  const preloaded = new Set(
    [...hints.querySelectorAll('link[rel="preload"][as="image"]')].map(
      (link) => link.getAttribute("href"),
    ),
  );
  const choices = [...serviceOptions, ...propertyOptions, ...timingOptions].map(
    ([value]) => value,
  );
  for (const value of [...choices, "device", "Not sure", "call", "email"]) {
    const answer = new DOMParser().parseFromString(
      renderToStaticMarkup(<QuizOptionVisual value={value} />),
      "text/html",
    );
    const image = answer.querySelector("img")!;
    expect(image).not.toBeNull();
    // Different optimizer URLs or deferred loading restore the click-time delay.
    expect(preloaded.has(image.getAttribute("src"))).toBe(true);
    expect(image.getAttribute("src")).not.toContain("/_next/image");
    expect(image.getAttribute("loading")).toBe("eager");
    expect(image.getAttribute("alt")).toBe("");
  }
  expect(preloaded.size).toBe(15);
});
