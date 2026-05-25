"use client";

import { JungleRemoteCursor } from "@/components/cursor/JungleRemoteCursor";
import type { User } from "@obnofi/types/clearing";
import { resolvePresenceColorValue } from "@/lib/canvas/clearingBoardUtils";

type ClearingPresencePanelProps = {
  currentUser: User | null;
  others: User[];
};

export function ClearingPresencePanel({ currentUser, others }: ClearingPresencePanelProps) {
  return (
    <div className="absolute bottom-4 left-4 z-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-3 text-sm backdrop-blur">
      <p className="font-medium text-[var(--color-text-primary)]">Presence</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {currentUser && (
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
            <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent)] text-[9px] font-semibold text-white">
              {currentUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={currentUser.name}
                  className="h-full w-full object-cover"
                  src={currentUser.avatarUrl}
                />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </span>
            {currentUser.name}
          </span>
        )}
        {others.map((user) => (
          <span
            key={user.id}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface)] text-[9px] font-semibold text-[var(--color-text-primary)]">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={user.name}
                  className="h-full w-full object-cover"
                  src={user.avatarUrl}
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </span>
            {user.name}
          </span>
        ))}
      </div>
    </div>
  );
}

type RemoteCursorProps = {
  userId: string;
  canvasX: number;
  canvasY: number;
  color: string;
  userName: string | undefined;
  cursorColorKey?: "green" | "leafy" | "blue" | "pink";
  cursorVariant?: "pointing" | "highlighting" | "fucku";
};

export function RemoteAwarenessCursor({
  userId,
  canvasX,
  canvasY,
  color,
  userName,
  cursorColorKey = "green",
  cursorVariant = "pointing",
}: RemoteCursorProps) {
  return (
    <JungleRemoteCursor
      color={color}
      colorKey={cursorColorKey}
      userId={userId}
      userName={userName}
      variant={cursorVariant}
      x={canvasX}
      y={canvasY}
    />
  );
}

type PresenceCursorProps = {
  user: User;
};

export function PresenceCursor({ user }: PresenceCursorProps) {
  const colorValue = resolvePresenceColorValue(user.color);

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left: user.cursor?.x ?? 0, top: user.cursor?.y ?? 0 }}
    >
      <div
        className="h-4 w-4 rotate-[-18deg] rounded-[4px]"
        style={{ backgroundColor: colorValue }}
      />
      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)]/95 px-2 py-1 shadow-sm ring-1 ring-[var(--color-border)] backdrop-blur">
        <span
          className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: colorValue }}
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={user.name}
              className="h-full w-full object-cover"
              src={user.avatarUrl}
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </span>
        <span className="text-[10px] font-semibold text-[var(--color-text-primary)]">
          {user.name}
        </span>
      </div>
    </div>
  );
}
