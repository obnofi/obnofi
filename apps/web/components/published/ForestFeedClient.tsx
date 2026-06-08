"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Trees, X } from "lucide-react";
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

const TYPE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  page: { label: "Grove", bg: "var(--color-accent-subtle)", color: "var(--color-accent)" },
  canvas: { label: "Clearing", bg: "var(--color-graph-current-subtle)", color: "var(--color-graph-current)" },
  graph: { label: "Forest", bg: "var(--color-hover)", color: "var(--color-graph-unresolved)" },
};

function SkeletonCard() {
  return (
    <div
      className="break-inside-avoid mb-5 rounded-xl p-5"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div className="mb-2.5 h-5 w-14 rounded-full animate-pulse" style={{ background: "var(--color-hover)" }} />
      <div className="h-5 w-3/4 rounded animate-pulse" style={{ background: "var(--color-hover)" }} />
      <div className="mt-3 space-y-1.5">
        <div className="h-3 w-full rounded animate-pulse" style={{ background: "var(--color-border)" }} />
        <div className="h-3 w-5/6 rounded animate-pulse" style={{ background: "var(--color-border)" }} />
        <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: "var(--color-border)" }} />
      </div>
      <div
        className="mt-4 flex items-center gap-3 pt-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="h-6 w-6 rounded-full shrink-0 animate-pulse" style={{ background: "var(--color-hover)" }} />
        <div className="h-3 w-24 rounded animate-pulse" style={{ background: "var(--color-border)" }} />
        <div className="ml-auto h-3 w-16 rounded animate-pulse" style={{ background: "var(--color-border)" }} />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  tag: string | null;
  searchQuery: string;
  onClearTag: () => void;
  onClearSearch: () => void;
}

function EmptyState({ tag, searchQuery, onClearTag, onClearSearch }: EmptyStateProps) {
  const heading = searchQuery
    ? `"${searchQuery}"에 대한 결과 없음`
    : tag
    ? `#${tag} 태그 결과 없음`
    : "아직 게시된 Snapshot이 없어요";

  const subtext = searchQuery
    ? "다른 검색어를 시도해보세요."
    : tag
    ? "다른 태그를 선택하거나 전체를 확인해보세요."
    : "Forest는 게시한 Snapshot을 공유하는 공간입니다.";

  const action = searchQuery ? onClearSearch : tag ? onClearTag : null;
  const actionLabel = searchQuery ? "검색 초기화" : "태그 초기화";

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "var(--color-accent-subtle)" }}
      >
        <Trees className="h-9 w-9" style={{ color: "var(--color-accent)" }} />
      </div>
      <h3 className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {heading}
      </h3>
      <p
        className="mt-2 max-w-[28ch] text-[13px] leading-6"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {subtext}
      </p>
      {action ? (
        <button
          type="button"
          onClick={action}
          className="mt-5 rounded-lg px-4 py-2 text-[13px] font-medium transition hover:opacity-80"
          style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
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
  const [searchQuery, setSearchQuery] = useState("");

  const sort = searchParams.get("sort") === "popular" ? "popular" : initialSort;
  const tag = searchParams.get("tag") ?? initialTag;

  const displayPublications = searchQuery.trim()
    ? publications.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : publications;

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
    <div className="flex flex-col w-full min-h-full">
      {/* toolbar */}
      <header
        className="shrink-0 bg-[var(--color-background)] px-6 py-3 flex flex-wrap items-center gap-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {/* sort toggle */}
        <div
          className="flex items-center gap-1 rounded-lg bg-[var(--color-surface)] p-0.5"
          style={{ border: "1px solid var(--color-border)" }}
        >
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

        {/* search */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 flex-1 min-w-[160px] max-w-[280px]"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-text-secondary)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 내용 검색…"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--color-text-placeholder)]"
            style={{ color: "var(--color-text-primary)" }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="shrink-0 rounded-full p-0.5 transition hover:opacity-70"
              aria-label="검색 초기화"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* active tag chip */}
        {tag ? (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px]"
            style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={clearTag}
              className="ml-0.5 rounded-full p-0.5 transition hover:opacity-70"
              aria-label="태그 초기화"
            >
              <X className="h-2.5 w-2.5" />
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

      {/* feed */}
      <main className="p-6">
        {isPending ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayPublications.length === 0 ? (
          <EmptyState
            tag={tag}
            searchQuery={searchQuery}
            onClearTag={clearTag}
            onClearSearch={() => setSearchQuery("")}
          />
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-5">
            {displayPublications.map((pub) => {
              const typeConf = TYPE_CONFIG[pub.snapshotType] ?? {
                label: pub.snapshotType,
                bg: "var(--color-hover)",
                color: "var(--color-text-secondary)",
              };
              return (
                <article
                  key={pub.id}
                  className="break-inside-avoid mb-5 rounded-xl p-5 transition-all duration-150"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  {/* type badge */}
                  <div className="mb-2.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide"
                      style={{ background: typeConf.bg, color: typeConf.color }}
                    >
                      {typeConf.label}
                    </span>
                  </div>

                  {/* title */}
                  <Link
                    href={`/p/${pub.id}`}
                    className="block transition leading-snug"
                    style={{
                      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                      fontSize: "1.0625rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-text-primary)";
                    }}
                  >
                    {pub.title || "제목 없음"}
                  </Link>

                  {/* description */}
                  {pub.description ? (
                    <p
                      className="mt-2.5 line-clamp-3 text-[13px] leading-[1.7]"
                      style={{
                        color: "var(--color-text-secondary)",
                        fontFamily: "'Averia Serif Libre', serif",
                      }}
                    >
                      {pub.description}
                    </p>
                  ) : null}

                  {/* tags */}
                  {pub.tags.length > 0 ? (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
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
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "var(--color-text-secondary)";
                          }}
                        >
                          #{item}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* footer */}
                  <div
                    className="mt-4 flex items-center gap-2.5 pt-3.5"
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
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
                    <span
                      className="text-[12px] min-w-0 truncate flex-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {pub.author.name}
                    </span>
                    <span
                      className="text-[11px] shrink-0"
                      style={{ color: "var(--color-text-placeholder)" }}
                    >
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
