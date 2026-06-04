"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ForestLikeButton } from "@/components/published/ForestLikeButton";
import type { PublishedSnapshotSummary } from "@/lib/publishedPageTypes";

interface ForestFeedClientProps {
  initialPublications: PublishedSnapshotSummary[];
  initialTags: string[];
  initialSort: "latest" | "popular";
  initialTag: string | null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ForestFeedClient({
  initialPublications,
  initialTags,
  initialSort,
  initialTag,
}: ForestFeedClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [publications, setPublications] = useState(initialPublications);
  const [votes, setVotes] = useState<Record<string, "up" | "down" | null>>({});

  const toggleVote = (id: string, dir: "up" | "down") =>
    setVotes((prev) => ({ ...prev, [id]: prev[id] === dir ? null : dir }));

  const sort = searchParams.get("sort") === "popular" ? "popular" : initialSort;
  const tag = searchParams.get("tag") ?? initialTag;

  useEffect(() => {
    const nextSort = searchParams.get("sort") === "popular" ? "popular" : "latest";
    const nextTag = searchParams.get("tag");
    const url = `/api/published-pages?sort=${nextSort}${nextTag ? `&tag=${encodeURIComponent(nextTag)}` : ""}`;

    let cancelled = false;
    startTransition(() => {
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || cancelled) return;
          setPublications(data.publications);
        })
        .catch(() => {});
    });

    return () => { cancelled = true; };
  }, [searchParams]);

  const pushTag = (item: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tag", item);
    router.push(`?${params.toString()}`);
  };

  return (
    <div
      className="flex flex-col w-full h-full overflow-y-auto"
      style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s" }}
    >
      {/* header */}
      <header className="h-12 border-b border-[var(--color-border)] flex items-center justify-between px-4 shrink-0 bg-[var(--color-background)]">
        <span className="text-[14px] text-[var(--color-text-primary)] font-medium">
          forest
        </span>
      </header>

      <div className="mx-auto w-full max-w-[640px] px-4">
      {publications.length === 0 ? (
        <p className="py-20 text-center text-[14px] text-[var(--color-text-secondary)]">
          {isPending ? "불러오는 중…" : "게시된 snapshot이 없습니다."}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--color-border)]">
          {publications.map((pub) => (
            <article key={pub.id} className="py-10">
              <div className="min-w-0 flex-1">
                {/* type */}
                <p
                  className="mb-3 text-[13px] text-[var(--color-text-secondary)]"
                  style={{ fontFamily: "'Averia Serif Libre', serif" }}
                >
                  {pub.snapshotType?.toLowerCase()}
                </p>

                {/* title */}
                <Link
                  href={`/p/${pub.id}`}
                  className="block leading-tight text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
                  style={{
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 700,
                  }}
                >
                  {pub.title}
                </Link>

                {/* description */}
                {pub.description ? (
                  <p
                    className="mt-5 line-clamp-3 text-[16px] leading-[1.75] text-[var(--color-text-secondary)]"
                    style={{ fontFamily: "'Averia Serif Libre', serif" }}
                  >
                    {pub.description}
                  </p>
                ) : null}

                {/* tags */}
                {pub.tags.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-4">
                    {pub.tags.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => pushTag(item)}
                        className="text-[15px] text-[var(--color-text-secondary)] transition hover:text-[var(--color-accent)]"
                        style={{ fontFamily: "'Averia Serif Libre', serif" }}
                      >
                        #{item}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* meta */}
                <div className="mt-6 flex items-center gap-4">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">
                    {pub.author.name}
                  </span>
                  <span className="text-[13px] text-[var(--color-text-secondary)]">
                    {formatDate(pub.createdAt)}
                  </span>
                  <ForestLikeButton
                    publishId={pub.id}
                    initialLiked={pub.viewerHasLiked}
                    initialLikeCount={pub.likeCount}
                    compact
                  />
                  <button
                    type="button"
                    aria-label="위로"
                    onClick={() => toggleVote(pub.id, "up")}
                    className="flex h-7 w-7 items-center justify-center rounded transition"
                    style={{
                      color: votes[pub.id] === "up" ? "#e53e3e" : "var(--color-text-secondary)",
                      background: votes[pub.id] === "up" ? "#fff5f5" : undefined,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 11V3M7 3L3 7M7 3L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="아래로"
                    onClick={() => toggleVote(pub.id, "down")}
                    className="flex h-7 w-7 items-center justify-center rounded transition"
                    style={{
                      color: votes[pub.id] === "down" ? "#3182ce" : "var(--color-text-secondary)",
                      background: votes[pub.id] === "down" ? "#ebf8ff" : undefined,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 3V11M7 11L3 7M7 11L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
