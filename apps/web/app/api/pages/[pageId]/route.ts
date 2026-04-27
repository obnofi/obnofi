import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import {
  PAGE_INCLUDE,
  toPage,
  toDatabase,
} from "@/lib/prisma-transforms";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const view = request.nextUrl.searchParams.get("view");

    if (view === "full") {
      // For database pages, do a deeper include with properties, views, rows
      const page = await prisma.page.findUnique({
        where: { id: pageId },
        include: PAGE_INCLUDE,
      });

      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      if (page.type !== "DATABASE" || !page.database?.id) {
        return NextResponse.json(
          { error: "Not a database page" },
          { status: 404 }
        );
      }

      const database = await prisma.database.findUnique({
        where: { id: page.database.id },
        include: {
          properties: { orderBy: { order: "asc" } },
          views: { orderBy: { order: "asc" } },
          rows: {
            where: { parentDatabaseId: page.database.id },
            include: { propertyValues: true },
          },
        },
      });

      if (!database) {
        return NextResponse.json(
          { error: "Database not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ...toPage(page),
        database: toDatabase(database),
      });
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: PAGE_INCLUDE,
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(toPage(page));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if ("title" in body) updateData.title = body.title;
    if ("content" in body) updateData.content = body.content;
    if ("icon" in body) updateData.icon = body.icon;
    if ("coverImage" in body) updateData.coverImage = body.coverImage;
    if ("parentId" in body) updateData.parentId = body.parentId;
    if ("isPublic" in body) updateData.isPublic = body.isPublic;

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: updateData,
      include: PAGE_INCLUDE,
    });

    return NextResponse.json(toPage(updatedPage));
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error("[PATCH /api/pages/[pageId]]", e);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    const existing = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Cascades handle children / database / propertyValues
    await prisma.page.delete({ where: { id: pageId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
