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

const TYPE_LABEL: Record<string, string> = {
  page: "page",
  canvas: "canvas",
  graph: "graph",
};

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

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const pushSort = (next: "latest" | "popular") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next);
    router.push(`?${params.toString()}`);
  };

  const pushTag = (item: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag === item) {
      params.delete("tag");
    } else {
      params.set("tag", item);
    }
    router.push(`?${params.toString()}`);
  };

  const clearTag = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tag");
    router.push(`?${params.toString()}`);
  };

  return (
    <div
      className="flex flex-col w-full min-h-full"
      style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s" }}
    >
      {/* toolbar */}
      <header
        className="shrink-0 bg-[var(--color-background)] px-6 py-3 flex flex-wrap items-center gap-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-1 rounded-lg bg-[var(--color-surface)] p-0.5" style={{ border: "1px solid var(--color-border)" }}>
          {(["latest", "popular"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pushSort(s)}
              className="rounded-md px-3 py-1 text-[13px] transition"
              style={{
                background: sort === s ? "var(--color-accent-subtle)" : "transparent",
                color: sort === s ? "var(--color-accent)" : "var(--color-text-secondary)",
                fontWeight: sort === s ? 600 : 400,
              }}
            >
              {s === "latest" ? "최신순" : "인기순"}
            </button>
          ))}
        </div>

        {/* active tag chip */}
        {tag ? (
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px]" style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>
            <span>#{tag}</span>
            <button
              type="button"
              onClick={clearTag}
              className="ml-0.5 rounded-full p-0.5 transition hover:opacity-70"
              aria-label="태그 초기화"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : null}

        {/* tag pills */}
        {initialTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {initialTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pushTag(t)}
                className="rounded-full px-2.5 py-0.5 text-[12px] transition"
                style={{
                  background: tag === t ? "var(--color-accent-subtle)" : "var(--color-hover)",
                  color: tag === t ? "var(--color-accent)" : "var(--color-text-secondary)",
                }}
              >
                #{t}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {/* masonry grid */}
      <main className="p-6">
        {publications.length === 0 ? (
          <p className="py-20 text-center text-[14px] text-[var(--color-text-secondary)]">
            {isPending ? "불러오는 중…" : "게시된 snapshot이 없습니다."}
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-5">
            {publications.map((pub) => (
              <article
                key={pub.id}
                className="break-inside-avoid mb-5 rounded-xl p-5 transition"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {/* type badge */}
                <p
                  className="mb-2.5 text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-placeholder)]"
                  style={{ fontFamily: "'Averia Serif Libre', serif" }}
                >
                  {TYPE_LABEL[pub.snapshotType] ?? pub.snapshotType}
                </p>

                {/* title */}
                <Link
                  href={`/p/${pub.id}`}
                  className="block text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition leading-snug"
                  style={{
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                  }}
                >
                  {pub.title || "제목 없음"}
                </Link>

                {/* description */}
                {pub.description ? (
                  <p
                    className="mt-3 line-clamp-4 text-[13px] leading-[1.7] text-[var(--color-text-secondary)]"
                    style={{ fontFamily: "'Averia Serif Libre', serif" }}
                  >
                    {pub.description}
                  </p>
                ) : null}

                {/* tags */}
                {pub.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pub.tags.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => pushTag(item)}
                        className="rounded-full px-2.5 py-0.5 text-[12px] transition"
                        style={{
                          background: "var(--color-hover)",
                          color: "var(--color-text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
                        }}
                      >
                        #{item}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* footer */}
                <div
                  className="mt-4 flex items-center gap-3 pt-4"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  {/* author avatar */}
                  {pub.author.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pub.author.image}
                      alt={pub.author.name}
                      className="h-6 w-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold"
                      style={{
                        background: "var(--color-accent-subtle)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {pub.author.name?.[0] ?? "?"}
                    </div>
                  )}
                  <span className="text-[12px] text-[var(--color-text-secondary)] min-w-0 truncate flex-1">
                    {pub.author.name}
                  </span>
                  <span className="text-[12px] text-[var(--color-text-placeholder)] shrink-0">
                    {formatDate(pub.createdAt)}
                  </span>
                  <ForestLikeButton
                    publishId={pub.id}
                    initialLiked={pub.viewerHasLiked}
                    initialLikeCount={pub.likeCount}
                    compact
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
