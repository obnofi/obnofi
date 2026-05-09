# Undergrowth Database

## 범위

- 데이터베이스 페이지
- Property / PropertyValue / View
- row 생성과 편집
- 테이블, 보드, 갤러리, 리스트, 캘린더, 타임라인 뷰
- 인라인 데이터베이스와 링크드 데이터베이스

## 주요 파일

- `apps/web/components/database/DatabaseWorkspace.tsx`
- `apps/web/components/database/DatabasePageCard.tsx`
- `apps/web/components/database/DatabaseView.tsx`
- `apps/web/components/database/DatabaseViewRenderer.tsx`
- `apps/web/components/database/views/*`
- `apps/web/components/database/cells/*`
- `apps/web/components/database/AddPropertyPopover.tsx`
- `apps/web/components/database/PropertyTypeSelector.tsx`
- `apps/web/components/database/PropertyOptionsEditor.tsx`
- `apps/web/components/editor/extensions/DatabaseBlock.tsx`
- `apps/web/components/editor/extensions/LinkedDatabaseBlock.tsx`
- `apps/web/store/useDatabaseStore.ts`
- `apps/web/lib/database/queryEngine.ts`
- `apps/web/app/api/databases/**`
- `apps/web/app/api/property-values/**`

## 현재 데이터 모델

- Database row는 별도 Row 모델이 아니라 `Page`입니다.
- row 식별은 `parentDatabaseId`로 합니다.
- 셀 값은 `PropertyValue.value` JSON에 저장합니다.
- 뷰 설정은 `View.config` JSON에 저장합니다.

이 구조는 `DB.md`와 `packages/db/prisma/schema.prisma`에 맞춰 구현되어 있습니다.

## 현재 지원하는 Property 타입

- text
- number
- select
- multi_select
- status
- date
- person
- checkbox
- url
- email
- phone
- files
- relation
- rollup
- formula
- created_time
- created_by
- last_edited_time
- last_edited_by

다만 UI 완성도는 타입별로 다릅니다. `relation`, `rollup`, `formula`는 타입 메타데이터에 존재하지만 편집 흐름은 상대적으로 덜 완성된 상태로 봐야 합니다.

## 현재 뷰

- table
- board
- gallery
- list
- calendar
- timeline

`components/database/views/*`에 구현이 분리되어 있습니다.

## 현재 동작

### 데이터베이스 페이지

- `database` 타입 페이지를 열면 `DatabaseWorkspace`가 `DatabasePageCard`를 렌더링합니다.
- row를 클릭하면 full page 이동이 아니라 Grove side tab으로 열 수 있습니다.

### 데이터베이스 생성

- `POST /api/pages`에서 `type === "database"`인 경우:
  - Page 생성
  - Database 생성
  - 예시 기본 Property 생성
  - 기본 Table View 생성

### row 생성

- `POST /api/databases/[databaseId]/rows`
- row용 `Page`를 생성하고 기본 `PropertyValue`를 일괄 생성합니다.

### 클라이언트 상태

- `useDatabaseStore`는 scope 단위 query state를 관리합니다.
- global filter, sorting, grouping, column sizing, active filter column을 저장합니다.

## 구현 메모

- 이름은 새 코드에서 `Property` 기준으로 통일하는 방향입니다.
- `Column`은 레거시 alias로만 남아 있습니다.
- `DatabaseBlock`와 `LinkedDatabaseBlock` 덕분에 Grove 본문에서도 데이터베이스를 직접 embed할 수 있습니다.

## 정합성 메모

- 오래된 API 경로 중 `columns` 이름을 쓰는 파일이 아직 남아 있습니다.
- 타입 레벨에서도 `columnId` 같은 하위 호환 필드가 존재해 완전한 명칭 정리는 아직 끝나지 않았습니다.
