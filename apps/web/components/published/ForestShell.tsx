import Link from "next/link";
import { Compass, Leaf, Trees } from "lucide-react";
import { SiteLogo } from "@/components/branding/SiteLogo";

interface ForestShellProps {
  currentSection: "forest" | "snapshot";
  children: React.ReactNode;
}

function navLinkClassName(isActive: boolean) {
  return `rounded-full px-4 py-2 text-[13px] font-medium transition ${
    isActive
      ? "bg-[var(--color-accent)] text-white"
      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
  }`;
}

export function ForestShell({ currentSection, children }: ForestShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header
        className="sticky top-0 z-20 backdrop-blur-sm"
        style={{ background: "color-mix(in srgb, var(--color-background) 88%, transparent)" }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="inline-flex items-center">
            <SiteLogo width={108} />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/forest" className={navLinkClassName(currentSection === "forest")}>
              <span className="inline-flex items-center gap-2">
                <Trees className="h-4 w-4" />
                Forest
              </span>
            </Link>
            <Link href="/workspace" className={navLinkClassName(false)}>
              <span className="inline-flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Workspace
              </span>
            </Link>
            <div className={navLinkClassName(currentSection === "snapshot")}>
              <span className="inline-flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Snapshot
              </span>
            </div>
          </nav>

          <Link
            href="/workspace"
            className="rounded-full px-4 py-2 text-[13px] font-medium transition"
            style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
          >
            Open Workspace
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
