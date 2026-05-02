"use client";

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useSession } from "next-auth/react";
import { pickProfileImagePreset } from "@/lib/profileImagePresets";

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

  // active=false인 페이지(문서 타입이 아님 / 공유편집 비활성)는 ydoc·provider를 만들지 않는다.
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

  // React 18 strict mode의 mount→cleanup→re-mount 더블 사이클에서
  // 같은 ydoc/provider 인스턴스가 destroy된 후 재사용되어 doc.update 핸들러가 사라지는
  // 버그를 회피하기 위해 destroy를 마이크로태스크 다음 tick으로 지연시킨다.
  // 같은 페어로 다시 mount되면 destroy를 취소해 인스턴스를 살려둔다 (드롭아웃 없음).
  // 페어 자체가 바뀌면(pageId 변경 등) 취소되지 않고 정상적으로 destroy된다.
  const pendingDestroyRef = useRef<{
    provider: WebsocketProvider;
    ydoc: Y.Doc;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  useEffect(() => {
    if (!provider || !ydoc) return;

    // 같은 (provider, ydoc) 페어에 예약된 destroy가 있으면 취소 — strict mode toss 회복.
    const pending = pendingDestroyRef.current;
    if (pending && pending.provider === provider && pending.ydoc === ydoc) {
      clearTimeout(pending.timer);
      pendingDestroyRef.current = null;
    }

    provider.connect();

    return () => {
      const timer = setTimeout(() => {
        provider.disconnect();
        provider.destroy();
        ydoc.destroy();
        if (pendingDestroyRef.current?.provider === provider) {
          pendingDestroyRef.current = null;
        }
      }, 0);
      pendingDestroyRef.current = { provider, ydoc, timer };
    };
  }, [provider, ydoc]);

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
    if (!provider || !session?.user) return;
    const name = session.user.name ?? session.user.email ?? "Anonymous";
    const seed = session.user.email ?? session.user.id ?? name;
    const color = userColor(seed);
    // session.user.image이 비어있으면 (구 토큰·DB 직접 수정 등으로 stale인 경우) seed 기반
    // preset URL로 폴백한다. 그래야 awareness로 broadcast되는 image가 항상 유효한 URL이고,
    // 다른 클라이언트가 받아 렌더할 때도 빈 아바타가 안 뜬다.
    const image =
      typeof session.user.image === "string" && session.user.image.length > 0
        ? session.user.image
        : pickProfileImagePreset(seed);
    provider.awareness.setLocalStateField("user", {
      name,
      color,
      image,
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
