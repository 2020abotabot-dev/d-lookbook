"use client";

// IntersectionObserver-based scroll reveal helper.
// Adds/removes "is-visible" class — CSS handles the actual animation.

import { RefObject, useEffect } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  /** Keep visible once triggered (default true) */
  once?: boolean;
}

export function useScrollReveal(
  ref: RefObject<HTMLElement | null>,
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.12, once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          if (once) io.disconnect();
        } else if (!once) {
          el.classList.remove("is-visible");
        }
      },
      { threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, once]);
}

/** Stagger multiple refs — each gets is-visible with a CSS variable --stagger-i */
export function useStaggerReveal(
  refs: RefObject<HTMLElement | null>[],
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.08, once = true } = options;

  useEffect(() => {
    if (!refs.length) return;
    // Use the first ref as the trigger element
    const container = refs[0].current?.parentElement;
    if (!container) return;

    refs.forEach((ref, i) => {
      if (ref.current) ref.current.style.setProperty("--stagger-i", String(i));
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          refs.forEach(ref => ref.current?.classList.add("is-visible"));
          if (once) io.disconnect();
        } else if (!once) {
          refs.forEach(ref => ref.current?.classList.remove("is-visible"));
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    io.observe(container);
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
