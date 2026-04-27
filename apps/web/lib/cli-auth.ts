/**
 * CLI 자동 인증 흐름에서 사용하는 헬퍼.
 * callbackUrl은 반드시 로컬호스트만 허용 — 임의 외부 URL로 토큰이 유출되지 않도록.
 */
export function isLocalCallbackUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "http:") return false;
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}
