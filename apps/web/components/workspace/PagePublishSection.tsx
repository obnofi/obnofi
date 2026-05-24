"use client";

import { Globe, Link2, Copy, Check } from "lucide-react";

interface PagePublishSectionProps {
  isPublic: boolean;
  isLoading: boolean;
  publishUrl: string;
  publishCopied: boolean;
  onTogglePublish: () => void;
  onCopyPublishLink: () => void;
}

export function PagePublishSection({
  isPublic,
  isLoading,
  publishUrl,
  publishCopied,
  onTogglePublish,
  onCopyPublishLink,
}: PagePublishSectionProps) {
  return (
    <div className="px-1 py-1.5">
      <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">
        게시
      </p>

      <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--color-hover)]">
        <div className="flex items-center gap-2.5">
          <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              웹에 게시
            </p>
            <p className="text-[11px] text-[var(--color-text-placeholder)]">
              {isPublic ? "누구나 링크로 볼 수 있음" : "비공개 상태"}
            </p>
          </div>
        </div>
        <button
          onClick={onTogglePublish}
          disabled={isLoading}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-wait ${
            isPublic
              ? "bg-[var(--color-accent)]"
              : "bg-zinc-300 dark:bg-zinc-600"
          }`}
          aria-label={isPublic ? "게시 취소" : "게시"}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              isPublic ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {isPublic && publishUrl && (
        <div className="mx-2 mb-1 mt-1 flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-placeholder)]" />
          <span className="flex-1 truncate text-[12px] text-[var(--color-text-secondary)]">
            {publishUrl.replace(/^https?:\/\//, "")}
          </span>
          <button
            onClick={onCopyPublishLink}
            className="shrink-0 rounded p-0.5 transition hover:bg-[var(--color-hover)]"
            aria-label="게시 링크 복사"
          >
            {publishCopied ? (
              <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
