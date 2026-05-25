import type { Comment, Element, User } from "@obnofi/types/clearing";
import { createDemoUser } from "@/lib/whiteboard";
import { PRESENCE_COLOR_MAP } from "./clearingBoardConstants";
import type { ClearingSaveStatus, LocalClearingSnapshot } from "./clearingBoardTypes";

export function clampZoom(zoom: number) {
  return Math.min(2.4, Math.max(0.35, zoom));
}

export function getClearingBootstrapKey(roomSlug: string, userId: string) {
  return `${userId}:${roomSlug}`;
}

export function getLocalUser() {
  if (typeof window === "undefined") {
    return createDemoUser();
  }

  const cached = window.localStorage.getItem("obnofi-clearing-user");
  if (cached) {
    return JSON.parse(cached) as User;
  }

  const nextUser = createDemoUser();
  window.localStorage.setItem("obnofi-clearing-user", JSON.stringify(nextUser));
  return nextUser;
}

export function resolvePresenceColor(seed: string) {
  const colors = ["fern", "sun", "rose", "sky"] as const;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return colors[hash % colors.length];
}

export function buildSessionUserProfile(sessionUser: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const seed = sessionUser.email ?? sessionUser.id ?? sessionUser.name ?? "obnofi";
  return {
    id: sessionUser.id,
    name: sessionUser.name ?? sessionUser.email ?? "Anonymous",
    email: sessionUser.email ?? null,
    avatarUrl: sessionUser.image ?? null,
    color: resolvePresenceColor(seed),
    connectedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  } satisfies User;
}

export function getScenePoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewportX: number,
  viewportY: number,
  zoom: number
) {
  return {
    x: (clientX - rect.left - viewportX) / zoom,
    y: (clientY - rect.top - viewportY) / zoom,
  };
}

export function getElementCenter(element: Element) {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  };
}

export function toElement(record: Record<string, unknown>): Element {
  return {
    id: record.id as string,
    roomId: record.room_id as string,
    type: record.type as Element["type"],
    x: Number(record.x),
    y: Number(record.y),
    width: Number(record.width),
    height: Number(record.height),
    rotation: Number(record.rotation),
    zIndex: Number(record.z_index),
    createdBy: record.created_by as string,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    style: record.style as Element["style"],
    content: record.content as Element["content"],
  } as Element;
}

export function toElementInsert(element: Element) {
  return {
    id: element.id,
    room_id: element.roomId,
    type: element.type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    z_index: element.zIndex,
    created_by: element.createdBy,
    style: element.style,
    content: element.content,
    created_at: element.createdAt,
    updated_at: element.updatedAt,
  };
}

export function toComment(record: Record<string, unknown>): Comment {
  return {
    id: record.id as string,
    roomId: record.room_id as string,
    elementId: (record.element_id as string | null) ?? null,
    authorId: record.author_id as string,
    body: record.body as string,
    content: (record.content as string | null) ?? (record.body as string),
    parentId: (record.parent_id as string | null) ?? null,
    x: typeof record.x === "number" ? record.x : undefined,
    y: typeof record.y === "number" ? record.y : undefined,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    resolved: Boolean(record.resolved),
    resolvedAt: (record.resolved_at as string | null) ?? undefined,
  };
}

export function logClearingPersistenceError(scope: string, error: unknown) {
  console.error(`[ClearingBoard] ${scope}`, error);
}

export function assertSupabaseSuccess(result: { error: unknown }, scope: string) {
  if (result.error) {
    logClearingPersistenceError(scope, result.error);
    throw result.error;
  }
}

export function getClearingSaveLabel(status: ClearingSaveStatus, isSupabaseLive: boolean) {
  const modeLabel = isSupabaseLive ? "원격" : "로컬";

  switch (status) {
    case "saving":
      return `${modeLabel} 저장 중`;
    case "unsaved":
      return `${modeLabel} 수정됨`;
    case "error":
      return `${modeLabel} 저장 실패`;
    case "saved":
    default:
      return `${modeLabel} 저장됨`;
  }
}

export function getLocalClearingStorageKey(roomSlug: string) {
  return `obnofi-clearing-room:${roomSlug}`;
}

export function resolvePresenceColorValue(color: string | undefined) {
  if (!color) {
    return "var(--color-accent)";
  }

  return PRESENCE_COLOR_MAP[color] ?? color;
}

export function loadLocalClearingSnapshot(roomSlug: string): LocalClearingSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getLocalClearingStorageKey(roomSlug));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LocalClearingSnapshot;
  } catch {
    return null;
  }
}

export function saveLocalClearingSnapshot(roomSlug: string, snapshot: LocalClearingSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getLocalClearingStorageKey(roomSlug),
    JSON.stringify(snapshot)
  );
}
