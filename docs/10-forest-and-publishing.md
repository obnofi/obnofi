# Forest — 게시 및 공개 피드

## 범위

- 페이지/캔버스/그래프 스냅샷을 공개 피드에 게시
- Forest 피드 탐색 (최신순 / 인기순 / 태그 필터)
- 좋아요 기능
- `/p/[publishId]`에서 게시된 스냅샷 열람

## 주요 파일

### 라우트

- `apps/web/app/forest/page.tsx` — Forest 공개 피드 서버 컴포넌트
- `apps/web/app/p/[publishId]/page.tsx` — 개별 게시물 열람 페이지

### 컴포넌트

- `apps/web/components/published/ForestShell.tsx` — 피드/열람 공통 레이아웃 래퍼
- `apps/web/components/published/ForestFeedClient.tsx` — 클라이언트 사이드 피드 UI (정렬·태그 필터, 검색)
- `apps/web/components/published/ForestLikeButton.tsx` — 좋아요 버튼 (낙관적 토글)
- `apps/web/components/published/PublishedSnapshotView.tsx` — 스냅샷 열람 진입부 (타입에 따라 분기)
- `apps/web/components/published/PublishedCanvasSnapshotView.tsx` — 캔버스 스냅샷 뷰
- `apps/web/components/published/PublishedGraphSnapshotView.tsx` — 그래프 스냅샷 뷰
- `apps/web/components/share/PublicReadonlyEditor.tsx` — 문서 스냅샷 읽기 전용 렌더링

### 라이브러리

- `apps/web/lib/publishedPages.ts` — `listPublishedSnapshots`, `listForestTags`, 스냅샷 CRUD 서버 함수
- `apps/web/lib/publishedPageTypes.ts` — `PublishedSnapshotSummary`, `PublishedSnapshotDetail`, `PublishedPageSnapshotContent`, `PublishedGraphSnapshotContent` 타입

### API

- `apps/web/app/api/published-pages/route.ts` — GET (목록) / POST (새 게시)
- `apps/web/app/api/published-pages/[publishId]/route.ts` — GET (상세) / DELETE (삭제)
- `apps/web/app/api/published-pages/[publishId]/like/route.ts` — POST / DELETE (좋아요 토글)

## 스냅샷 타입

| 값 | 의미 |
|---|---|
| `page` | 문서 (Grove) 또는 캔버스 (Clearing) 페이지 |
| `graph` | 워크스페이스 전체 그래프 |

`PublishedPageSnapshotContent`는 `pageType: "document" | "canvas" | "database"`로 세분화.

## 현재 동작

### 게시

- 사용자는 워크스페이스 내 페이지나 그래프 상태를 스냅샷으로 묶어 게시.
- 스냅샷에 `title`, `description`, `tags`(최대 5개) 지정 가능.
- Yjs state가 page content보다 최신이면 Yjs 기반 content를 사용.

### Forest 피드

- `/forest` — 공개 게시물 피드 (로그인 불필요).
- 정렬: `latest` (기본) / `popular`.
- 태그 필터 지원.
- `ForestFeedClient`가 클라이언트에서 URL 쿼리 동기화.

### 좋아요

- 비로그인 열람 가능, 좋아요는 로그인 필요.
- `POST /api/published-pages/[publishId]/like` → 추가.
- `DELETE /api/published-pages/[publishId]/like` → 취소.

## 데이터 모델

- `PublishedSnapshot` 엔티티 (`packages/db/prisma/schema.prisma`에 정의).
- `snapshotContent`는 JSONB로 저장. 타입 판별은 `snapshotType` 필드.
- 좋아요는 `PublishedSnapshotLike` 중간 테이블.

## 구현 메모

- Forest는 공유(`/share/[shareId]`)와 별개 기능. 공유는 원본 페이지를 실시간 반영하지만, Forest는 게시 시점 스냅샷이 고정.
- `PUBLIC_FOREST`가 아니라 `PublishedSnapshot` 엔티티로 관리.
- 게시 취소(soft delete)는 `deletedAt` 기준.
