"use client";

import Image from "next/image";

// ---------------------------------------------------------------------------
// SkeletonBlock
// ---------------------------------------------------------------------------

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-[var(--color-hover)] ${className ?? ""}`}
    />
  );
}

// ---------------------------------------------------------------------------
// AccountSettingsPageSkeleton
// ---------------------------------------------------------------------------

export function AccountSettingsPageSkeleton() {
  return (
    <div className="max-w-4xl animate-pulse" aria-hidden="true">
      <div className="mb-8 space-y-3">
        <SkeletonBlock className="h-9 w-40" />
        <SkeletonBlock className="h-4 w-[32rem] max-w-full" />
      </div>

      <section className="mb-10">
        <div className="mb-4 space-y-2">
          <SkeletonBlock className="h-7 w-20" />
          <SkeletonBlock className="h-4 w-[28rem] max-w-full" />
        </div>

        <div className="rounded-lg bg-[var(--color-surface)] p-6">
          <div className="grid gap-8 lg:grid-cols-[120px_minmax(0,1fr)]">
            <div className="flex flex-col items-center gap-3">
              <SkeletonBlock className="h-24 w-24 rounded-full" />
              <SkeletonBlock className="h-3 w-24" />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-10 w-full" />
              </div>

              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-28" />
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonBlock key={index} className="h-14 w-14 rounded-full" />
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <SkeletonBlock className="h-9 w-28" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 space-y-2">
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-[var(--color-surface)] p-5">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-4 w-40" />
          </div>
          <div className="rounded-lg bg-[var(--color-surface)] p-5">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-4 w-32" />
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SettingSection
// ---------------------------------------------------------------------------

export function SettingSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export function Button({
  children,
  disabled,
  onClick,
  type = "button",
  variant = "primary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
      : variant === "secondary"
        ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
        : "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ProfileImagePicker
// ---------------------------------------------------------------------------

export function ProfileImagePicker({
  imageOptions,
  selectedImage,
  onSelect,
}: {
  imageOptions: string[];
  selectedImage: string | null;
  onSelect: (url: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {imageOptions.map((imageUrl) => {
        const isSelected = imageUrl === selectedImage;
        return (
          <button
            key={imageUrl}
            type="button"
            onClick={() => onSelect(imageUrl)}
            className={`rounded-full p-1 transition ${
              isSelected ? "bg-[var(--color-accent-subtle)]" : "bg-transparent"
            }`}
            aria-label="Select profile image"
          >
            <Image
              src={imageUrl}
              alt="Profile preset"
              width={56}
              height={56}
              className={`h-14 w-14 rounded-full object-cover ring-2 ${
                isSelected ? "ring-[var(--color-accent)]" : "ring-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// formatJoinedDate
// ---------------------------------------------------------------------------

export function formatJoinedDate(isoDate: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}
