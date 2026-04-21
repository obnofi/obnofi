import Link from "next/link";
import { SiteLogo } from "@/components/branding/SiteLogo";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--color-background)]">
      <main className="flex flex-col items-center justify-center gap-6 px-4 text-center">
        <SiteLogo
          priority
          className="h-auto w-[220px] sm:w-[280px]"
        />
        <p className="max-w-2xl text-lg text-[var(--color-text-secondary)]">
          A Notion-like workspace with publishing. Create, edit, and share your
          pages with unique URLs, or open the Clearing board for a FigJam-style
          collaboration surface.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/workspace/ws-1?page=page-1"
            className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Open Workspace
          </Link>
        </div>
      </main>
    </div>
  );
}
