# Authentication And CLI

## 범위

- NextAuth 로그인
- 웹 세션 기반 사용자 인증
- Bearer 토큰 기반 CLI 인증
- 브라우저 승인형 CLI 자동 연결

## 주요 파일

- `apps/web/lib/auth.ts`
- `apps/web/lib/request-auth.ts`
- `apps/web/lib/requireSessionUser.ts`
- `apps/web/lib/cli-auth.ts`
- `apps/web/app/auth/signin/page.tsx`
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `apps/web/app/api/cli-tokens/route.ts`
- `apps/web/app/api/cli-tokens/[tokenId]/route.ts`
- `apps/web/app/cli-auth/page.tsx`
- `apps/web/app/cli-auth/CliAuthClient.tsx`
- `apps/web/app/api/cli-auth/complete/route.ts`

## 현재 동작

### 웹 로그인

- NextAuth 기반 로그인 흐름을 사용합니다.
- 앱 내부 대부분의 API는 세션 쿠키 또는 Bearer 토큰 둘 중 하나를 받아 인증합니다.
- 인증 실패 시 API는 대체로 `401`을 반환합니다.

### CLI 토큰

- 사용자는 웹 세션으로 로그인한 상태에서 CLI 토큰을 발급할 수 있습니다.
- 토큰 원문은 생성 시점에만 반환되고, DB에는 해시만 저장됩니다.
- 토큰 목록 조회와 폐기 API가 분리되어 있습니다.

### 브라우저 기반 CLI 자동 인증

- CLI가 로컬 콜백 서버를 띄운 뒤 브라우저를 열어 `/cli-auth`로 이동합니다.
- 사용자가 브라우저에서 허용하면 서버가 로컬 콜백 URL로 토큰을 직접 POST 합니다.
- 이 흐름은 토큰을 URL 쿼리나 브라우저 히스토리에 남기지 않기 위한 설계입니다.

## 라우트

- `GET|POST /api/auth/[...nextauth]`
- `GET /api/cli-tokens`
- `POST /api/cli-tokens`
- `DELETE /api/cli-tokens/[tokenId]`
- `POST /api/cli-auth/complete`
- `GET /cli-auth`

## 데이터 모델

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `CliToken`

모두 `packages/db/prisma/schema.prisma`에 정의되어 있습니다.

## 구현 메모

- 웹과 CLI가 같은 인증 계층을 공유하지만, UX는 분리되어 있습니다.
- CLI 토큰은 사용자별 다중 발급이 가능합니다.
- `Authorization: Bearer obnofi_<token>` 형태를 기준으로 동작합니다.

## 확인할 점

- 인증/인가 규칙이 모든 API 라우트에서 완전히 일관되게 정리된 상태는 아닙니다.
- `APIDOCS.md`는 상세하지만, 실제 호출 경로를 볼 때는 각 Route Handler를 함께 확인하는 편이 안전합니다.
