import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { StickyNoteItem } from "@/store/useElementStore";

export async function persistStickyNote(
  stickyNote: StickyNoteItem,
  patch?: Partial<StickyNoteItem>
) {
  if (!stickyNote.roomId || !isSupabaseConfigured()) return;

  const next = { ...stickyNote, ...patch };
  const supabase = createBrowserSupabaseClient();
  await supabase.from("elements").upsert(
    {
      id: next.id,
      room_id: next.roomId,
      type: "sticky",
      x: next.x,
      y: next.y,
      width: next.width,
      height: next.height,
      rotation: 0,
      z_index: 1,
      created_by: next.createdBy,
      style: { color: next.color, opacity: 1 },
      content: { kind: "sticky", text: next.content, tone: next.color },
      created_at: next.createdAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

export async function removeStickyNoteFromSupabase(stickyNote: StickyNoteItem) {
  if (!stickyNote.roomId || !isSupabaseConfigured()) return;

  const supabase = createBrowserSupabaseClient();
  await supabase.from("elements").delete().eq("id", stickyNote.id);
}
