import { NextRequest, NextResponse } from "next/server";
import { Prisma, prisma } from "@obnofi/db";
import { getAuthenticatedUserId } from "@/lib/workspace-resolution";
import {
  normalizeMossNoteAnchor,
  normalizeMossNoteColor,
  normalizeMossNoteContent,
  normalizeMossNotePosition,
  toMossNote,
  type MossNoteContent,
} from "@/lib/moss-notes";

async function findWritableMossNote(pageId: string, mossNoteId: string, userId: string) {
  return prisma.comment.findFirst({
    where: {
      id: mossNoteId,
      pageId,
      content: { path: ["type"], equals: "mossNote" },
      page: {
        type: { in: ["DOCUMENT", "DATABASE"] },
        workspace: {
          members: {
            some: { userId, role: { in: ["OWNER", "EDITOR", "MEMBER"] } },
          },
        },
      },
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string; mossNoteId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId, mossNoteId } = await params;
    const existing = await findWritableMossNote(pageId, mossNoteId, userId);
    if (!existing) {
      return NextResponse.json({ error: "MossNote not found" }, { status: 404 });
    }

    const body = await request.json();
    const existingContent = normalizeMossNoteContent(existing.content);
    if (!existingContent) {
      return NextResponse.json({ error: "MossNote not found" }, { status: 404 });
    }

    const nextBody =
      "body" in body ? String(body.body ?? "").trim() : existingContent.body;
    if (!nextBody) {
      return NextResponse.json(
        { error: "body cannot be empty" },
        { status: 400 }
      );
    }

    const nextContent: MossNoteContent = {
      type: "mossNote",
      body: nextBody.slice(0, 2000),
      color:
        "color" in body
          ? normalizeMossNoteColor(body.color)
          : existingContent.color,
      anchor:
        "anchor" in body
          ? normalizeMossNoteAnchor(body.anchor)
          : existingContent.anchor,
      position:
        "position" in body
          ? normalizeMossNotePosition(body.position)
          : existingContent.position,
    };

    const updated = await prisma.comment.update({
      where: { id: mossNoteId },
      data: {
        content: nextContent as unknown as Prisma.InputJsonObject,
        resolved:
          typeof body.resolved === "boolean" ? body.resolved : existing.resolved,
      },
    });

    return NextResponse.json(toMossNote(updated));
  } catch (error) {
    console.error("[PATCH /api/pages/[pageId]/moss-notes/[mossNoteId]]", error);
    return NextResponse.json(
      { error: "Failed to update MossNote" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string; mossNoteId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId, mossNoteId } = await params;
    const existing = await findWritableMossNote(pageId, mossNoteId, userId);
    if (!existing) {
      return NextResponse.json({ error: "MossNote not found" }, { status: 404 });
    }

    await prisma.comment.delete({ where: { id: mossNoteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/pages/[pageId]/moss-notes/[mossNoteId]]", error);
    return NextResponse.json(
      { error: "Failed to delete MossNote" },
      { status: 500 }
    );
  }
}
