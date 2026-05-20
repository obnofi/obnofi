import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import type {
  GroveTitleLevel,
  HeadingLevel,
  PageHighlightColor,
} from "@obnofi/types";
import {
  PAGE_DETAIL_SELECT,
  PAGE_INCLUDE,
  PAGE_SELECT,
  PAGE_SELECT_WITH_PROPERTY_VALUES,
  toPage,
  toDatabase,
} from "@/lib/prisma-transforms";
import { normalizeTiptapDocument } from "@/lib/normalizeTiptapDocument";
import { jsonWithPrivateReadCache } from "@/lib/httpCache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const view = request.nextUrl.searchParams.get("view");

    if (view === "full") {
      // Database.pageId is @unique — query page and database in parallel
      const [page, database] = await Promise.all([
        prisma.page.findUnique({ where: { id: pageId }, include: PAGE_INCLUDE }),
        prisma.database.findUnique({
          where: { pageId },
          include: {
            properties: { orderBy: { order: "asc" } },
            views: { orderBy: { order: "asc" } },
            rows: {
              // content 제외 — DB 테이블/보드 뷰에서 문서 본문 불필요
              select: PAGE_SELECT_WITH_PROPERTY_VALUES,
            },
          },
        }),
      ]);

      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      if (page.type !== "DATABASE" || !database) {
        return NextResponse.json(
          { error: "Not a database page" },
          { status: 404 }
        );
      }

      return jsonWithPrivateReadCache({
        ...toPage(page),
        database: toDatabase(database),
      });
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        ...PAGE_DETAIL_SELECT,
        propertyValues: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return jsonWithPrivateReadCache(toPage(page));
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
    const nextGroveTitleLevel = body.groveTitleLevel;
    const nextBodyFontSizePt = body.bodyFontSizePt;
    const nextHeadingFontSizes = body.headingFontSizes;
    const nextHighlightColors = body.highlightColors;
    const allowedHighlightColors: PageHighlightColor[] = [
      "yellow",
      "green",
      "blue",
      "purple",
      "pink",
      "red",
      "orange",
    ];

    if (
      "groveTitleLevel" in body &&
      ![1, 2, 3, 4, 5].includes(nextGroveTitleLevel)
    ) {
      return NextResponse.json(
        { error: "groveTitleLevel must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (
      "bodyFontSizePt" in body &&
      (!Number.isInteger(nextBodyFontSizePt) ||
        nextBodyFontSizePt < 8 ||
        nextBodyFontSizePt > 32)
    ) {
      return NextResponse.json(
        { error: "bodyFontSizePt must be an integer between 8 and 32" },
        { status: 400 }
      );
    }

    if ("headingFontSizes" in body) {
      const headingEntries = Object.entries(
        (nextHeadingFontSizes ?? {}) as Record<string, unknown>
      );

      const hasInvalidHeadingSize = headingEntries.some(([, value]) => {
        return !Number.isInteger(value) || Number(value) < 8 || Number(value) > 48;
      });

      const hasInvalidHeadingKey = headingEntries.some(([key]) => {
        return !["h1", "h2", "h3", "h4", "h5"].includes(key);
      });

      if (hasInvalidHeadingKey || hasInvalidHeadingSize) {
        return NextResponse.json(
          { error: "headingFontSizes must contain h1~h5 integers between 8 and 48" },
          { status: 400 }
        );
      }
    }

    if ("highlightColors" in body) {
      const isValidHighlightColors =
        Array.isArray(nextHighlightColors) &&
        nextHighlightColors.length > 0 &&
        nextHighlightColors.every((color) =>
          allowedHighlightColors.includes(color as PageHighlightColor)
        );

      if (!isValidHighlightColors) {
        return NextResponse.json(
          { error: "highlightColors must be a non-empty array of allowed colors" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if ("title" in body) updateData.title = body.title;
    if ("groveTitleLevel" in body) {
      updateData.groveTitleLevel = nextGroveTitleLevel as GroveTitleLevel;
    }
    if ("bodyFontSizePt" in body) updateData.bodyFontSizePt = nextBodyFontSizePt;
    if ("headingFontSizes" in body) {
      const headingFontSizes = nextHeadingFontSizes as Partial<
        Record<`h${HeadingLevel}`, number>
      >;
      if ("h1" in headingFontSizes) updateData.heading1FontSizePt = headingFontSizes.h1;
      if ("h2" in headingFontSizes) updateData.heading2FontSizePt = headingFontSizes.h2;
      if ("h3" in headingFontSizes) updateData.heading3FontSizePt = headingFontSizes.h3;
      if ("h4" in headingFontSizes) updateData.heading4FontSizePt = headingFontSizes.h4;
      if ("h5" in headingFontSizes) updateData.heading5FontSizePt = headingFontSizes.h5;
    }
    if ("highlightColors" in body) updateData.highlightColors = nextHighlightColors;
    if ("content" in body) {
      updateData.content = normalizeTiptapDocument(body.content);
    }
    if ("icon" in body) updateData.icon = body.icon;
    if ("coverImage" in body) updateData.coverImage = body.coverImage;
    if ("parentId" in body) updateData.parentId = body.parentId;
    if ("order" in body) updateData.order = body.order;
    if ("isPublic" in body) updateData.isPublic = body.isPublic;
    if ("collaborationEnabled" in body) updateData.collaborationEnabled = Boolean(body.collaborationEnabled);
    if ("lineIndicatorEnabled" in body) updateData.lineIndicatorEnabled = Boolean(body.lineIndicatorEnabled);
    const shouldReturnDetailedPage = "content" in body;

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: updateData,
      select: shouldReturnDetailedPage ? PAGE_DETAIL_SELECT : PAGE_SELECT,
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

    await prisma.$transaction(async (tx) => {
      const rootPage = await tx.page.findUnique({
        where: { id: pageId },
        select: { id: true },
      });

      if (!rootPage) {
        return;
      }

      const pageIds = new Set<string>([pageId]);
      const databaseIds = new Set<string>();
      let frontier = [pageId];

      while (frontier.length > 0) {
        const [children, databases] = await Promise.all([
          tx.page.findMany({
            where: { parentId: { in: frontier } },
            select: { id: true },
          }),
          tx.database.findMany({
            where: { pageId: { in: frontier } },
            select: { id: true },
          }),
        ]);

        const nextFrontier: string[] = [];
        for (const child of children) {
          if (!pageIds.has(child.id)) {
            pageIds.add(child.id);
            nextFrontier.push(child.id);
          }
        }

        const newDatabaseIds = databases
          .map((database) => database.id)
          .filter((databaseId) => !databaseIds.has(databaseId));

        for (const databaseId of newDatabaseIds) {
          databaseIds.add(databaseId);
        }

        if (newDatabaseIds.length > 0) {
          const specimens = await tx.page.findMany({
            where: { parentDatabaseId: { in: newDatabaseIds } },
            select: { id: true },
          });

          for (const specimen of specimens) {
            if (!pageIds.has(specimen.id)) {
              pageIds.add(specimen.id);
              nextFrontier.push(specimen.id);
            }
          }
        }

        frontier = nextFrontier;
      }

      const ids = Array.from(pageIds);
      await Promise.all([
        tx.page.updateMany({
          where: { parentId: { in: ids } },
          data: { parentId: null },
        }),
        databaseIds.size > 0
          ? tx.page.updateMany({
              where: { parentDatabaseId: { in: Array.from(databaseIds) } },
              data: { parentDatabaseId: null },
            })
          : Promise.resolve(),
        tx.comment.updateMany({
          where: { pageId: { in: ids }, parentId: { not: null } },
          data: { parentId: null },
        }),
        tx.file.updateMany({
          where: { pageId: { in: ids } },
          data: { pageId: null },
        }),
      ]);

      await Promise.all([
        tx.pageLink.deleteMany({
          where: {
            OR: [{ sourceId: { in: ids } }, { targetId: { in: ids } }],
          },
        }),
        tx.pageCollaborator.deleteMany({ where: { pageId: { in: ids } } }),
        tx.yjsDocument.deleteMany({ where: { pageId: { in: ids } } }),
        tx.propertyValue.deleteMany({ where: { pageId: { in: ids } } }),
      ]);

      await tx.comment.deleteMany({ where: { pageId: { in: ids } } });
      if (databaseIds.size > 0) {
        await tx.database.deleteMany({
          where: { id: { in: Array.from(databaseIds) } },
        });
      }
      await tx.page.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ success: true });
    }
    console.error("[DELETE /api/pages/[pageId]]", e);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
