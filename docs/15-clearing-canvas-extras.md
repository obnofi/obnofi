# Clearing Canvas — 추가 기능

## 범위 (05-clearing-canvas.md 보완)

- 공유 타이머 위젯
- Cursor Chat
- Presence Panel
- 저장 레이어 (Supabase)

## 주요 파일

- `apps/web/components/canvas/TimerWidget.tsx` — 공유 타이머 UI + 사운드
- `apps/web/components/canvas/CursorChat.tsx` — 커서 위치 기반 채팅 입력
- `apps/web/components/canvas/ClearingPresencePanel.tsx` — 현재 접속자 목록 패널
- `apps/web/lib/realtime/timerUtils.ts` — 타이머 상태 계산 유틸
- `apps/web/lib/realtime/presenceUtils.ts` — Presence 데이터 유틸
- `apps/web/lib/realtime/channelUtils.ts` — Supabase Realtime 채널 생성 유틸
- `apps/web/lib/canvas/clearingBoardSupabase.ts` — Room/Element/Comment Supabase I/O
- `apps/web/lib/canvas/clearingBoardConstants.ts` — 상수 모음

## TimerWidget

- `SharedTimerState`를 외부에서 주입받아 렌더링.
- 타이머 종료 시 `playTimerChime()` — Web Audio API로 삼각파 사운드.
- 표시 형식: `MM:SS`.
- `timerUtils.ts`가 남은 시간 계산 담당.

## CursorChat

- 커서 위치에 말풍선형 실시간 메시지 표시.
- 다른 참가자의 커서 채팅도 `CursorLayer`를 통해 표시.

## ClearingPresencePanel

- 현재 접속 중인 사용자 목록 (자신 포함).
- 사용자 아바타 이미지 또는 이니셜 표시.
- `resolvePresenceColorValue`로 사용자별 색상 결정.

## Supabase 저장 레이어

Clearing 캔버스는 Next.js API를 거치지 않고 클라이언트 → Supabase 직접:

- `rooms` 테이블: Room 생성/조회.
- `elements` 테이블: 요소 CRUD.
- `comments` 테이블: 댓글 CRUD.
- 초기화 시 존재하지 않는 Room은 `fetchOrCreateRoom`으로 생성.
- demo 요소는 `createDemoElements`, `createDemoComment`로 생성 가능 (개발/데모용).

## 구현 메모

- `realtimeSync.ts`는 re-export 파사드 (`realtime/timerUtils`, `presenceUtils`, `channelUtils`).
- Grove Yjs 협업과 Clearing 실시간은 완전히 별개 경로. Clearing은 Supabase Realtime 기반.
- `ClearingPresencePanel`은 독립 패널로 캔버스 하단 고정 위치.
