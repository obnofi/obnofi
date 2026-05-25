import type { Comment, Element, Room, User } from "@obnofi/types/clearing";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { createDemoComment, createDemoElements } from "@/lib/whiteboard";
import type { ClearingBootstrapState } from "./clearingBoardTypes";
import { assertSupabaseSuccess, toComment, toElement } from "./clearingBoardUtils";

export async function fetchOrCreateRoom(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  roomSlug: string,
  ownerId: string
): Promise<Room> {
  const roomResult = await supabase
    .from("rooms")
    .select("*")
    .eq("slug", roomSlug)
    .maybeSingle();

  if (roomResult.error) throw roomResult.error;

  if (roomResult.data) {
    return {
      id: roomResult.data.id,
      name: roomResult.data.name,
      slug: roomResult.data.slug,
      ownerId: roomResult.data.owner_id,
      background: roomResult.data.background,
      createdAt: roomResult.data.created_at,
      updatedAt: roomResult.data.updated_at,
    };
  }

  const insertedRoom = await supabase
    .from("rooms")
    .insert({ name: "Jungle Clearing", slug: roomSlug, owner_id: ownerId, background: "paper" })
    .select("*")
    .single();

  if (insertedRoom.error || !insertedRoom.data) throw insertedRoom.error;

  return {
    id: insertedRoom.data.id,
    name: insertedRoom.data.name,
    slug: insertedRoom.data.slug,
    ownerId: insertedRoom.data.owner_id,
    background: insertedRoom.data.background,
    createdAt: insertedRoom.data.created_at,
    updatedAt: insertedRoom.data.updated_at,
  };
}

export async function fetchOrSeedElements(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  roomId: string,
  userId: string
): Promise<Element[]> {
  const elementResult = await supabase
    .from("elements")
    .select("*")
    .eq("room_id", roomId)
    .order("z_index", { ascending: true });
  assertSupabaseSuccess(elementResult, "elements load failed");

  if (!elementResult.data || elementResult.data.length === 0) {
    const demoElements = createDemoElements(roomId, userId);
    const demoElementResult = await supabase.from("elements").insert(
      demoElements.map((element) => ({
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
      }))
    );
    assertSupabaseSuccess(demoElementResult, "demo elements insert failed");
    return demoElements;
  }

  return (elementResult.data as Record<string, unknown>[]).map(toElement);
}

export async function fetchOrSeedComments(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  roomId: string,
  firstElementId: string | null,
  userId: string
): Promise<Comment[]> {
  const commentResult = await supabase
    .from("comments")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  assertSupabaseSuccess(commentResult, "comments load failed");

  if (!commentResult.data || commentResult.data.length === 0) {
    const demoComments = [createDemoComment(roomId, firstElementId, userId)];
    const demoCommentResult = await supabase.from("comments").insert(
      demoComments.map((comment) => ({
        id: comment.id,
        room_id: comment.roomId,
        element_id: comment.elementId,
        author_id: comment.authorId,
        body: comment.body,
        content: comment.content ?? comment.body,
        parent_id: comment.parentId ?? null,
        x: comment.x,
        y: comment.y,
        resolved: comment.resolved ?? false,
        created_at: comment.createdAt,
        updated_at: comment.updatedAt,
      }))
    );
    assertSupabaseSuccess(demoCommentResult, "demo comments insert failed");
    return demoComments;
  }

  return (commentResult.data as Record<string, unknown>[]).map(toComment);
}

export async function upsertSupabaseUser(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  user: User
) {
  const userResult = await supabase.from("users").upsert(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatarUrl,
      color: user.color,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  assertSupabaseSuccess(userResult, "users upsert failed");
}

export async function buildBootstrapState(
  roomSlug: string,
  activeUser: User
): Promise<ClearingBootstrapState> {
  const supabase = createBrowserSupabaseClient();

  await upsertSupabaseUser(supabase, activeUser);
  const room = await fetchOrCreateRoom(supabase, roomSlug, activeUser.id);
  const elements = await fetchOrSeedElements(supabase, room.id, activeUser.id);
  const comments = await fetchOrSeedComments(supabase, room.id, elements[0]?.id ?? null, activeUser.id);

  return { room, elements, comments, isSupabaseLive: true };
}
