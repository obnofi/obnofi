"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, BookOpenText, Layers3, Search, Sprout, Trees, X } from "lucide-react";
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

const TYPE_CONFIG: Record<string, { label: string; tone: string }> = {
  page: { label: "Grove", tone: "var(--color-accent)" },
  canvas: { label: "Clearing", tone: "var(--color-graph-current)" },
  graph: { label: "Forest", tone: "var(--color-graph-unresolved)" },
};
const SNAPSHOT_TYPE_ORDER = ["page", "canvas", "graph"] as const;

function getSnapshotTypeLabel(type: string) {
  return TYPE_CONFIG[type]?.label ?? type;
}

function getTopTags(publications: PublishedSnapshotSummary[], fallbackTags: string[]) {
  const tagCounts = new Map<string, number>();
  publications.forEach((publication) => {
    publication.tags.forEach((item) => {
      tagCounts.set(item, (tagCounts.get(item) ?? 0) + 1);
    });
  });

  const ranked = [...tagCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([item]) => item);

  return ranked.length > 0 ? ranked.slice(0, 6) : fallbackTags.slice(0, 6);
}

function EmptyState({
  tag,
  searchQuery,
  onClearTag,
  onClearSearch,
}: {
  tag: string | null;
  searchQuery: string;
  onClearTag: () => void;
  onClearSearch: () => void;
}) {
  const heading = searchQuery
    ? `"${searchQuery}"에 대한 결과가 없습니다`
    : tag
      ? `#${tag} 태그에 해당하는 Snapshot이 없습니다`
      : "아직 게시된 Snapshot이 없습니다";

  const action = searchQuery ? onClearSearch : tag ? onClearTag : null;
  const actionLabel = searchQuery ? "검색 초기화" : "태그 초기화";

  return (
    <div
      className="rounded-[28px] px-6 py-16 text-center sm:px-10"
      style={{ background: "var(--color-surface)" }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
      >
        <Trees className="h-6 w-6" />
      </div>
      <h3
        className="mt-5 text-[22px] font-semibold tracking-[-0.03em]"
        style={{ color: "var(--color-text-primary)" }}
      >
        {heading}
      </h3>
      <p
        className="mx-auto mt-3 max-w-[32rem] text-[15px] leading-7"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Forest는 게시한 Snapshot을 에디토리얼 피드처럼 모아보는 공간입니다.
      </p>
      {action ? (
        <button
          type="button"
          onClick={action}
          className="mt-6 rounded-full px-4 py-2 text-[13px] font-medium transition"
          style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function AuthorBadge({ publication }: { publication: PublishedSnapshotSummary }) {
  if (publication.author.image) {
    return (
      <Image
        src={publication.author.image}
        alt={publication.author.name}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
      style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
    >
      {publication.author.name?.[0] ?? "?"}
    </div>
  );
}

function TagChip({
  tag,
  active,
  onClick,
}: {
  tag: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-[12px] font-medium transition"
      style={{
        background: active ? "var(--color-accent-subtle)" : "var(--color-hover)",
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
      }}
    >
      #{tag}
    </button>
  );
}

function PublicationMeta({
  publication,
  compact = false,
}: {
  publication: PublishedSnapshotSummary;
  compact?: boolean;
}) {
  const typeConf = TYPE_CONFIG[publication.snapshotType] ?? {
    label: publication.snapshotType,
    tone: "var(--color-text-secondary)",
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${compact ? "text-[12px]" : "text-[13px]"}`}
      style={{ color: "var(--color-text-secondary)" }}
    >
      <span style={{ color: typeConf.tone }} className="font-semibold">
        {typeConf.label}
      </span>
      <span aria-hidden="true">·</span>
      <span>{formatDate(publication.createdAt)}</span>
      <span aria-hidden="true">·</span>
      <span>{publication.author.name}</span>
    </div>
  );
}

function PublicationRow({
  publication,
  pushTag,
}: {
  publication: PublishedSnapshotSummary;
  pushTag: (tag: string) => void;
}) {
  return (
    <article className="group grid gap-5 py-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div className="min-w-0">
        <PublicationMeta publication={publication} />
        <Link
          href={`/p/${publication.id}`}
          className="mt-2 block text-[1.55rem] font-semibold leading-[1.2] tracking-[-0.035em] transition group-hover:opacity-75"
          style={{ color: "var(--color-text-primary)" }}
        >
          {publication.title || "제목 없음"}
        </Link>
        {publication.description ? (
          <p
            className="mt-3 max-w-[52rem] text-[15px] leading-7"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {publication.description}
          </p>
        ) : null}
        {publication.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {publication.tags.slice(0, 4).map((item) => (
              <TagChip key={item} tag={item} onClick={() => pushTag(item)} />
            ))}
            <Link
              href={`/p/${publication.id}`}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
            >
              Read
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3 md:pt-1">
        <AuthorBadge publication={publication} />
        <ForestLikeButton
          publishId={publication.id}
          initialLiked={publication.viewerHasLiked}
          initialLikeCount={publication.likeCount}
          compact
        />
      </div>
    </article>
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
        (publication) =>
          publication.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          publication.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          publication.tags.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : publications;

  const featuredPublication = displayPublications[0] ?? null;
  const trendingPublications = [...displayPublications]
    .sort((left, right) => {
      if (right.likeCount !== left.likeCount) {
        return right.likeCount - left.likeCount;
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })
    .slice(0, 4);
  const remainingPublications = featuredPublication
    ? displayPublications.filter((publication) => publication.id !== featuredPublication.id)
    : [];
  const totalLikes = displayPublications.reduce(
    (sum, publication) => sum + publication.likeCount,
    0
  );
  const topTags = getTopTags(displayPublications, initialTags);
  const typeHighlights = SNAPSHOT_TYPE_ORDER.map((type) => ({
    type,
    label: getSnapshotTypeLabel(type),
    count: displayPublications.filter((publication) => publication.snapshotType === type).length,
  })).filter((item) => item.count > 0);

  useEffect(() => {
    const nextSort = searchParams.get("sort") === "popular" ? "popular" : "latest";
    const nextTag = searchParams.get("tag");
    const url = `/api/published-pages?sort=${nextSort}${nextTag ? `&tag=${encodeURIComponent(nextTag)}` : ""}`;

    let cancelled = false;
    startTransition(() => {
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || cancelled) {
            return;
          }
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
    <div className="pb-20">
      <section className="mx-auto max-w-[1180px] px-5 pb-7 pt-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>
              <Sprout className="h-4 w-4" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em]">Forest</span>
            </div>
            <h1
              className="mt-5 max-w-[12ch] text-[2.7rem] font-semibold leading-[0.95] tracking-[-0.065em] sm:text-[4.8rem]"
              style={{ color: "var(--color-text-primary)" }}
            >
              발견할 만한 지식만 남기는 숲
            </h1>
            <p
              className="mt-5 max-w-[48rem] text-[16px] leading-8 sm:text-[17px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Forest는 Grove 문서, Clearing 캔버스, Graph 스냅샷을 읽기 좋은 에디토리얼 피드로 정리합니다.
              카드 벽보다 제목, 맥락, 주제가 먼저 보이도록 큐레이션 밀도를 높였습니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {topTags.slice(0, 4).map((item) => (
                <TagChip key={item} tag={item} active={tag === item} onClick={() => pushTag(item)} />
              ))}
            </div>
          </div>

          <div
            className="rounded-[32px] px-5 py-5 shadow-[inset_0_0_0_1px_var(--color-border)]"
            style={{ background: "var(--color-surface)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-placeholder)" }}>
                Field notes
              </p>
              <BookOpenText className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "snapshots", value: displayPublications.length },
                { label: "topics", value: initialTags.length },
                { label: "likes", value: totalLikes },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[28px] font-semibold tracking-[-0.05em]" style={{ color: "var(--color-text-primary)" }}>
                    {item.value}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2">
              {(typeHighlights.length > 0 ? typeHighlights : [{ type: "empty", label: "No snapshots", count: 0 }]).map((item) => (
                <div key={item.type} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2" style={{ background: "var(--color-background)" }}>
                  <span className="inline-flex items-center gap-2 text-[13px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                    <Layers3 className="h-3.5 w-3.5" style={{ color: "var(--color-text-secondary)" }} />
                    {item.label}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(["latest", "popular"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => pushSort(item)}
                className="rounded-full px-4 py-2 text-[13px] font-medium transition"
                style={{
                  background: sort === item ? "var(--color-accent)" : "var(--color-surface)",
                  color: sort === item ? "#FFFFFF" : "var(--color-text-secondary)",
                }}
              >
                {item === "latest" ? "최신순" : "인기순"}
              </button>
            ))}

            {tag ? (
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium"
                style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
              >
                <span>#{tag}</span>
                <button type="button" onClick={clearTag} aria-label="태그 초기화">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          <div
            className="flex min-w-0 items-center gap-2 rounded-full px-4 py-3 lg:w-[320px]"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-secondary)" }} />
            <input
              aria-label="Forest 검색"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 요약, 태그 검색"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
              style={{ color: "var(--color-text-primary)" }}
            />
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="검색 초기화">
                <X className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
              </button>
            ) : null}
          </div>
        </div>

        {initialTags.length > 0 ? (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {initialTags.map((item) => (
              <TagChip
                key={item}
                tag={item}
                active={tag === item}
                onClick={() => pushTag(item)}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-10">
        {isPending ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[30px] px-6 py-7 animate-pulse"
                  style={{ background: "var(--color-surface)" }}
                >
                  <div className="h-4 w-40 rounded" style={{ background: "var(--color-hover)" }} />
                  <div className="mt-4 h-8 w-4/5 rounded" style={{ background: "var(--color-hover)" }} />
                  <div className="mt-3 h-4 w-full rounded" style={{ background: "var(--color-hover)" }} />
                  <div className="mt-2 h-4 w-2/3 rounded" style={{ background: "var(--color-hover)" }} />
                </div>
              ))}
            </div>
            <div
              className="h-[320px] rounded-[30px] animate-pulse"
              style={{ background: "var(--color-surface)" }}
            />
          </div>
        ) : displayPublications.length === 0 ? (
          <EmptyState
            tag={tag}
            searchQuery={searchQuery}
            onClearTag={clearTag}
            onClearSearch={() => setSearchQuery("")}
          />
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div>
                <p
                  className="text-[12px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--color-text-placeholder)" }}
                >
                  이번 주 인기 Snapshot
                </p>

                {featuredPublication ? (
                  <article className="mt-5 rounded-[34px] px-6 py-7 sm:px-8 sm:py-9" style={{ background: "var(--color-surface)", border: "1px solid var(--color-accent)" }}>
                    <PublicationMeta publication={featuredPublication} />
                    <Link
                      href={`/p/${featuredPublication.id}`}
                      className="mt-3 block text-[2rem] font-semibold leading-[1.02] tracking-[-0.055em] transition hover:opacity-75 sm:text-[3.25rem]"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {featuredPublication.title || "제목 없음"}
                    </Link>
                    {featuredPublication.description ? (
                      <p
                        className="mt-5 max-w-[46rem] text-[16px] leading-8"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {featuredPublication.description}
                      </p>
                    ) : null}

                    <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {featuredPublication.tags.slice(0, 5).map((item) => (
                          <TagChip key={item} tag={item} onClick={() => pushTag(item)} />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <AuthorBadge publication={featuredPublication} />
                        <ForestLikeButton
                          publishId={featuredPublication.id}
                          initialLiked={featuredPublication.viewerHasLiked}
                          initialLikeCount={featuredPublication.likeCount}
                        />
                      </div>
                    </div>
                  </article>
                ) : null}
              </div>

              <div className="mt-12">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p
                      className="text-[12px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: "var(--color-text-placeholder)" }}
                    >
                      전체 Snapshot
                    </p>
                    <h2
                      className="mt-2 text-[28px] font-semibold tracking-[-0.04em]"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      최근에 게시된 아카이브
                    </h2>
                  </div>
                  <span className="hidden text-[13px] lg:block" style={{ color: "var(--color-text-secondary)" }}>
                    {displayPublications.length} items
                  </span>
                </div>

                <div className="mt-5">
                  {remainingPublications.map((publication, index) => (
                    <div
                      key={publication.id}
                      style={{
                        borderTop: index === 0 ? "1px solid var(--color-border)" : undefined,
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <PublicationRow publication={publication} pushTag={pushTag} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div
                className="rounded-[30px] px-5 py-6"
                style={{ background: "var(--color-surface)" }}
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-placeholder)" }}>
                  Reading paths
                </p>
                <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]" style={{ color: "var(--color-text-primary)" }}>
                  오늘 둘러볼 갈래
                </h3>
                <div className="mt-5 space-y-2">
                  {topTags.slice(0, 5).map((item, index) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => pushTag(item)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-[var(--color-hover)]"
                    >
                      <span className="shrink-0 text-[12px] font-semibold tabular-nums" style={{ color: "var(--color-text-placeholder)" }}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 truncate text-[14px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                        #{item}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="rounded-[30px] px-5 py-6"
                style={{ background: "var(--color-surface)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-placeholder)" }}>
                      Popular
                    </p>
                    <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]" style={{ color: "var(--color-text-primary)" }}>
                      많이 본 Snapshot
                    </h3>
                  </div>
                  <ArrowUpRight className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
                </div>

                <div className="mt-5 space-y-4">
                  {trendingPublications.map((publication, index) => (
                    <Link
                      key={publication.id}
                      href={`/p/${publication.id}`}
                      className="block transition hover:opacity-75"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="pt-0.5 text-[12px] font-semibold"
                          style={{ color: "var(--color-text-placeholder)" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[16px] font-semibold leading-6 tracking-[-0.02em]" style={{ color: "var(--color-text-primary)" }}>
                            {publication.title}
                          </p>
                          <p className="mt-1 text-[13px] leading-6" style={{ color: "var(--color-text-secondary)" }}>
                            {publication.author.name} · {publication.likeCount} likes
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div
                className="rounded-[30px] px-5 py-6"
                style={{ background: "var(--color-surface)" }}
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-placeholder)" }}>
                  Topics
                </p>
                <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]" style={{ color: "var(--color-text-primary)" }}>
                  자주 읽히는 태그
                </h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  {initialTags.slice(0, 18).map((item) => (
                    <TagChip
                      key={item}
                      tag={item}
                      active={tag === item}
                      onClick={() => pushTag(item)}
                    />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
