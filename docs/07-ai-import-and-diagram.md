# AI Import And Diagram

## 범위

- 에디터 AI 보조 기능
- URL 기반 import
- DB 다이어그램 블록

## 주요 파일

- `apps/web/app/api/ai/generate/route.ts`
- `apps/web/components/editor/AiCommandList.tsx`
- `apps/web/components/editor/extensions/AiExtension.ts`
- `apps/web/components/editor/extensions/AiSuggestion.ts`
- `apps/web/components/workspace/ImportFromUrlControl.tsx`
- `apps/web/app/api/crawl-import/route.ts`
- `apps/web/src/components/blocks/db-diagram/*`
- `apps/web/src/components/editor/extensions/DbDiagramExtension.tsx`
- `apps/web/src/hooks/useDbDiagramSync.ts`
- `packages/types/src/db-diagram.ts`

## 현재 동작

### AI 보조

- `POST /api/ai/generate`
- 명령 타입별 시스템 프롬프트를 선택해 텍스트를 생성합니다.
- 현재 라우트는 `@ai-sdk/openai`와 `openai("gpt-4o-mini")`를 사용합니다.
- 응답은 text stream으로 반환됩니다.

현재 정의된 명령:

- summarize
- translate
- continue
- improve
- shorter
- longer
- explain
- code

### URL import

- `POST /api/crawl-import`
- 웹 앱이 crawler 서비스로 요청을 위임합니다.
- 기본 crawler URL은 `http://localhost:3100`
- 타임아웃은 30초입니다.
- crawler 오류는 일부 상태 코드를 그대로 전달하고, 나머지는 `502`로 정규화합니다.

### DB 다이어그램

- 별도 `src/components/blocks/db-diagram` 경로에 구현되어 있습니다.
- SQL editor, parser, layout, canvas, relation edge, table node가 분리되어 있습니다.
- Grove 안에서 블록 확장으로 삽입할 수 있습니다.

## 구현 메모

- AI 기능은 현재 짧은 변환/보조 작성 워크플로우에 초점이 맞춰져 있습니다.
- import는 ws-server를 거치지 않고 crawler를 직접 호출하도록 정리된 상태입니다.
- DB 다이어그램은 일반 페이지 편집 기능과는 독립적인 특수 블록군입니다.

## 정합성 메모

- AI 레이어 설명은 저장소 소개보다 실제 구현 범위가 좁습니다.
- 루트 설명에는 별도 `ai/` 런타임 언급이 있지만, 현재 눈에 띄는 실사용 엔트리는 `apps/web/ai`와 Next API입니다.
