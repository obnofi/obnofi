import { NextRequest, NextResponse } from "next/server";
import { Prisma, prisma } from "@obnofi/db";
import { getAuthenticatedUserId } from "@/lib/workspace-resolution";
import {
  normalizeMossNoteAnchor,
  normalizeMossNoteColor,
  normalizeMossNotePosition,
  toMossNote,
  type MossNoteContent,
} from "@/lib/moss-notes";

async function findWritablePage(pageId: string, userId: string) {
  return prisma.page.findFirst({
    where: {
      id: pageId,
      type: { in: ["DOCUMENT", "DATABASE"] },
      workspace: {
        members: {
          some: { userId, role: { in: ["OWNER", "EDITOR", "MEMBER"] } },
        },
      },
    },
    select: { id: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const page = await findWritablePage(pageId, userId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { pageId, content: { path: ["type"], equals: "mossNote" } },
      orderBy: [{ resolved: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(comments.map(toMossNote).filter(Boolean));
  } catch (error) {
    console.error("[GET /api/pages/[pageId]/moss-notes]", error);
    return NextResponse.json(
      { error: "Failed to fetch MossNotes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const page = await findWritablePage(pageId, userId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const body = await request.json();
    const content = String(body.body ?? "").trim();
    if (!content) {
      return NextResponse.json(
        { error: "body is required" },
        { status: 400 }
      );
    }

    const mossNoteContent: MossNoteContent = {
      type: "mossNote",
      body: content.slice(0, 2000),
      color: normalizeMossNoteColor(body.color),
      anchor: normalizeMossNoteAnchor(body.anchor),
      position: normalizeMossNotePosition(body.position),
    };

    const comment = await prisma.comment.create({
      data: {
        pageId,
        blockId: typeof body.blockId === "string" ? body.blockId : null,
        authorId: userId,
        content: mossNoteContent as unknown as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json(toMossNote(comment), { status: 201 });
  } catch (error) {
    console.error("[POST /api/pages/[pageId]/moss-notes]", error);
    return NextResponse.json(
      { error: "Failed to create MossNote" },
      { status: 500 }
    );
  }
}
