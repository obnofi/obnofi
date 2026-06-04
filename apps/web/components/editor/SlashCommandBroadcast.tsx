"use client";

import type { AwarenessState } from "@/types/collaboration";

interface Props {
  awarenessStates: Array<AwarenessState & { clientId: number; image?: string | null }>;
  localClientId: number | null;
}

export function SlashCommandBroadcast({ awarenessStates, localClientId }: Props) {
  const active = awarenessStates.filter(
    (s) => s.clientId !== localClientId && s.slashCommand != null
  );

  if (active.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 z-50 flex flex-col gap-1.5 pointer-events-none">
      {active.map((s) => (
        <div
          key={s.clientId}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ backgroundColor: s.color }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"
          />
          <span className="max-w-[160px] truncate">{s.userName}</span>
          <span className="opacity-80">
            {s.slashCommand!.query
              ? `"/${s.slashCommand!.query}" 입력 중`
              : "블록 삽입 중"}
          </span>
        </div>
      ))}
    </div>
  );
}
