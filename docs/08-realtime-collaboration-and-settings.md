# Realtime And Settings

## 범위

- Yjs 협업 편집
- WebSocket 서버
- 저장된 협업 문서 복원
- 설정 화면
- 사용자 환경설정

## 주요 파일

- `apps/ws-server/src/index.ts`
- `apps/web/lib/collaboration/CollaborationContext.tsx`
- `apps/web/lib/collaboration/crdt.ts`
- `apps/web/lib/realtimeSync.ts`
- `apps/web/lib/yjsContent.ts`
- `apps/web/components/workspace/CollaborationAvatars.tsx`
- `apps/web/components/workspace/SaveStatusIndicator.tsx`
- `apps/web/components/editor/extensions/GroveCollaborationCursor.ts`
- `apps/web/app/settings/page.tsx`
- `apps/web/app/settings/layout.tsx`
- `apps/web/app/settings/appearance/page.tsx`
- `apps/web/app/settings/editor/page.tsx`
- `apps/web/app/settings/canvas/page.tsx`
- `apps/web/app/settings/ai/page.tsx`
- `apps/web/app/settings/shortcuts/page.tsx`
- `apps/web/app/api/profile/route.ts`
- `apps/web/app/api/workspaces/[workspaceId]/settings/route.ts`

## 현재 동작

### 협업 문서

- ws-server는 `docId` 기준으로 Yjs 문서를 관리합니다.
- 접속 시 DB에 저장된 `YjsDocument.state`를 먼저 로드합니다.
- 문서 update는 메모리 문서에 적용된 뒤 다른 클라이언트로 브로드캐스트됩니다.
- 일정 debounce 후 Prisma로 영속화합니다.

### awareness / cursor

- awareness 업데이트도 별도 메시지 타입으로 브로드캐스트합니다.
- Grove 편집기는 협업 커서를 표시할 수 있습니다.
- 워크스페이스 화면 상단에는 협업 아바타가 노출됩니다.

### 최신 콘텐츠 선택

- 공개 공유나 편집기 초기화 시, 일반 page content와 persisted Yjs state 중 더 최신인 값을 선택합니다.
- 즉, 실시간 협업 이후의 최신 문서는 JSON 본문보다 Yjs 스냅샷이 더 신뢰되는 경우가 있습니다.

### 설정 화면

- `/settings`
- 하위 섹션:
  - appearance
  - editor
  - canvas
  - ai
  - shortcuts

설정 UI는 이미 나뉘어 있지만, 실제 영속화 범위는 항목마다 다를 수 있습니다.

## 데이터 모델

- `Page.yjsDocument`
- `User.preferences`
- `Workspace.settings`

## 구현 메모

- 실시간 협업의 중심은 Grove 문서입니다.
- ws-server는 Fastify + WebSocket + Yjs 프로토콜 조합으로 구성되어 있습니다.
- 문서 없는 최초 연결도 빈 문서로 정상 동작합니다.

## 정합성 메모

- 캔버스의 실시간성과 Grove의 Yjs 협업은 서로 다른 축입니다.
- 설정 화면의 모든 항목이 완전히 동일한 수준으로 저장/반영되는지는 기능별 점검이 필요합니다.
