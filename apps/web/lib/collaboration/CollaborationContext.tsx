"use client";

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useSession } from "next-auth/react";

const CURSOR_COLORS = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
  "#F6A6C1",
];

export function userColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

export interface CollaborationUser {
  clientId: number;
  name: string;
  color: string;
  image?: string | null;
}

interface CollaborationContextValue {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  collaborators: CollaborationUser[];
  isSynced: boolean;
}

const CollaborationContext = createContext<CollaborationContextValue>({
  ydoc: null,
  provider: null,
  collaborators: [],
  isSynced: false,
});

export function CollaborationProvider({
  pageId,
  active,
  children,
}: {
  pageId: string;
  active: boolean;
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [isSynced, setIsSynced] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ydoc = useMemo(() => (active ? new Y.Doc() : null), [pageId, active]);

  const provider = useMemo(() => {
    if (!ydoc) return null;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
    return new WebsocketProvider(wsUrl, "ws", ydoc, {
      connect: false,
      params: { docId: pageId },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ydoc, pageId]);

  useEffect(() => {
    if (!provider) return;
    provider.connect();
    return () => {
      provider.disconnect();
      provider.destroy();
      setIsSynced(false);
    };
  }, [provider]);

  useEffect(() => {
    if (!provider) return;
    const handleSync = (synced: boolean) => setIsSynced(synced);
    provider.on('sync', handleSync);

    // WS 연결 실패 시 저장이 영원히 막히므로, disconnected 즉시 + 5초 타임아웃 이중 폴백
    const handleStatus = ({ status }: { status: string }) => {
      if (status === 'disconnected') setIsSynced(true);
    };
    provider.on('status', handleStatus);
    const fallbackTimer = setTimeout(() => setIsSynced(true), 5000);

    return () => {
      provider.off('sync', handleSync);
      provider.off('status', handleStatus);
      clearTimeout(fallbackTimer);
    };
  }, [provider]);

  useEffect(() => {
    return () => { ydoc?.destroy(); };
  }, [ydoc]);

  useEffect(() => {
    if (!provider || !session?.user) return;
    const name = session.user.name ?? session.user.email ?? "Anonymous";
    const color = userColor(session.user.email ?? name);
    provider.awareness.setLocalStateField("user", {
      name,
      color,
      image: session.user.image ?? null,
    });
  }, [provider, session]);

  useEffect(() => {
    if (!provider) return;
    const update = () => {
      const states = provider.awareness.getStates();
      const localId = provider.awareness.clientID;
      const users: CollaborationUser[] = [];
      states.forEach((state, clientId) => {
        if (clientId !== localId && state.user) {
          users.push({
            clientId,
            name: state.user.name,
            color: state.user.color,
            image: state.user.image ?? null,
          });
        }
      });
      setCollaborators(users);
    };
    provider.awareness.on("change", update);
    return () => provider.awareness.off("change", update);
  }, [provider]);

  const value = useMemo(
    () => ({ ydoc, provider, collaborators, isSynced }),
    [ydoc, provider, collaborators, isSynced]
  );

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  return useContext(CollaborationContext);
}
