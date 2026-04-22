# obnofi API Documentation

Fastify 기반 obnofi 백엔드 API 명세서

---

## Base URL

```
개발: http://localhost:4000
프로덕션: https://api.obnofi.app
```

---

## 인증

모든 API 요청은 `Authorization` 헤더에 Bearer 토큰을 포함해야 합니다.

```http
Authorization: Bearer <next-auth-jwt-token>
```

토큰은 NextAuth.js 로그인 후 얻을 수 있습니다.

---

## 응답 형식

### 성공 응답

```json
{
  "data": { ... }
}
```

또는 요청에 따라 다른 필드명 사용:

```json
{
  "user": { ... },
  "notes": [ ... ],
  "note": { ... }
}
```

### 에러 응답

```json
{
  "error": "에러 메시지"
}
```

### HTTP 상태 코드

| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 201 | 생성됨 |
| 204 | 콘텐츠 없음 (삭제 성공) |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |

---

## 엔드포인트

### Auth

#### GET /auth/me

현재 로그인된 사용자 정보를 반환합니다.

**응답:**

```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "image": "string | null",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "preferences": {},
    "ownedWorkspaces": [
      {
        "id": "string",
        "name": "string",
        "slug": "string"
      }
    ]
  }
}
```

---

### Notes

#### GET /notes

노트 목록을 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| limit | number | 아니오 | 조회 개수 (기본: 20, 최대: 100) |
| search | string | 아니오 | 제목 검색 키워드 |

**응답:**

```json
{
  "notes": [
    {
      "id": "string",
      "title": "string",
      "content": {},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "workspaceId": "string",
      "icon": "string | null"
    }
  ]
}
```

---

#### POST /notes

새 노트를 생성합니다.

**요청 본문:**

```json
{
  "title": "string (선택, 기본: 'Untitled')",
  "content": {},
  "workspaceId": "string (필수)"
}
```

**응답:**

```json
{
  "note": {
    "id": "string",
    "title": "string",
    "content": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "workspaceId": "string"
  }
}
```

**에러:**
- 403: 워크스페이스 접근 권한 없음

---

#### GET /notes/:id

특정 노트를 조회합니다.

**응답:**

```json
{
  "note": {
    "id": "string",
    "title": "string",
    "content": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "workspaceId": "string",
    "icon": "string | null",
    "coverImage": "string | null",
    "isPublic": false
  }
}
```

**에러:**
- 404: 노트 없음

---

#### PATCH /notes/:id

노트를 수정합니다.

**요청 본문:**

```json
{
  "title": "string (선택)",
  "content": {} (선택)
}
```

**응답:**

```json
{
  "note": {
    "id": "string",
    "title": "string",
    "content": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "workspaceId": "string",
    "icon": "string | null"
  }
}
```

**에러:**
- 404: 노트 없음

---

#### DELETE /notes/:id

노트를 삭제합니다.

**응답:**

```
HTTP 204 No Content
```

**에러:**
- 404: 노트 없음 또는 접근 권한 없음

---

### DB Diagram

#### GET /blocks/db-diagram

사용자가 접근할 수 있는 DB 다이어그램 목록을 조회합니다.

**응답:**

```json
{
  "diagrams": [
    {
      "pageId": "string",
      "title": "string",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "workspaceId": "string"
    }
  ]
}
```

---

#### GET /blocks/db-diagram/:pageId/sql

ERD를 MySQL DDL SQL로 변환하여 반환합니다.

**응답:**

```json
{
  "sql": "CREATE TABLE `users` (\n  `id` INT PRIMARY KEY,\n  ...\n);",
  "tables": 5,
  "columns": 20
}
```

**에러:**
- 404: 페이지 없음

---

#### POST /blocks/db-diagram/:pageId/sql

SQL을 파싱하여 ERD 노드로 변환 후 저장합니다.

**요청 본문:**

```json
{
  "sql": "CREATE TABLE users (id INT PRIMARY KEY, ...);",
  "merge": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| sql | string | 예 | CREATE TABLE 구문이 포함된 SQL |
| merge | boolean | 아니오 | 기존 스키마와 병합 여부 (기본: false) |

**응답:**

```json
{
  "success": true,
  "tables": 3,
  "columns": 12,
  "message": "3개 테이블, 12개 컬럼이 업데이트되었습니다."
}
```

**에러:**
- 400: SQL 누락 또는 유효한 CREATE TABLE 구문 없음
- 404: 페이지 없음 또는 접근 권한 없음

---

### Feed

#### GET /feed

피드 아이템을 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| source | string | 아니오 | 특정 소스 필터링 (VELOG, OPENAI_BLOG, ANTHROPIC_BLOG) |
| limit | number | 아니오 | 조회 개수 (기본: 10, 최대: 50) |

**응답:**

```json
{
  "feeds": [
    {
      "id": "string",
      "title": "string",
      "url": "string",
      "summary": "string | null",
      "thumbnail": "string | null",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "fetchedAt": "2024-01-01T00:00:00.000Z",
      "source": "string",
      "sourceType": "VELOG | OPENAI_BLOG | ANTHROPIC_BLOG"
    }
  ],
  "sources": [
    {
      "name": "VELOG",
      "displayName": "Velog",
      "identifier": "string",
      "enabled": true
    }
  ]
}
```

---

## CLI 인증 플로우

1. 사용자가 `obnofi auth login` 실행
2. 브라우저에서 `${baseUrl}/cli-auth` 열림
3. 사용자가 토큰 복사 후 CLI에 붙여넣기
4. CLI가 `GET /auth/me`로 토큰 검증
5. 성공 시 `~/.config/obnofi-cli`에 토큰 저장

---

## 개발 환경 설정

### 1. 환경 변수

`server/.env` 파일 필요:

```env
PORT=4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

### 2. 서버 실행

```bash
cd server
pnpm dev
```

### 3. 프론트 실행 (별도 터미널)

```bash
pnpm dev
```

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 401 | Missing or invalid token | Authorization 헤더 누락 또는 잘못된 형식 |
| 401 | Invalid token | 토큰 검증 실패 |
| 401 | User not found | 토큰은 유효하나 사용자가 DB에 없음 |
| 403 | Access denied to workspace | 워크스페이스 접근 권한 없음 |
| 404 | Note not found | 노트가 존재하지 않음 |
| 404 | Page not found | 페이지가 존재하지 않음 |
| 400 | SQL is required | SQL 필드 누락 |
| 400 | No valid CREATE TABLE statements found | 파싱할 수 있는 SQL 구문 없음 |
