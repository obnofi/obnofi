# MossNote — 인라인 주석

## 범위

- Grove 문서 페이지 위에 고정 위치 포스트잇형 주석
- 텍스트 선택 기반 앵커 또는 페이지 전역 앵커
- 색상 구분, resolve, 낙관적 생성/삭제

## 주요 파일

- `apps/web/components/workspace/MossNoteDock.tsx` — 화면 측면 독 레이아웃
- `apps/web/components/workspace/MossNoteCard.tsx` — 개별 노트 카드 UI
- `apps/web/components/workspace/MossNoteContextMenu.tsx` — 카드 우클릭 메뉴
- `apps/web/components/workspace/mossNoteUtils.ts` — 낙관적 ID, 기본값, 비교 유틸
- `apps/web/hooks/useMossNotes.ts` — 데이터 fetch / create / patch / delete 훅
- `apps/web/lib/moss-notes.ts` — `MossNote`, `MossNoteAnchor`, `MossNoteColor` 타입 정의
- `apps/web/app/api/pages/[pageId]/moss-notes/route.ts` — GET / POST
- `apps/web/app/api/pages/[pageId]/moss-notes/[mossNoteId]/route.ts` — PATCH / DELETE

## 현재 동작

### 앵커 타입

- `page`: 페이지 전역 주석. 특정 텍스트 위치 없음.
- `selection`: 텍스트 선택 영역에 붙는 주석. `quote`, `from`, `to` 포함.

### 색상

- `sun` / `rose` / `sky` 세 종류.

### 생성

- `createMossNoteAt(position)`으로 좌표 기반 생성.
- 서버 응답 전 낙관적 ID(`optimistic_*`)로 먼저 UI에 노출.
- 서버 확인 후 실제 ID로 교체, 실패 시 제거.

### 영속화

- `PATCH` → body, color, resolved 필드 업데이트.
- `DELETE` → 노트 삭제.

## API

- `GET /api/pages/[pageId]/moss-notes` — 페이지의 MossNote 목록
- `POST /api/pages/[pageId]/moss-notes` — 새 MossNote 생성
- `PATCH /api/pages/[pageId]/moss-notes/[mossNoteId]` — 내용/색상/resolve 수정
- `DELETE /api/pages/[pageId]/moss-notes/[mossNoteId]` — 삭제

## 구현 메모

- MossNote는 Grove 문서 전용. Clearing 캔버스의 StickyNote와 별개.
- `resolved: true`인 노트는 독에서 시각적으로 구분.
- 낙관적 ID는 `optimistic_` prefix로 식별.
