"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";

interface SpeechRecognitionButtonProps {
  isListening: boolean;
  isSupported: boolean;
  listeningState: ParrotListeningState;
  speechLevel?: number;
  onToggle: () => void;
}

// max 0.80 so all bars have room to grow
const BAR_BASES = [0.20, 0.50, 0.80, 0.50, 0.20];

export function SpeechRecognitionButton({
  isListening,
  isSupported,
  listeningState,
  speechLevel = 0,
  onToggle,
}: SpeechRecognitionButtonProps) {
  const normalizedLevel = Math.min(Math.max(speechLevel, 0), 1);
  const isResting = listeningState === "resting";

  // keep bars mounted during exit so width-shrink and opacity-fade happen together
  const [showBars, setShowBars] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (isListening) {
      setShowBars(true);
    } else {
      exitTimerRef.current = setTimeout(() => setShowBars(false), 220);
    }
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [isListening]);

  return (
    <div data-export-ignore="true">
      <button
        type="button"
        onClick={onToggle}
        disabled={!isSupported}
        aria-label={isListening ? "Parrot 녹음 중지" : "Parrot 음성인식 시작"}
        aria-pressed={isListening}
        className={[
          "flex items-center justify-center overflow-hidden rounded-full transition-all duration-200 ease-out",
          isListening
            ? "h-[34px] w-[72px] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
            : "h-[34px] w-[34px] hover:bg-[var(--color-hover)]",
          isSupported ? "" : "cursor-not-allowed opacity-50",
        ].join(" ")}
      >
        {showBars ? (
          <span
            className="flex items-end gap-[3px] transition-opacity duration-[160ms]"
            style={{ height: "15px", opacity: isListening ? 1 : 0 }}
          >
            {BAR_BASES.map((base, i) => {
              const boost = isResting ? 0.22 : 0.14 + normalizedLevel * 0.58;
              const active = Math.min(base + boost, 1.0);
              return (
                <span
                  key={i}
                  className="parrot-bar w-[3px] rounded-full bg-white"
                  style={{
                    height: "15px",
                    ["--parrot-bar-base" as string]: `${base}`,
                    ["--parrot-bar-active" as string]: `${active}`,
                    animationDelay: `${i * 65}ms`,
                    animationDuration: isResting
                      ? "1300ms"
                      : `${700 - normalizedLevel * 200}ms`,
                  }}
                />
              );
            })}
          </span>
        ) : (
          <Image
            src="/toolbar/parrot-off.png"
            alt="Parrot"
            width={16}
            height={16}
          />
        )}
      </button>
    </div>
  );
}
