"use client";

import type { CSSProperties } from "react";

export function ToolbarMaskedIcon({
  className = "",
  height,
  src,
  width,
}: {
  className?: string;
  height: number;
  src: string;
  width: number;
}) {
  const maskStyle: CSSProperties = {
    width,
    height,
    backgroundColor: "currentColor",
    WebkitMaskImage: `url("${src}")`,
    maskImage: `url("${src}")`,
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      style={maskStyle}
    />
  );
}
