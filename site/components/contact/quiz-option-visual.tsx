import Image, { type StaticImageData } from "next/image";
import s from "./contact-quiz.module.css";

import testing from "@/public/assets/quiz/testing.webp";
import repair from "@/public/assets/quiz/repair.webp";
import installation from "@/public/assets/quiz/installation.webp";
import guidance from "@/public/assets/quiz/guidance.webp";
import business from "@/public/assets/quiz/business.webp";
import apartments from "@/public/assets/quiz/apartments.webp";
import home from "@/public/assets/quiz/home.webp";
import industrial from "@/public/assets/quiz/industrial.webp";
import asap from "@/public/assets/quiz/asap.webp";
import week from "@/public/assets/quiz/week.webp";
import month from "@/public/assets/quiz/month.webp";
import pricing from "@/public/assets/quiz/pricing.webp";
import device from "@/public/assets/quiz/device.webp";
import call from "@/public/assets/quiz/call.webp";
import email from "@/public/assets/quiz/email.webp";

const artwork: Record<string, StaticImageData | string> = {
  Testing: testing,
  "Repair / Replacement": repair,
  "New Installation": installation,
  "Not Sure Yet": guidance,
  "Commercial / Business": business,
  "Apartment/Multi-Family": apartments,
  Residential: home,
  Industrial: industrial,
  ASAP: asap,
  "This Week": week,
  "This Month": month,
  "Just Pricing / Planning": pricing,
  device,
  "Not sure": guidance,
  call,
  email,
};

// Static imports produce content-hashed, immutable URLs. Preload the small set
// once so moving to another question does not start a new download waterfall.
export function QuizArtworkPreloads() {
  return (
    <>
      {[...new Set(Object.values(artwork))].map((asset) => {
        const src = typeof asset === "string" ? asset : asset.src;
        return (
          <link key={src} rel="preload" as="image" href={src} fetchPriority="low" />
        );
      })}
    </>
  );
}

export function QuizOptionVisual({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  const asset = artwork[value];
  if (!asset) return null;
  return (
    <Image
      className={s[compact ? "option-art-compact" : "option-art"]}
      src={asset}
      width={224}
      height={224}
      unoptimized
      loading="eager"
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
