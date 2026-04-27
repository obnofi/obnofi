import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getSessionUserId } from "@/lib/request-auth";

// CLI 토큰 폐기 (웹 세션 전용)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tokenId } = await params;

  const token = await prisma.cliToken.findFirst({
    where: { id: tokenId, userId, revokedAt: null },
    select: { id: true },
  });

  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  await prisma.cliToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
