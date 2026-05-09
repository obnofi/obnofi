import { NextResponse } from "next/server";

const PRIVATE_READ_CACHE_CONTROL = "private, max-age=30, stale-while-revalidate=300";

export function jsonWithPrivateReadCache<T>(
  body: T,
  init?: ResponseInit
) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", PRIVATE_READ_CACHE_CONTROL);
  return response;
}
