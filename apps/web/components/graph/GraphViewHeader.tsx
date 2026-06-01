"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Check, Copy, Globe2, Trash2 } from "lucide-react";
import { copyToClipboard } from "@/lib/copyToClipboard";
import type { PublishedSnapshotSummary } from "@/lib/publishedPageTypes";

interface GraphViewHeaderProps {
  workspaceId: string;
  queryPageId: string | null;
  nodeCount: number;
  edgeCount: number;
}

export function GraphViewHeader({
  workspaceId,
  queryPageId,
  nodeCount,
  edgeCount,
}: GraphViewHeaderProps) {
  const [publication, setPublication] = useState<PublishedSnapshotSummary | null>(null);
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPublication = async () => {
      const response = await fetch(`/api/published-pages?mine=true&workspaceId=${workspaceId}`);
      if (!response.ok) {
        return;
      }
      const data = await response.json() as { publication: PublishedSnapshotSummary | null };
      if (cancelled) {
        return;
      }
      setPublication(data.publication);
      if (data.publication) {
        setDescription(data.publication.description);
        setTagInput(data.publication.tags.join(", "));
      }
    };

    void loadPublication();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const publishUrl = useMemo(
    () =>
      publication
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${publication.id}`
        : "",
    [publication]
  );

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/published-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "graph",
          workspaceId,
          focusedPageId: queryPageId,
          description,
          tags: tagInput.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5),
        }),
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json() as { publication: PublishedSnapshotSummary };
      setPublication(data.publication);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!publication) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/published-pages/${publication.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        return;
      }
      setPublication(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publishUrl) {
      return;
    }
    const copied = await copyToClipboard(publishUrl);
    if (!copied) {
      return;
    }
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-5 py-3">
      <div className="flex items-center gap-3">
        <Link
          href={`/workspace/${workspaceId}${queryPageId ? `?page=${queryPageId}` : ""}`}
          data-testid="graph-back-link"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          aria-label="워크스페이스로 돌아가기"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Graph View
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {nodeCount}개 노드, {edgeCount}개 링크
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
        >
          <Globe2 className="h-4 w-4" />
          Publish
        </button>

        {isOpen ? (
          <div className="absolute right-0 top-full z-[100] mt-2 w-80 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
              Graph Snapshot
            </p>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              maxLength={160}
              placeholder="한 줄 설명을 입력하세요."
              className="w-full resize-none rounded-md bg-[var(--color-background)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] placeholder:text-[var(--color-text-placeholder)] focus:ring-[var(--color-accent)]"
            />
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="tags, comma, separated"
              className="mt-2 w-full rounded-md bg-[var(--color-background)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] placeholder:text-[var(--color-text-placeholder)] focus:ring-[var(--color-accent)]"
            />
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePublish}
                disabled={isLoading || !description.trim()}
                className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-wait disabled:opacity-60"
              >
                {publication ? "Republish" : "Publish"}
              </button>
              <div className="flex items-center gap-1">
                {publication ? (
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" /> : <Copy className="h-3.5 w-3.5" />}
                    Link
                  </button>
                ) : null}
                {publication ? (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Unpublish
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
