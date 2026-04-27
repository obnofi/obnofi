import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@obnofi/db";
import { authOptions } from "@/lib/auth";

export const CLI_TOKEN_PREFIX = "obnofi_";

export function generateCliToken(): { raw: string; hash: string } {
  const raw = CLI_TOKEN_PREFIX + randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

async function getUserIdFromBearer(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const raw = authHeader.slice(7).trim();
  if (!raw) return null;

  const tokenHash = createHash("sha256").update(raw).digest("hex");

  const record = await prisma.cliToken.findFirst({
    where: { tokenHash, revokedAt: null },
    select: { id: true, userId: true },
  });

  if (!record) return null;

  // fire-and-forget: lastUsedAt 갱신
  prisma.cliToken
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return record.userId;
}

/**
 * Bearer 토큰 → NextAuth 세션 순서로 인증을 시도하고 userId를 반환한다.
 * 둘 다 없으면 null.
 */
export async function getRequestUserId(request: NextRequest): Promise<string | null> {
  const bearerUserId = await getUserIdFromBearer(request);
  if (bearerUserId) return bearerUserId;

  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/**
 * 세션 전용 인증 (웹 브라우저 요청용). Bearer 토큰은 체크하지 않는다.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
