"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface CredentialItem {
  title: string;
  body: string;
}

const credentialPhotos: Record<string, string> = {
  "contractor|license|licensed": "/assets/photos/eddie-john-installation.jpg",
  "discount|pricing|multi-device": "/assets/photos/installation-big-bear.jpg",
  "awwa|backflow certified|water": "/assets/photos/general-1.jpg",
  "bonded|insured|shield": "/assets/photos/installation-hilton-oc.jpg",
  "repair|coverage|free repair": "/assets/photos/repair-villa-park.jpg",
  "same day|same-day|certification": "/assets/photos/installation-santa-ana.jpg",
};

function resolveCredentialPhoto(title: string) {
  const matcher = title.toLowerCase();

  for (const [patterns, photo] of Object.entries(credentialPhotos)) {
    const keywords = patterns.split("|");
    if (keywords.some((kw) => matcher.includes(kw))) {
      return photo;
    }
  }

  return "/assets/photos/general-2.jpg";
}

export function CredentialCarousel({ items }: { items: CredentialItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);

  const cardCount = items.length;
  const maxOffset = Math.max(0, cardCount - 3);

  const shift = useCallback(
    (direction: -1 | 1) => {
      setOffset((prev) => Math.max(0, Math.min(maxOffset, prev + direction)));
    },
    [maxOffset],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!trackRef.current) return;
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartOffset.current = offset;
      trackRef.current.setPointerCapture(e.pointerId);
    },
    [offset],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !trackRef.current) return;
      const delta = dragStartX.current - e.clientX;
      const trackWidth = trackRef.current.offsetWidth;
      const cardWidth = trackWidth / 3.5;
      const cardsDragged = delta / cardWidth;
      const next = Math.round(dragStartOffset.current + cardsDragged);
      setOffset(Math.max(0, Math.min(maxOffset, next)));
    },
    [maxOffset],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="bftp-cred-carousel">
      {offset > 0 ? (
        <button
          type="button"
          className="bftp-cred-carousel__arrow bftp-cred-carousel__arrow--prev"
          onClick={() => shift(-1)}
          aria-label="Previous credential"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      <div
        ref={trackRef}
        className="bftp-cred-carousel__track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="bftp-cred-carousel__slider"
          style={{
            transform: `translateX(calc(-${offset} * (100% / 3.5 + var(--_gap) * 3 / 3.5)))`,
          }}
        >
          {items.map((item, index) => {
            const photo = resolveCredentialPhoto(item.title);

            return (
              <article key={`${item.title}-${index}`} className="bftp-cred-carousel__card">
                <Image
                  src={photo}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 70vw, (max-width: 991px) 45vw, 28vw"
                  className="bftp-cred-carousel__photo"
                />
                <div className="bftp-cred-carousel__overlay" />
                <div className="bftp-cred-carousel__label">
                  <h3 className="bftp-cred-carousel__title">{item.title}</h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {offset < maxOffset ? (
        <button
          type="button"
          className="bftp-cred-carousel__arrow bftp-cred-carousel__arrow--next"
          onClick={() => shift(1)}
          aria-label="Next credential"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
