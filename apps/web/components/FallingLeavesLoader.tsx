"use client";

const LEAF_PATH =
  "M12 2.5C10 5 7 9 7 13.5C7 17.5 9.5 20.5 12 21.5C14.5 20.5 17 17.5 17 13.5C17 9 14 5 12 2.5Z";

interface FallingLeavesLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LEAVES = [
  { anim: "leaf-fall-a", delay: "0s",    dur: "1.4s", x: -10, color: "#2E7D45", sizeMd: 20, sizeLg: 26 },
  { anim: "leaf-fall-b", delay: "0.45s", dur: "1.2s", x: 2,   color: "#5FAD75", sizeMd: 10, sizeLg: 13 },
  { anim: "leaf-fall-c", delay: "0.9s",  dur: "1.5s", x: 12,  color: "#A8D5B5", sizeMd: 17, sizeLg: 22 },
];

export function FallingLeavesLoader({ size = "md", className = "" }: FallingLeavesLoaderProps) {
  if (size === "sm") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        className={className}
        aria-label="로딩 중"
        role="status"
        style={{ animation: "leaf-float-sm 0.9s linear infinite", display: "inline-block", flexShrink: 0 }}
      >
        <path fill="currentColor" d={LEAF_PATH} />
      </svg>
    );
  }

  const isLg = size === "lg";
  const containerW = isLg ? 72 : 56;
  const containerH = isLg ? 60 : 48;

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: containerW, height: containerH }}
      aria-label="로딩 중"
      role="status"
    >
      {LEAVES.map((leaf, i) => {
        const leafSize = isLg ? leaf.sizeLg : leaf.sizeMd;
        return (
          <svg
            key={i}
            width={leafSize}
            height={leafSize}
            viewBox="0 0 24 24"
            style={{
              position: "absolute",
              left: `calc(50% + ${leaf.x - leafSize / 2}px)`,
              top: 0,
              opacity: 0,
              animation: `${leaf.anim} ${leaf.dur} ease-in-out ${leaf.delay} infinite`,
            }}
          >
            <path fill={leaf.color} d={LEAF_PATH} />
          </svg>
        );
      })}
    </span>
  );
}
