import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@obnofi/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId, userId } = await params;

    await prisma.pageCollaborator.deleteMany({
      where: { pageId, userId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 });
  }
}
