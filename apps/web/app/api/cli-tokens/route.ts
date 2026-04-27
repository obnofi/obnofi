import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getSessionUserId } from "@/lib/request-auth";
import { generateCliToken } from "@/lib/request-auth";

// CLI 토큰 목록 조회 (웹 세션 전용)
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await prisma.cliToken.findMany({
    where: { userId, revokedAt: null },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tokens);
}

// CLI 토큰 발급 (웹 세션 전용 — 평문 토큰은 이 응답에서만 반환)
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "CLI Token";

  const { raw, hash } = generateCliToken();

  const record = await prisma.cliToken.create({
    data: { userId, name, tokenHash: hash },
    select: { id: true, name: true, createdAt: true },
  });

  // 평문 토큰은 생성 시 한 번만 반환. DB에는 hash만 저장.
  return NextResponse.json({ ...record, token: raw }, { status: 201 });
}
