// 서버 사이드 구조적 로거.
// stdout/stderr를 수집하는 호스팅 환경(Vercel, CloudWatch, Loki 등)에서 바로 파싱되도록 JSON 한 줄로 출력한다.
// 별도 의존성 없이 console 기반 — 외부 로깅 SDK 도입 시 이 파일만 교체하면 된다.

type LogMeta = Record<string, unknown>;

function serializeError(error: unknown): LogMeta {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { value: String(error) };
}

/**
 * API 라우트 catch 블록에서 삼켜지던 에러를 구조화해 기록한다.
 * @param scope 발생 위치 식별자 (예: "POST /api/pages")
 * @param error catch로 잡힌 원본 에러
 * @param meta 추가 컨텍스트 (pageId 등)
 */
export function logError(scope: string, error: unknown, meta?: LogMeta): void {
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      time: new Date().toISOString(),
      ...meta,
      error: serializeError(error),
    })
  );
}
