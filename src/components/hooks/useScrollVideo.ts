"use client";

// Copied from MRL-SS27 — scroll-driven video scrubbing via GSAP ScrollTrigger.
// Works with Lenis smooth scroll via the shared gsap ticker integration.

import { RefObject, useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface UseScrollVideoOptions {
  scrubSpeed?: number;
  start?: string;
  end?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

function seekVideo(video: HTMLVideoElement, time: number) {
  const v = video as HTMLVideoElement & { fastSeek?: (t: number) => void };
  if (typeof v.fastSeek === "function") {
    v.fastSeek(time);
  } else {
    video.currentTime = time;
  }
}

export function useScrollVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  options: UseScrollVideoOptions = {}
) {
  const { start = "top top", end = "bottom bottom", onProgress, onComplete } = options;

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const mobile = isTouchDevice();
    const scrub = mobile ? 3 : 1.5;
    const SEEK_INTERVAL = mobile ? 1000 / 24 : 0;
    let lastSeekAt = 0;
    let ctx: gsap.Context;

    const init = () => {
      video.currentTime = 0;
      const proxy = { t: 0 };

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start,
            end,
            scrub,
            onUpdate: (self) => onProgress?.(self.progress),
            onLeave: () => onComplete?.(),
          },
        });

        tl.to(proxy, {
          t: 1,
          ease: "none",
          onUpdate: () => {
            if (video.readyState < 2) return;
            if (SEEK_INTERVAL > 0) {
              const now = performance.now();
              if (now - lastSeekAt < SEEK_INTERVAL) return;
              lastSeekAt = now;
            }
            if (video.seeking) return;
            seekVideo(video, proxy.t * video.duration);
          },
        });
      });
    };

    const readyThreshold = mobile ? 4 : 2;

    if (video.readyState >= readyThreshold) {
      init();
    } else {
      const onReady = () => {
        if (video.readyState >= readyThreshold) {
          init();
          video.removeEventListener("progress", onReady);
          video.removeEventListener("canplaythrough", onReady);
        }
      };
      video.addEventListener("canplaythrough", onReady, { once: true });
      video.addEventListener("progress", onReady);
    }

    return () => { ctx?.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, containerRef]);
}
