# Database Engine — 쿼리·필터·연산

## 범위

- 클라이언트 사이드 데이터베이스 필터/정렬/그룹 엔진
- Formula / Rollup 연산 엔진
- 빈 데이터베이스 페이지 초기화

## 주요 파일

- `apps/web/lib/database/queryEngine.ts` — `DatabaseQueryEngine` 클래스
- `apps/web/lib/database/filterEvaluator.ts` — 필터 연산자 평가 함수
- `apps/web/lib/database/computedPropertyEngine.ts` — `ComputedPropertyEngine` 클래스
- `apps/web/lib/database/emptyDatabasePage.ts` — 빈 DB 페이지 구조 생성 유틸
- `apps/web/lib/database/propertyMeta.ts` — Property 타입 메타 정의
- `apps/web/lib/database/propertyValues.ts` — PropertyValue 변환 유틸
- `apps/web/lib/database/selectOptions.ts` — SELECT / MULTI_SELECT 옵션 유틸
- `apps/web/lib/database/tableAccessors.ts` — TanStack Table accessor 함수

## DatabaseQueryEngine

```ts
class DatabaseQueryEngine {
  constructor(database: Database, pages: Page[])
  query(viewQuery: ViewQuery): QueryResult
}

interface QueryResult {
  pages: Page[];
  totalCount: number;
  hasMore: boolean;
  groups?: Map<string, Page[]>;
}
```

- `ViewQuery`는 `packages/types/src/core.ts`의 `View.config` 하위 타입.
- 필터링 → `filterEvaluator`에 위임.
- 정렬 → `compareValues` 함수로 타입별 비교.
- 그룹화 → `groupBy` 필드 기준 `Map<string, Page[]>` 반환.

## FilterEvaluator

- `evaluateFilterOperator(operator, actual, filterValue)` — 단일 필터 평가.
- 지원 연산자: `equals`, `notEquals`, `contains`, `notContains`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`, `greaterThan`, `lessThan`, `greaterThanOrEqualTo`, `lessThanOrEqualTo`.
- `areEqual`, `stringContains`, `stringStartsWith`, `stringEndsWith`, `isEmpty` 헬퍼 함수 공개 export.

## ComputedPropertyEngine

```ts
class ComputedPropertyEngine {
  constructor(pages: Page[], databases: Database[])
  evaluateFormula(formula: string, page: Page): unknown
  evaluateRollup(rollupFn: RollupFunction, relatedPages: Page[], targetProperty: string): unknown
}
```

- Formula: `new Function()`으로 간단한 expression 평가. 프로덕션 파서는 추후 교체 예정.
- Rollup: `SUM`, `COUNT`, `MIN`, `MAX`, `AVERAGE` 지원.

## tableAccessors

- `getPropertyValueData(page, propertyId)` — Page에서 PropertyValue 값 추출.
- `getPropertyAccessorValue(page, propertyId)` — TanStack Table accessor용 값.
- `normalizeForSearch(value)` — 전역 텍스트 검색 정규화.

이 함수들은 `hooks/useGroveTable.tsx`에서 re-export되어 TanStack Table의 column 정의에서 사용.

## 구현 메모

- QueryEngine과 ComputedPropertyEngine은 현재 클라이언트에서만 사용. 서버 필터링은 Prisma 레벨에서 최소 수준.
- Formula 연산자는 `new Function()` 사용 — 외부 입력 검증 필요.
- `emptyDatabasePage.ts`는 새 데이터베이스 생성 시 Property 초기값 구조를 만드는 유틸.
