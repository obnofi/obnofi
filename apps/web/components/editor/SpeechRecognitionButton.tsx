"use client";

import { Mic } from "lucide-react";

interface SpeechRecognitionButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
}

/** 마이크 토글 버튼. 녹음 중이면 pulse + accent 색상. 미지원 브라우저면 비활성화 + 툴팁. */
export function SpeechRecognitionButton({
  isListening,
  isSupported,
  onToggle,
}: SpeechRecognitionButtonProps) {
  return (
    <div
      title={
        !isSupported
          ? "이 브라우저는 음성인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해 주세요."
          : isListening
          ? "음성인식 중지"
          : "음성인식 시작 (앵무새)"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!isSupported}
        aria-label={isListening ? "음성인식 중지" : "음성인식 시작"}
        aria-pressed={isListening}
        className={[
          "relative flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          isListening
            ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]",
          !isSupported ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        ].join(" ")}
      >
        {isListening && (
          <span className="absolute inset-0 animate-ping rounded-md bg-[var(--color-accent)] opacity-20" />
        )}
        <Mic className="relative z-10 h-4 w-4" />
      </button>
    </div>
  );
}
