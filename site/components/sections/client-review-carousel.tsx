"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface ReviewItem {
  title: string;
  body: string;
}

const clientPhotos: Record<string, string> = {
  costco: "/assets/photos/replacement-costco-tustin-1.jpg",
  hilton: "/assets/photos/installation-hilton-oc.jpg",
  davita: "/assets/photos/davita-exterior.jpg",
  "flame broiler": "/assets/photos/flame-broiler-exterior.jpg",
  "chick-fil-a": "/assets/photos/chickfila-exterior.jpg",
  arco: "/assets/services/arco-case-study.avif",
};

function resolveClientPhoto(title: string) {
  const matcher = title.toLowerCase();

  for (const [keyword, photo] of Object.entries(clientPhotos)) {
    if (matcher.includes(keyword)) {
      return photo;
    }
  }

  return "/assets/photos/general-3.jpg";
}

export function ClientReviewCarousel({ items }: { items: ReviewItem[] }) {
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
    <div className="bftp-review-carousel">
      {offset > 0 ? (
        <button
          type="button"
          className="bftp-review-carousel__arrow bftp-review-carousel__arrow--prev"
          onClick={() => shift(-1)}
          aria-label="Previous review"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      <div
        ref={trackRef}
        className="bftp-review-carousel__track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="bftp-review-carousel__slider"
          style={{
            transform: `translateX(calc(-${offset} * (100% / 3.5 + var(--_gap) * 3 / 3.5)))`,
          }}
        >
          {items.map((item, index) => {
            const photo = resolveClientPhoto(item.title);

            return (
              <article key={`${item.title}-${index}`} className="bftp-review-carousel__card">
                <Image
                  src={photo}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 70vw, (max-width: 991px) 45vw, 28vw"
                  className="bftp-review-carousel__photo"
                />
                <div className="bftp-review-carousel__overlay" />
                <div className="bftp-review-carousel__label">
                  <p className="bftp-review-carousel__kicker">Client Review</p>
                  <h3 className="bftp-review-carousel__title">{item.title}</h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {offset < maxOffset ? (
        <button
          type="button"
          className="bftp-review-carousel__arrow bftp-review-carousel__arrow--next"
          onClick={() => shift(1)}
          aria-label="Next review"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
