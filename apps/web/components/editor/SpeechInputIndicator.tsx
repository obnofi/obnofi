"use client";

interface SpeechInputIndicatorProps {
  isListening: boolean;
  interimTranscript: string;
}

/** 녹음 중일 때 에디터 하단에 표시되는 실시간 interim 텍스트 패널 */
export function SpeechInputIndicator({
  isListening,
  interimTranscript,
}: SpeechInputIndicatorProps) {
  if (!isListening) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="음성인식 결과 미리보기"
      className="mt-2 flex items-start gap-2.5 rounded-md bg-[var(--color-accent-subtle)] px-3 py-2.5"
    >
      {/* 녹음 중 표시 */}
      <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
        </span>
        <span className="text-xs font-medium text-[var(--color-accent)]">
          녹음 중
        </span>
      </div>

      {/* interim 텍스트 — 회색으로 표시 */}
      <p className="min-h-[1.25rem] text-sm text-[var(--color-text-secondary)]">
        {interimTranscript || (
          <span className="text-[var(--color-text-placeholder)]">
            말하세요…
          </span>
        )}
      </p>
    </div>
  );
}
