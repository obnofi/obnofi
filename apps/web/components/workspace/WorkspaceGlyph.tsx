"use client";

import Image from "next/image";

interface WorkspaceGlyphProps {
  icon: string | null;
  image?: string | null;
  label: string;
}

export function WorkspaceGlyph({ icon, image, label }: WorkspaceGlyphProps) {
  if (image) {
    return (
      <Image
        src={image}
        alt={label}
        width={22}
        height={22}
        className="h-[22px] w-[22px] shrink-0 rounded-md object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-[var(--color-surface)] text-[12px]"
      title={label}
    >
      {icon || "🌿"}
    </span>
  );
}
