import type { ReactNode } from "react";

interface SectionFrameProps {
  id?: string;
  className?: string;
  eyebrow?: string;
  title?: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  tone?: "plain" | "surface" | "band" | "navy";
  align?: "left" | "center";
  inset?: "reading" | "wide";
  accent?: boolean;
}

export function SectionFrame({
  id,
  className,
  eyebrow,
  title,
  body,
  children,
  tone = "surface",
  align = "center",
  inset = "wide",
  accent = false,
}: SectionFrameProps) {
  const resolvedTone = accent && tone === "surface" ? "band" : tone;

  return (
    <section
      id={id}
      className={[
        "bftp-frame",
        `bftp-frame--${resolvedTone}`,
        `bftp-frame--${align}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="bftp-shell">
        <div
          className={
            inset === "reading"
              ? "bftp-frame__inner bftp-frame__inner--reading"
              : "bftp-frame__inner"
          }
        >
          {eyebrow || title || body ? (
            <div className="bftp-frame__header">
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              {title ? <div className="bftp-frame__title">{title}</div> : null}
              {body ? <div className="bftp-frame__body">{body}</div> : null}
            </div>
          ) : null}
          {children ? <div className="bftp-frame__content">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
