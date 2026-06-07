# Owl — AI 채팅 패널

## 범위

- Grove 편집기 내 AI 채팅 사이드패널
- 현재 페이지 컨텍스트 인식
- 에디터에 직접 콘텐츠 삽입
- 사용자 제공 OpenAI API 키 사용

## 주요 파일

- `apps/web/components/editor/OwlChatPanel.tsx` — 채팅 패널 UI 컴포넌트
- `apps/web/app/api/ai/owl/route.ts` — streaming 백엔드 라우트

## API

- `POST /api/ai/owl`
- 입력: `{ messages, pageContent, apiKey }`
- 출력: AI SDK `UIMessageStream` (streaming)
- 모델: `gpt-4o-mini` (`@ai-sdk/openai`)

## 현재 동작

### API 키

- 사용자가 직접 OpenAI API 키를 제공해야 함.
- 키는 `localStorage`(`owl_openai_api_key`)에만 저장, 서버로는 각 요청에 담아 전달.
- 서버 환경변수 `OPENAI_API_KEY`가 없고 요청에도 키가 없으면 `401` 반환.

### 도구 (Tools)

| 도구 | 설명 |
|---|---|
| `getCurrentDate` | 현재 날짜 반환 |
| `getPageContext` | 현재 편집 중인 페이지 content 반환 |
| `insertContent` | 에디터에 삽입할 콘텐츠 준비 |

- `insertContent` 도구 결과가 UI에서 감지되면 "삽입" 버튼이 노출됨.
- 삽입은 `editor.chain().focus().insertContent(text).run()`.
- 최대 5단계 tool call (`stopWhen: stepCountIs(5)`).

### 화면 구성

- 패널 상단: API 키 입력 화면 또는 채팅 화면 분기.
- 도구 실행 중에는 레이블(`📅 날짜 확인 중...` 등) 표시.
- `@ai-sdk/react`의 `useChat` 훅 사용.

## 구현 메모

- Owl은 `07-ai-import-and-diagram.md`의 `generate` API와 별개 엔드포인트.
  - `generate`: 단발성 텍스트 변환 (summarize, translate 등)
  - `owl`: 대화형 멀티턴 채팅 + tool calling
- 서버에서 API 키를 절대 저장하지 않는 설계 → 사용자 책임.
- `OwlChatPanel`은 `Editor.tsx`에서 렌더링하고, `onClose` 콜백으로 닫힘 처리.
