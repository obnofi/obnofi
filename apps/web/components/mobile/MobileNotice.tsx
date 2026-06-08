"use client";

import Link from "next/link";
import { Monitor } from "lucide-react";

interface MobileNoticeProps {
  /** 안내 문구 (기능별로 다르게 표시) */
  message?: string;
  /** 랜딩으로 돌아가는 링크 노출 여부 */
  showHomeLink?: boolean;
}

/**
 * 모바일에서 지원하지 않는 화면/기능에 표시하는 안내 화면.
 * 모바일에서는 랜딩, 회원가입, 문서 글쓰기만 지원한다.
 */
export function MobileNotice({
  message = "이 기능은 데스크톱에서 이용해 주세요.",
  showHomeLink = true,
}: MobileNoticeProps) {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-8 py-16 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--color-accent-subtle)" }}
      >
        <Monitor className="h-8 w-8" style={{ color: "var(--color-accent)" }} />
      </div>
      <h1
        className="text-lg font-semibold"
        style={{ color: "var(--color-text-primary)" }}
      >
        데스크톱 전용 화면
      </h1>
      <p
        className="max-w-xs text-sm leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {message}
      </p>
      {showHomeLink && (
        <Link
          href="/"
          className="mt-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-background)",
          }}
        >
          홈으로 돌아가기
        </Link>
      )}
    </div>
  );
}
