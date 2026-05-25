/**
 * useClearingSync — thin wrapper combining useClearingBootstrap + useClearingPersistence.
 * Takes a `state` object returned by useClearingBoardState so the call site stays compact.
 */
import type { Comment, Element, Room, User } from "@obnofi/types/clearing";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { FloatingEmojiStamp } from "@/components/elements/EmojiStamp";
import type { ClearingSaveStatus } from "@/lib/canvas/clearingBoardTypes";
import { useClearingBootstrap } from "@/hooks/useClearingBootstrap";
import { useClearingPersistence } from "@/hooks/useClearingPersistence";

type SyncState = {
  // refs
  currentUserRef: React.MutableRefObject<User | null>;
  currentRoomRef: React.MutableRefObject<Room | null>;
  presenceChannelRef: React.MutableRefObject<RealtimeChannel | null>;
  presenceChannelReadyRef: React.MutableRefObject<boolean>;
  clearingOriginIdRef: React.MutableRefObject<string>;
  suppressPersistenceRef: React.MutableRefObject<boolean>;
  pendingUpsertsRef: React.MutableRefObject<Map<string, Element>>;
  pendingDeletesRef: React.MutableRefObject<Set<string>>;
  skipRemoteUpsertsRef: React.MutableRefObject<Map<string, string>>;
  skipRemoteDeletesRef: React.MutableRefObject<Set<string>>;
  previousElementsRef: React.MutableRefObject<Element[]>;
  latestCommentsRef: React.MutableRefObject<Comment[]>;
  persistTimerRef: React.MutableRefObject<number | null>;
  // state & setters
  room: Room | null;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  isBootstrapping: boolean;
  setIsBootstrapping: React.Dispatch<React.SetStateAction<boolean>>;
  isSupabaseLive: boolean;
  setIsSupabaseLive: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveStatus: React.Dispatch<React.SetStateAction<ClearingSaveStatus>>;
  setFloatingStamps: React.Dispatch<React.SetStateAction<FloatingEmojiStamp[]>>;
};

export type ClearingSyncOptions = {
  roomSlug: string;
  embedded: boolean;
  realtimeEnabled: boolean;
  currentUserId: string | null;
  elements: Element[];
  state: SyncState;
  clearSelection: () => void;
  resetViewport: () => void;
  setSelectedElement: (id: string | null) => void;
};

export function useClearingSync({
  roomSlug, embedded, realtimeEnabled, currentUserId, elements,
  state: s, clearSelection, resetViewport, setSelectedElement,
}: ClearingSyncOptions) {
  useClearingBootstrap({
    roomSlug, embedded, realtimeEnabled, currentUserId,
    currentUserRef: s.currentUserRef, currentRoomRef: s.currentRoomRef,
    presenceChannelRef: s.presenceChannelRef, presenceChannelReadyRef: s.presenceChannelReadyRef,
    clearingOriginIdRef: s.clearingOriginIdRef, suppressPersistenceRef: s.suppressPersistenceRef,
    pendingUpsertsRef: s.pendingUpsertsRef, pendingDeletesRef: s.pendingDeletesRef,
    skipRemoteUpsertsRef: s.skipRemoteUpsertsRef, skipRemoteDeletesRef: s.skipRemoteDeletesRef,
    setRoom: s.setRoom, setComments: s.setComments,
    setIsBootstrapping: s.setIsBootstrapping, setIsSupabaseLive: s.setIsSupabaseLive,
    setSaveStatus: s.setSaveStatus, setFloatingStamps: s.setFloatingStamps,
    clearSelection, resetViewport, setSelectedElement,
  });

  const { persistElement } = useClearingPersistence({
    roomSlug, room: s.room, elements, comments: s.comments,
    isBootstrapping: s.isBootstrapping, isSupabaseLive: s.isSupabaseLive,
    presenceChannelRef: s.presenceChannelRef, presenceChannelReadyRef: s.presenceChannelReadyRef,
    clearingOriginIdRef: s.clearingOriginIdRef, suppressPersistenceRef: s.suppressPersistenceRef,
    pendingUpsertsRef: s.pendingUpsertsRef, pendingDeletesRef: s.pendingDeletesRef,
    skipRemoteUpsertsRef: s.skipRemoteUpsertsRef, skipRemoteDeletesRef: s.skipRemoteDeletesRef,
    previousElementsRef: s.previousElementsRef, latestCommentsRef: s.latestCommentsRef,
    persistTimerRef: s.persistTimerRef, currentUserRef: s.currentUserRef,
    setSaveStatus: s.setSaveStatus, setIsSupabaseLive: s.setIsSupabaseLive,
  });

  return { persistElement };
}
