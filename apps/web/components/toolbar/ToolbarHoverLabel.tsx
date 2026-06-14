"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function ToolbarHoverLabel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const [mounted, setMounted] = useState(false);
  const [tooltipRoot, setTooltipRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setTooltipRoot(document.getElementById("toolbar-tooltip-root"));
  }, []);

  useEffect(() => {
    if (!isVisible) return undefined;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setTooltipPosition({
        left: rect.left + rect.width / 2,
        top: rect.top - 8,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible]);

  return (
    <div
      ref={triggerRef}
      className="relative flex shrink-0 items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {mounted && isVisible && tooltipRoot
        ? createPortal(
            <div
              aria-hidden="true"
              className={[
                "pointer-events-none fixed z-[100000] whitespace-nowrap rounded-lg",
                "bg-[var(--color-text-primary)] px-2 py-1 text-xs font-medium text-[var(--color-background)] shadow-lg",
                "-translate-x-1/2 -translate-y-full",
              ].join(" ")}
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top,
              }}
            >
              {label}
            </div>,
            tooltipRoot
          )
        : null}
    </div>
  );
}
