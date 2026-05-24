"use client";

export function PageTreeSkeleton() {
  const rows = [
    { indent: 0, width: "70%" },
    { indent: 1, width: "55%" },
    { indent: 1, width: "60%" },
    { indent: 0, width: "75%" },
    { indent: 0, width: "50%" },
    { indent: 1, width: "45%" },
  ];

  return (
    <div
      className="flex flex-col gap-1 py-1 animate-pulse"
      aria-hidden="true"
      data-testid="page-tree-skeleton"
    >
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 py-1"
          style={{ paddingLeft: `${row.indent * 14 + 8}px`, paddingRight: "8px" }}
        >
          <div className="h-3 w-3 shrink-0 rounded-sm bg-[var(--color-hover)]" />
          <div className="h-3 w-3 shrink-0 rounded-sm bg-[var(--color-hover)]" />
          <div className="h-3 rounded bg-[var(--color-hover)]" style={{ width: row.width }} />
        </div>
      ))}
    </div>
  );
}

export function RecentSkeleton() {
  return (
    <div className="flex flex-col gap-1 py-1 animate-pulse" aria-hidden="true">
      {["55%", "65%", "45%"].map((width, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-3.5 w-3.5 shrink-0 rounded-sm bg-[var(--color-hover)]" />
          <div className="h-3 rounded bg-[var(--color-hover)]" style={{ width }} />
        </div>
      ))}
    </div>
  );
}
