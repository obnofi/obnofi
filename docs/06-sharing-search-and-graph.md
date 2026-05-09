# Sharing Search And Graph

## 범위

- 공개 페이지 공유
- 비밀번호 보호 공유
- 공개용 콘텐츠 sanitize
- 페이지 검색
- 위키 링크와 백링크
- 그래프 뷰

## 주요 파일

- `apps/web/components/share/SharePopover.tsx`
- `apps/web/components/share/PasswordPrompt.tsx`
- `apps/web/components/share/PublicPageView.tsx`
- `apps/web/app/share/[shareId]/page.tsx`
- `apps/web/app/share/[shareId]/SharePageClient.tsx`
- `apps/web/app/api/public/pages/[shareId]/route.ts`
- `apps/web/app/api/public/pages/[shareId]/verify/route.ts`
- `apps/web/app/api/pages/search/route.ts`
- `apps/web/app/api/databases/search/route.ts`
- `apps/web/lib/page-search.ts`
- `apps/web/lib/public-content.ts`
- `apps/web/lib/graph-utils.ts`
- `apps/web/lib/graph/backlinks.ts`
- `apps/web/app/workspace/[workspaceId]/graph/WorkspaceGraphPage.tsx`
- `apps/web/components/graph/*`

## 현재 동작

### 공개 공유

- 페이지는 `isPublic`, `shareId`, `sharePassword`를 가집니다.
- 공개 링크는 `/share/[shareId]`로 접근합니다.
- 비밀번호가 있으면 먼저 `PasswordPrompt`가 열리고, 검증 성공 뒤 `PublicPageView`를 보여줍니다.

### 공개 콘텐츠 정리

- 공유 응답은 raw content를 그대로 내보내지 않고 sanitize 과정을 거칩니다.
- 공개 워크스페이스 내 공개 페이지 목록을 기준으로 링크 가능한 내용만 남깁니다.
- 저장된 Yjs 문서가 page content보다 최신이면 Yjs state를 우선 사용합니다.

### 검색

- 페이지 검색 API와 데이터베이스 검색 API가 분리되어 있습니다.
- 사이드바 검색은 제목/본문 기준 페이지 검색 흐름과 연결됩니다.

### 그래프 뷰

- `/workspace/[workspaceId]/graph`
- 페이지 목록을 가져온 뒤 `buildGraphData`로 노드/엣지를 계산합니다.
- 커스텀 노트 노드, 커스텀 DB 노드, floating edge를 사용합니다.
- 자동 레이아웃 재계산과 수동 엣지 추가가 가능합니다.

## 구현 메모

- 그래프는 현재 page tree 전체와 위키 링크 관계를 시각화하는 읽기 중심 기능에 가깝습니다.
- 엣지 추가 UI는 있지만, 수동 엣지를 영속 저장하는 흐름은 현재 코드상 핵심 축으로 보이지 않습니다.

## 정합성 메모

- 공유는 문서형 페이지 경험에 가장 최적화되어 있습니다.
- 데이터베이스/캔버스 공유 표현은 문서만큼 풍부하지 않을 수 있어 별도 점검이 필요합니다.
