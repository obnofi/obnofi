# GroveCatalog — 데이터베이스 클라이언트 레이어

## 범위

- 데이터베이스 페이지의 클라이언트 사이드 상태 관리 중심
- Property/Row(Seed)/View CRUD API 호출 래퍼
- Supabase Realtime을 통한 셀 변경 실시간 동기화

## 주요 파일

- `apps/web/store/useGroveCatalogStore.ts` — 데이터베이스 페이지 전역 클라이언트 상태 (Zustand)
- `apps/web/lib/groveCatalogApi.ts` — 서버 API 호출 함수들
- `apps/web/hooks/useDatabasePage.ts` — 데이터베이스 페이지 데이터 fetch + 뮤테이션 훅
- `apps/web/hooks/useDatabaseRealtime.ts` — Supabase Realtime으로 셀 변경 구독
- `apps/web/store/useDatabaseViewStore.ts` — 활성 뷰 타입 상태

## GroveCatalogStore 주요 상태

| 필드 | 역할 |
|---|---|
| `grovePages` | `Record<pageId, DatabasePage>` — 데이터베이스 페이지 캐시 |
| `groveLoading` | 페이지별 로딩 상태 |
| `groveLoaded` | 이미 로드된 페이지 ID Set |

### 주요 액션

- `setGrovePage` — 전체 교체 또는 함수형 업데이트
- `patchGrovePageTitle` — 제목 낙관적 업데이트
- `replaceGroveProperty` — Property 하나 교체
- `removeGroveProperty` — Property 삭제
- `patchGroveSeedTitle` — Row(Seed) 제목 변경
- `appendGroveView` — 새 View 추가

## groveCatalogApi 함수 매핑

| 함수 | HTTP | 경로 |
|---|---|---|
| `fetchGroveCatalogPage` | GET | `/api/pages/[pageId]?view=full` |
| `patchGroveTitle` | PATCH | `/api/pages/[pageId]` |
| `plantGroveSeed` | POST | `/api/databases/[databaseId]/rows` |
| `sproutGroveProperty` | POST | `/api/databases/[databaseId]/columns` |
| `reshapeGroveProperty` | PATCH | `/api/columns/[propertyId]` |
| `pruneGroveProperty` | DELETE | `/api/columns/[propertyId]` |
| `renameGroveSeed` | PATCH | `/api/pages/[rowId]` |
| `patchGroveCell` | PUT | `/api/property-values` |
| `sproutGroveView` | POST | `/api/databases/[databaseId]/views` |

### API 베이스 URL

- 환경변수 `NEXT_PUBLIC_FASTIFY_URL`이 설정되어 있으면 해당 서버로 요청.
- 설정이 없으면 동일 origin(Next.js)의 API 라우트로 요청.
- 즉, Fastify 서버는 선택적 외부 백엔드이며 없어도 Next.js API로 동작.

## 실시간 동기화

`useDatabaseRealtime`은 Supabase Postgres Changes를 구독해 다른 클라이언트의 셀 변경을 반영한다.

- 채널: `db-collab:{pageId}`
- 이벤트: `PropertyValue` 테이블의 `*` 변경
- 로컬 변경은 `localChangesRef`로 추적해 자신의 변경 echo 무시.

## DatabaseViewStore

- `activeView: ViewType` — 현재 전체 활성 뷰 타입
- `groveActiveViews: Record<scopeId, GroveSurfaceView>` — 인라인 DB 블록별 뷰 상태
- `GroveSurfaceView` = `"table" | "gallery" | "board" | "calendar"`

## 구현 메모

- `useDatabasePage`는 `useDatabaseBlockData`와 달리 GroveCatalog 기반 전용 훅.
- 셀 업데이트는 낙관적으로 store에 먼저 적용 후 `patchGroveCell` 호출.
- Property 명칭은 `Property` / `Trait` (Jungle 용어) 이지만 API 경로에서 `columns`가 혼용됨.
