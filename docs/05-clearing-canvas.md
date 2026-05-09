# Clearing Canvas

## 범위

- 자유 배치형 캔버스
- 도형, 텍스트, 스티키, 이미지, 임베드, 커넥터
- 선택, 리사이즈, 팬, 줌, 드로잉
- 댓글 스레드
- 프레즌스와 저장 상태

## 주요 파일

- `apps/web/components/canvas/ClearingBoard.tsx`
- `apps/web/components/canvas/BoardCanvas.tsx`
- `apps/web/components/canvas/DrawingCanvas.tsx`
- `apps/web/components/canvas/PenTool.tsx`
- `apps/web/components/canvas/CursorLayer.tsx`
- `apps/web/components/canvas/CursorChat.tsx`
- `apps/web/components/toolbar/ClearingToolbar.tsx`
- `apps/web/components/elements/*`
- `apps/web/store/useCanvasStore.ts`
- `apps/web/store/useElementStore.ts`
- `apps/web/store/useSelectionStore.ts`
- `apps/web/store/useUserStore.ts`
- `apps/web/lib/imageUpload.ts`
- `apps/web/lib/embedUtils.ts`
- `apps/web/lib/supabase.ts`
- `apps/web/lib/whiteboard.ts`

## 현재 동작

### 캔버스 화면

- `canvas` 타입 페이지를 열면 `ClearingBoard`가 메인 화면을 담당합니다.
- 큰 보드 공간 위에서 pan/zoom/selection/drag/draw를 모두 처리합니다.

### 요소 타입

- text
- sticky
- image
- embed
- shape
- section
- connector
- path
- emoji stamp

렌더링은 `BoardElementRenderer`와 각 element 컴포넌트가 분담합니다.

### 이미지와 임베드

- 이미지 드롭 감지 후 업로드를 거쳐 element로 삽입할 수 있습니다.
- URL 기반 임베드 element 생성 유틸도 별도로 있습니다.

### 댓글

- 캔버스 요소 기준 댓글 스레드를 붙일 수 있습니다.
- `CommentThread`가 UI 진입점입니다.

### 프레즌스

- 세션 유저가 있으면 세션 기반 프로필로 캔버스 사용자 정보를 만듭니다.
- 유저 색은 seed 기반으로 계산합니다.

## 데이터 레이어

- 캔버스는 문서 페이지와 달리 요소 배열, 댓글, room 상태를 별도로 다룹니다.
- 타입은 `@obnofi/types/clearing`에서 가져옵니다.
- 일부 데모 생성 유틸이 남아 있어, 실시간/저장 구현이 완전히 단일 경로로 정리된 상태는 아닙니다.

## 구현 메모

- 캔버스는 문서 본문 안 embed 가능한 `CanvasBlock`과, full page `canvas` 타입 둘 다 엮여 있습니다.
- Supabase Storage는 캔버스 이미지 업로드에도 사용됩니다.

## 정합성 메모

- 문서 편집기처럼 하나의 Yjs 문서 기반이 아니라, 캔버스는 자체 상태/실시간 경로를 따릅니다.
- 데모 데이터와 실사용 경로가 일부 섞여 있으므로 이후 정리가 필요합니다.
