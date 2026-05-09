# Grove Editor

## 범위

- TipTap 기반 문서 편집기
- slash command
- 블록 확장
- 페이지 링크, 링크드 데이터베이스, 수식, 버튼, 컬럼
- 자동 저장
- Parrot 음성 입력

## 주요 파일

- `apps/web/components/editor/Editor.tsx`
- `apps/web/components/editor/SlashCommandList.tsx`
- `apps/web/components/editor/BlockActionBar.tsx`
- `apps/web/components/editor/TextHighlightToolbar.tsx`
- `apps/web/components/editor/SpeechRecognitionButton.tsx`
- `apps/web/hooks/useSpeechRecognition.ts`
- `apps/web/hooks/useAutoSave.ts`
- `apps/web/components/editor/extensions/*`
- `apps/web/lib/normalizeTiptapDocument.ts`
- `apps/web/lib/exportPage.ts`

## 현재 동작

### 편집기 기본 구조

- Grove는 TipTap `StarterKit` 기반입니다.
- 협업 문서가 연결되면 Yjs `Collaboration` 확장을 붙이고, 아니면 일반 JSON content로 동작합니다.
- 초기 콘텐츠 적용 시 Yjs 상태와 DB 상태 중 더 최신인 쪽을 복원합니다.

### 현재 붙은 주요 확장

- `DatabaseBlock`
- `CanvasBlock`
- `ButtonBlock`
- `CodeBlock`
- `ColumnLayoutBlock`
- `LinkedDatabaseBlock`
- `MathBlock`
- `PersonalEmojiExtension`
- `DbDiagramExtension`
- `PageLinkExtension`
- `PageMentionExtension`
- `SubPageBlock`
- `BlockActionsExtension`
- `SlashCommandExtension`
- `TextHighlightMark`

### 자동 저장

- `WorkspacePage.tsx`가 `useAutoSave`를 연결합니다.
- 편집 중 내용은 ref에 유지하고, 일정 debounce/interval 기준으로 저장합니다.
- 저장 성공 후 현재 page store도 최신 content로 동기화합니다.

### 내보내기

- 문서 페이지는 HTML/PDF export가 가능합니다.
- 페이지 설정 메뉴에서 export를 호출합니다.

### Parrot

- Web Speech API만 사용합니다.
- `ko-KR`, `continuous: true`, `interimResults: true` 설정입니다.
- 확정 텍스트만 현재 커서 위치에 삽입합니다.
- 미확정 텍스트는 에디터 밖 보조 UI에만 표시됩니다.

## UI 구성 요소

- 상단 헤더: 페이지 chrome
- 본문 위 보조 UI: 협업 아바타, 저장 상태, import control, 음성 입력
- 본문: TipTap editor
- 보조 패널: TOC, side tab, DB modal

## 구현 메모

- Grove는 단순 텍스트 에디터가 아니라 데이터베이스/캔버스/서브페이지를 문서 안에 embed할 수 있는 블록 편집기입니다.
- 블록 액션과 slash command가 구조 확장의 핵심 진입점입니다.

## 정합성 메모

- `AGENTS.md`에 있는 Parrot 규칙은 현재 코드와 대체로 일치합니다.
- 음성 입력은 Chrome/Chromium 계열 브라우저 전제입니다.
