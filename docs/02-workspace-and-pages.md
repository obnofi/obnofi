# Workspace And Pages

## 범위

- 워크스페이스 진입
- 페이지 트리와 사이드바
- 페이지 생성, 이동, 삭제
- 문서 / 캔버스 / 데이터베이스 페이지 전환
- Grove page chrome

## 주요 파일

- `apps/web/app/workspace/[workspaceId]/page.tsx`
- `apps/web/app/workspace/[workspaceId]/WorkspacePage.tsx`
- `apps/web/components/workspace/WorkspaceSidebar.tsx`
- `apps/web/components/workspace/GrovePageChrome.tsx`
- `apps/web/components/workspace/GrovePageCanopy.tsx`
- `apps/web/components/workspace/PageTitleBlock.tsx`
- `apps/web/components/workspace/PageGlyph.tsx`
- `apps/web/store/pageStore.ts`
- `apps/web/lib/pageCreation.ts`
- `apps/web/app/api/workspaces/route.ts`
- `apps/web/app/api/pages/route.ts`
- `apps/web/app/api/pages/[pageId]/route.ts`

## GroveSideTab 파일 구조

- `apps/web/components/workspace/GroveSideTab.tsx` — 패널 셸 + 레이아웃
- `apps/web/hooks/useGroveSideTabPage.ts` — 페이지·데이터베이스·조상 데이터 페칭 + 핸들러
- `apps/web/components/workspace/GroveRowProperties.tsx` — 데이터베이스 row 속성 표시
- `apps/web/components/workspace/TaskSideTabContent.tsx` — Task 사이드탭 콘텐츠

## 현재 동작

### 워크스페이스 진입

- `/workspace/[workspaceId]`가 메인 작업 공간입니다.
- 실제 열 페이지는 동적 세그먼트가 아니라 `?page=` 쿼리로 선택합니다.
- 이유는 페이지 클릭마다 전체 라우트 SSR을 다시 태우지 않고, 본문만 클라이언트에서 바꾸기 위해서입니다.

### 페이지 타입

- `document` -> Grove 편집기
- `canvas` -> Clearing
- `database` -> Undergrowth

`WorkspacePage.tsx`가 현재 페이지 타입에 따라 각 무거운 화면을 dynamic import로 분기 로딩합니다.

### 사이드바

- 계층형 페이지 트리를 표시합니다.
- 드래그 앤 드롭으로 순서와 depth를 바꿀 수 있습니다.
- 검색, 워크스페이스 전환, 생성 메뉴, 페이지 메뉴를 포함합니다.
- 그래프 뷰로 이동하는 엔트리도 여기서 노출됩니다.

### 페이지 생성

- 페이지 생성 시 타입별 기본 제목과 초기값을 적용합니다.
- 클라이언트는 `pageStore`에서 optimistic page를 먼저 추가합니다.
- 서버 생성 성공 시 실제 DB row로 교체합니다.

### 페이지 헤더

- `GrovePageChrome`가 헤더 래퍼 역할을 맡습니다.
- 아이콘은 `PageGlyph`, 커버/아이콘 편집은 `GrovePageCanopy`, 제목은 `PageTitleBlock`이 담당합니다.
- 아이콘은 이모지 문자열을 저장하고, 없으면 타입 기반 fallback glyph를 씁니다.

## API와 상태

### 페이지 목록

- `GET /api/pages?workspaceId=...`
- 사이드바용으로 content 없는 목록을 반환합니다.

### 페이지 생성

- `POST /api/pages`
- `database` 타입 생성 시 Page와 Database를 함께 만들고 기본 Property와 기본 Table View까지 생성합니다.

### 페이지 상세/수정/삭제

- `GET /api/pages/[pageId]`
- `GET /api/pages/[pageId]?view=full`
- `PATCH /api/pages/[pageId]`
- `DELETE /api/pages/[pageId]`

## 구현 메모

- 페이지 정렬은 `order` 기반 fractional 스타일로 운영됩니다.
- `pageStore`는 현재 페이지 fetch 취소와 optimistic update rollback을 모두 갖고 있습니다.
- 문서/캔버스/데이터베이스가 모두 `Page` 하나의 모델 위에서 돌아갑니다.

## 정합성 메모

- 일부 오래된 문서에는 `mock-db` 전제가 남아 있지만, 현재 페이지 API는 Prisma를 사용합니다.
- `packages/types`에는 레거시 필드가 일부 남아 있어 문서/코드 읽을 때 주의가 필요합니다.
