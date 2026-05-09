# obnofi Feature Docs

이 폴더는 현재 구현된 `obnofi` 기능을 기준으로 정리한 기능별 문서 모음입니다.

기존 참고 문서:

- `AGENTS.md`: 작업 규칙과 용어집
- `DB.md`: 데이터 모델 설명
- `APIDOCS.md`: 전체 API 상세 명세
- `DESIGN.md`: 디자인 시스템
- `apps/web/docs/architecture.md`
- `apps/web/docs/implementation-plan.md`

이 폴더의 목적은 위 문서들을 대체하는 것이 아니라, "지금 실제 코드에 어떤 기능이 들어가 있는지"를 기능 단위로 빠르게 파악할 수 있게 만드는 것입니다.

## 문서 목록

- [01-authentication-and-cli.md](./01-authentication-and-cli.md): 로그인, 웹 세션, CLI 토큰, 브라우저 기반 CLI 인증
- [02-workspace-and-pages.md](./02-workspace-and-pages.md): 워크스페이스 진입, 페이지 트리, 페이지 생성/이동/삭제, 타입별 라우팅
- [03-grove-editor.md](./03-grove-editor.md): Grove 편집기, TipTap 확장, 자동 저장, export, Parrot 음성 입력
- [04-database-and-views.md](./04-database-and-views.md): 데이터베이스 페이지, Property/Row/View 구조, 셀 타입, 각종 뷰
- [05-clearing-canvas.md](./05-clearing-canvas.md): Clearing 캔버스, 요소 편집, 댓글, 이미지 업로드, 프레즌스
- [06-sharing-search-and-graph.md](./06-sharing-search-and-graph.md): 공개 공유, 비밀번호 보호, 검색, 위키 링크, 그래프 뷰
- [07-ai-import-and-diagram.md](./07-ai-import-and-diagram.md): AI 보조 기능, URL import, DB 다이어그램 블록
- [08-realtime-collaboration-and-settings.md](./08-realtime-collaboration-and-settings.md): Yjs 협업, ws-server, 설정 화면, 사용자 환경설정

## 현재 코드 기준 큰 흐름

- `apps/web`: 메인 Next.js 앱
- `apps/ws-server`: Yjs 문서 동기화용 WebSocket 서버
- `packages/db`: Prisma 스키마와 DB 클라이언트
- `packages/types`: 프런트와 서버가 공유하는 타입

## 문서 작성 기준

- 설계 문서보다 실제 코드 경로를 우선 기준으로 삼음
- Jungle System 용어를 우선 사용
- 구현 완료 / 부분 구현 / 정합성 이슈를 함께 기록

## 빠른 주의사항

- `apps/web/docs/implementation-plan.md`는 현재 구현 상태와 많이 다릅니다.
- `AGENTS.md`의 일부 경로 설명은 이전 구조를 포함하고 있으므로 실제 경로와 함께 확인해야 합니다.
- 데이터 레이어는 현재 Prisma 기반으로 동작하지만, 일부 설명 문서는 `mock-db` 시절 내용을 여전히 포함합니다.
