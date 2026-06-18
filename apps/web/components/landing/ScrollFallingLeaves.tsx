"use client";

import { useEffect, useRef, useCallback } from "react";

const LEAF_PATH =
  "M12 2.5C10 5 7 9 7 13.5C7 17.5 9.5 20.5 12 21.5C14.5 20.5 17 17.5 17 13.5C17 9 14 5 12 2.5Z";

const COLORS = ["#2E7D45", "#5FAD75", "#A8D5B5", "#4ADB7A", "#3D9E5C"];

function spawnLeaf(container: HTMLElement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const x = Math.random() * vw;
  const size = 12 + Math.random() * 18;
  const dur = (2.8 + Math.random() * 2.2) * 1000;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const swayX = (Math.random() - 0.5) * 140;
  const rotEnd = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 220);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  Object.assign(svg.style, {
    position: "fixed",
    left: `${x}px`,
    top: `-${size + 4}px`,
    pointerEvents: "none",
    zIndex: "9998",
    willChange: "transform, opacity",
  });

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", color);
  path.setAttribute("d", LEAF_PATH);
  svg.appendChild(path);
  container.appendChild(svg);

  const anim = svg.animate(
    [
      {
        opacity: 0,
        transform: `translateY(0px) translateX(0px) rotate(0deg)`,
      },
      {
        opacity: 0.9,
        transform: `translateY(${vh * 0.15}px) translateX(${swayX * 0.3}px) rotate(${rotEnd * 0.2}deg)`,
        offset: 0.08,
      },
      {
        opacity: 0.85,
        transform: `translateY(${vh * 0.5}px) translateX(${swayX * 0.7}px) rotate(${rotEnd * 0.55}deg)`,
        offset: 0.5,
      },
      {
        opacity: 0.6,
        transform: `translateY(${vh * 0.85}px) translateX(${swayX}px) rotate(${rotEnd * 0.85}deg)`,
        offset: 0.88,
      },
      {
        opacity: 0,
        transform: `translateY(${vh + size + 8}px) translateX(${swayX * 0.9}px) rotate(${rotEnd}deg)`,
      },
    ],
    { duration: dur, easing: "ease-in", fill: "forwards" }
  );

  anim.onfinish = () => svg.remove();
}

export function ScrollFallingLeaves() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScroll = useCallback(() => {
    if (!containerRef.current) return;
    if (throttleTimer.current) return;

    const delta = Math.abs(window.scrollY - lastScrollY.current);
    if (delta < 20) return;
    lastScrollY.current = window.scrollY;

    const count = Math.min(Math.ceil(delta / 80), 3);
    for (let i = 0; i < count; i++) {
      spawnLeaf(containerRef.current);
    }

    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null;
    }, 100);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (throttleTimer.current) clearTimeout(throttleTimer.current);
    };
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }}
    />
  );
}
