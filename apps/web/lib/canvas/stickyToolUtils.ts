import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { StickyElement } from "@obnofi/types/clearing";
import type { ResizeHandlePosition } from "@/components/elements/ResizeHandles";

export type ToneKey = "sun" | "rose" | "sky";

export const MIN_STICKY_HEIGHT = 210;
export const MIN_STICKY_WIDTH = 180;
export const STICKY_VERTICAL_CHROME = 112;

export const TONE_COLORS: Record<ToneKey, { surface: string; border: string; text: string }> = {
  sun:  { surface: "#FFF1A8", border: "#E8D56A", text: "#4D4113" },
  rose: { surface: "#FFD9E6", border: "#F1ABC0", text: "#5B2A3C" },
  sky:  { surface: "#DDF1FF", border: "#A8CFE8", text: "#1C4660" },
};

type StickyPatch = Partial<StickyElement>;

export async function persistSticky(element: StickyElement, patch: StickyPatch) {
  if (!isSupabaseConfigured()) return;

  const nextElement = {
    ...element,
    ...patch,
    style: { ...element.style, ...patch.style },
    content: { ...element.content, ...patch.content },
    updatedAt: new Date().toISOString(),
  };

  const supabase = createBrowserSupabaseClient();
  await supabase.from("elements").upsert(
    {
      id: nextElement.id,
      room_id: nextElement.roomId,
      type: nextElement.type,
      x: nextElement.x,
      y: nextElement.y,
      width: nextElement.width,
      height: nextElement.height,
      rotation: nextElement.rotation,
      z_index: nextElement.zIndex,
      created_by: nextElement.createdBy,
      style: nextElement.style,
      content: nextElement.content,
      created_at: nextElement.createdAt,
      updated_at: nextElement.updatedAt,
    },
    { onConflict: "id" }
  );
}

export function buildResizedFrame(
  element: StickyElement,
  handle: ResizeHandlePosition,
  deltaX: number,
  deltaY: number
) {
  let nextX = element.x;
  let nextY = element.y;
  let nextWidth = element.width;
  let nextHeight = element.height;

  if (handle.includes("e")) nextWidth = Math.max(MIN_STICKY_WIDTH, element.width + deltaX);
  if (handle.includes("s")) nextHeight = Math.max(MIN_STICKY_HEIGHT, element.height + deltaY);
  if (handle.includes("w")) {
    nextWidth = Math.max(MIN_STICKY_WIDTH, element.width - deltaX);
    nextX = element.x + (element.width - nextWidth);
  }
  if (handle.includes("n")) {
    nextHeight = Math.max(MIN_STICKY_HEIGHT, element.height - deltaY);
    nextY = element.y + (element.height - nextHeight);
  }

  return { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
}
