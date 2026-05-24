"use client";

import { SkeletonBlock } from "./SettingsShared";

export function SettingsSectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <section className="space-y-4 rounded-xl bg-[var(--color-surface)] p-5">
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-3 w-64 max-w-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start"
          >
            <div className="space-y-2">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-3 w-32 max-w-full" />
            </div>
            <div className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
              <SkeletonBlock
                className="h-4 max-w-full"
                style={{ width: index % 2 === 0 ? "60%" : "75%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AccountSettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-32" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </div>

      <section className="space-y-4 rounded-xl bg-[var(--color-surface)] p-5">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-3 w-80 max-w-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[120px_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            <SkeletonBlock className="h-24 w-24 rounded-full" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              <div className="space-y-2">
                <SkeletonBlock className="h-3.5 w-12" />
              </div>
              <SkeletonBlock className="h-10 w-full" />
            </div>
            <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              <div className="space-y-2">
                <SkeletonBlock className="h-3.5 w-16" />
              </div>
              <SkeletonBlock className="h-10 w-full" />
            </div>
            <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              <div className="space-y-2">
                <SkeletonBlock className="h-3.5 w-20" />
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-[52px] w-[52px] rounded-full" />
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <SkeletonBlock className="h-9 w-24" />
            </div>
          </div>
        </div>
      </section>

      <SettingsSectionSkeleton rows={1} />
      <SettingsSectionSkeleton rows={2} />

      <section className="space-y-4 rounded-xl bg-[var(--color-surface)] p-5">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-3 w-60 max-w-full" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-4 w-20" />
          </div>
          <div className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-4 w-24" />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-[var(--color-surface)] p-5">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-56 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]"
            >
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="mt-3 h-3 w-16" />
            </div>
          ))}
        </div>
      </section>

      <SettingsSectionSkeleton rows={2} />
      <SettingsSectionSkeleton rows={1} />
    </div>
  );
}

export function WorkspaceSettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-44" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>

      <SettingsSectionSkeleton rows={3} />

      <section className="space-y-4 rounded-xl bg-[var(--color-surface)] p-5">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-56 max-w-full" />
        </div>
        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
          <div className="space-y-2">
            <SkeletonBlock className="h-3.5 w-16" />
          </div>
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 flex-1" />
            <SkeletonBlock className="h-10 w-16" />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
          <div className="space-y-2">
            <SkeletonBlock className="h-3.5 w-24" />
          </div>
          <div className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <SkeletonBlock className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <SkeletonBlock className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-3 w-40 max-w-full" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-7 w-16" />
                <SkeletonBlock className="h-8 w-12" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <SettingsSectionSkeleton rows={2} />
      <SettingsSectionSkeleton rows={1} />
    </div>
  );
}
