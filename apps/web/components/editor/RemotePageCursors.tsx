"use client";

import { JungleRemoteCursor } from "@/components/cursor/JungleRemoteCursor";
import type { AwarenessState } from "@/types/collaboration";
import { useEffect, useMemo, useState } from "react";

type ContextAwarenessState = AwarenessState & { clientId: number; image?: string | null };

interface RemotePageCursorsProps {
  states: ContextAwarenessState[];
}

export function RemotePageCursors({ states }: RemotePageCursorsProps) {
  const [now, setNow] = useState(() => Date.now());

  const visibleStates = useMemo(
    () =>
      states.filter((state) => {
        const expiresAt = state.cursorChat?.expiresAt;
        return expiresAt == null || expiresAt > now;
      }),
    [now, states]
  );

  useEffect(() => {
    const expirations = visibleStates
      .map((state) => state.cursorChat?.expiresAt ?? null)
      .filter((value): value is number => typeof value === "number");
    if (expirations.length === 0) return;

    const nextExpiry = Math.min(...expirations);
    const remaining = nextExpiry - Date.now();
    if (remaining <= 0) {
      setNow(Date.now());
      return;
    }

    const timer = window.setTimeout(() => setNow(Date.now()), remaining);
    return () => window.clearTimeout(timer);
  }, [visibleStates]);

  return (
    <>
      {visibleStates.map((state) => {
        const pointer = state.userCursor?.canvasPosition;
        if (!pointer) return null;

        return (
          <JungleRemoteCursor
            key={state.userId}
            color={state.color}
            colorKey={state.cursorColorKey}
            userId={state.userId}
            userName={state.userName}
            variant={state.cursorVariant}
            x={pointer.x}
            y={pointer.y}
            cursorChatMessage={state.cursorChat?.text ?? null}
          />
        );
      })}
    </>
  );
}
