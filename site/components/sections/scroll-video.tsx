"use client";

import { useRef, useEffect } from "react";

/**
 * Full-width scroll-driven video section.
 * The video scrubs forward/backward as the user scrolls through the section.
 * The section height is tall (300vh) so there's enough scroll runway to
 * play through the full video at a comfortable pace.
 */
export function ScrollVideo({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;
    let scrollCleanup: (() => void) | undefined;

    // Wait for video metadata so we know the duration
    const onReady = () => {
      const update = () => {
        const rect = container.getBoundingClientRect();
        const scrollableHeight = rect.height - window.innerHeight;
        if (scrollableHeight <= 0) return;

        // progress 0 → 1 as the container scrolls through
        const raw = -rect.top / scrollableHeight;
        const progress = Math.min(1, Math.max(0, raw));
        video.currentTime = progress * video.duration;
      };

      // Initial position
      update();

      const onScroll = () => requestAnimationFrame(update);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    };

    if (video.readyState >= 1) {
      const cleanup = onReady();
      return cleanup;
    }

    const handler = () => {
      scrollCleanup = onReady();
    };
    video.addEventListener("loadedmetadata", handler, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", handler);
      scrollCleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="bftp-scroll-video"
      style={{ height: "300vh", position: "relative" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
