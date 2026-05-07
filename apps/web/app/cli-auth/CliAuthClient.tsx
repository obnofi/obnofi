"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, CheckCircle2, Terminal } from "lucide-react";

interface Props {
  callbackUrl: string;
  state: string;
  name: string;
  user: { name: string | null; email: string | null; image: string | null };
}

export function CliAuthClient({ callbackUrl, state, name, user }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAuthorize() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/cli-auth/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callbackUrl, state, name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "알 수 없는 오류가 발생했습니다.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다. CLI가 아직 실행 중인지 확인하세요.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[var(--color-background)] px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-lg bg-[var(--color-surface)] p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
                <CheckCircle2 className="h-6 w-6 text-[var(--color-accent)]" aria-hidden="true" />
              </div>
            </div>
            <h1 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">
              인증 완료
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              터미널로 돌아가세요. CLI 로그인이 완료됐습니다.
            </p>
            <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
              이 창을 닫아도 됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-lg bg-[var(--color-surface)] p-8">
          {/* 헤더 */}
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
                <Terminal className="h-6 w-6 text-[var(--color-accent)]" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              CLI 연결 허용
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              obnofi CLI가 계정 접근 권한을 요청합니다.
            </p>
          </div>

          {/* 로그인 계정 */}
          <div className="mb-6 flex items-center gap-3 rounded-md bg-[var(--color-background)] px-3 py-2.5">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "avatar"}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-medium text-white">
                {(user.name ?? user.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {user.name && (
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {user.name}
                </p>
              )}
              <p className="truncate text-xs text-[var(--color-text-secondary)]">
                {user.email}
              </p>
            </div>
          </div>

          {/* 권한 안내 */}
          <ul className="mb-6 space-y-2 text-sm text-[var(--color-text-secondary)]">
            {[
              "워크스페이스 페이지 읽기",
              "새 페이지 생성",
              "데이터베이스 검색",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          {/* 오류 메시지 */}
          {status === "error" && errorMsg && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* 버튼 */}
          <button
            onClick={handleAuthorize}
            disabled={status === "loading"}
            className="w-full rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            {status === "loading" ? "처리 중..." : "CLI 연결 허용"}
          </button>

          <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
            허용하면 CLI에서 이 계정으로 API를 호출할 수 있습니다.
            <br />
            언제든 설정에서 토큰을 폐기할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
