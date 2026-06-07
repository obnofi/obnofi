# MindGrove — 마인드맵

## 범위

- ReactFlow 기반 자유형 마인드맵
- 노드 생성/삭제/연결
- 노드 인라인 편집, 색상 변경

## 주요 파일

- `apps/web/components/mindmap/MindGroveBoard.tsx` — ReactFlow Provider + 보드 전체 레이아웃
- `apps/web/components/mindmap/MindGroveNode.tsx` — 커스텀 노드 (`mindgrove` 타입)

## 현재 동작

### 노드

- `MindGroveNode`는 `mindgrove` 타입의 커스텀 ReactFlow 노드.
- 더블클릭 → 인라인 텍스트 편집.
- 노드 선택 시 색상 팔레트 노출 (default / sky / green / rose / amber / violet).
- 삭제는 `Delete` / `Backspace` 키.

### 엣지

- `MarkerType.ArrowClosed` 기본 화살표.

### 보드

- `MindGroveBoard`에서 패널 버튼으로 새 노드 추가.
- 자동 저장 연결은 현재 외부에서 주입받는 방식이 아니라 컴포넌트 내부 상태.

## 통합 포인트

- Grove 에디터 slash command → `MindGroveBoard` 블록으로 삽입 가능 (슬래시 커맨드 등록 경로 확인 필요).

## 구현 메모

- 현재 MindGrove 상태는 외부 영속 레이어와의 연결이 명확하지 않음. 편집 후 저장 흐름은 컴포넌트를 사용하는 쪽(Grove 블록)에서 처리해야 함.
- `@xyflow/react` 사용 (ReactFlow v12+).
