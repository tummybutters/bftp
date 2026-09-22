import Image from "next/image";
import s from "./contact-quiz.module.css";

const artwork: Record<string, string> = {
  Testing: "testing",
  "Repair / Replacement": "repair",
  "New Installation": "installation",
  "Not Sure Yet": "guidance",
  "Commercial / Business": "business",
  "Apartment/Multi-Family": "apartments",
  Residential: "home",
  Industrial: "industrial",
  ASAP: "asap",
  "This Week": "week",
  "This Month": "month",
  "Just Pricing / Planning": "pricing",
  device: "device",
  "Not sure": "guidance",
  call: "call",
  email: "email",
};

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
      src={`/assets/quiz/${asset}.webp`}
      width={256}
      height={256}
      sizes={compact ? "48px" : "112px"}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
