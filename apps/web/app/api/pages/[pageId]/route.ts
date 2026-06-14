import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
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
import { validatePatchBody, buildPageUpdateData } from "@/lib/api/pageUpdateValidation";
import { collectPageSubtreeIds, cascadeDeletePages } from "@/lib/api/pageDeleteUtils";
import { getRemovedInlineOwnedPageIds } from "@/lib/api/inlineOwnedPageUtils";

import { logError } from "@/lib/logger";

const MAX_JUNGLE_ROW_LIMIT = 5000;

function getJungleRowLimit(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("jungleLimit");
  if (!rawLimit) {
    return undefined;
  }

  const limit = Number(rawLimit);
  if (!Number.isFinite(limit) || limit <= 0) {
    return undefined;
  }

  return Math.min(Math.floor(limit), MAX_JUNGLE_ROW_LIMIT);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const view = request.nextUrl.searchParams.get("view");

    if (view === "full") {
      const jungleRowLimit = getJungleRowLimit(request);
      const [page, database] = await Promise.all([
        prisma.page.findUnique({ where: { id: pageId }, include: PAGE_INCLUDE }),
        prisma.database.findUnique({
          where: { pageId },
          include: {
            properties: { orderBy: { order: "asc" } },
            views: { orderBy: { order: "asc" } },
            rows: {
              select: PAGE_SELECT_WITH_PROPERTY_VALUES,
              ...(jungleRowLimit
                ? {
                    take: jungleRowLimit,
                    orderBy: [{ order: "asc" as const }, { updatedAt: "desc" as const }],
                  }
                : {}),
            },
          },
        }),
      ]);

      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      if (page.type !== "DATABASE" || !database) {
        return NextResponse.json({ error: "Not a database page" }, { status: 404 });
      }

      return jsonWithPrivateReadCache({ ...toPage(page), database: toDatabase(database) });
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { ...PAGE_DETAIL_SELECT, propertyValues: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return jsonWithPrivateReadCache(toPage(page));
  } catch (error) {
    logError("GET /api/pages/[pageId]", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const body = await request.json() as Record<string, unknown>;

    const validationError = validatePatchBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const normalizedContent = "content" in body
      ? normalizeTiptapDocument(body.content)
      : undefined;
    const updateData = buildPageUpdateData(body, normalizedContent);
    const shouldReturnDetailedPage = "content" in body;
    const updatedPage = await prisma.$transaction(async (tx) => {
      const existingPage = shouldReturnDetailedPage
        ? await tx.page.findUnique({
            where: { id: pageId },
            select: { id: true, content: true },
          })
        : null;

      const nextPage = await tx.page.update({
        where: { id: pageId },
        data: updateData,
        select: shouldReturnDetailedPage ? PAGE_DETAIL_SELECT : PAGE_SELECT,
      });

      if (shouldReturnDetailedPage && existingPage && normalizedContent) {
        const removedInlinePageIds = getRemovedInlineOwnedPageIds(
          existingPage.content,
          normalizedContent
        ).filter((removedPageId) => removedPageId !== pageId);

        for (const removedPageId of removedInlinePageIds) {
          const rootPage = await tx.page.findUnique({
            where: { id: removedPageId },
            select: { id: true },
          });
          if (!rootPage) continue;

          const { pageIds, databaseIds } = await collectPageSubtreeIds(tx, removedPageId);
          await cascadeDeletePages(tx, pageIds, databaseIds);
        }
      }

      return nextPage;
    });

    return NextResponse.json(toPage(updatedPage));
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error("[PATCH /api/pages/[pageId]]", e);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    await prisma.$transaction(
      async (tx) => {
        const rootPage = await tx.page.findUnique({ where: { id: pageId }, select: { id: true } });
        if (!rootPage) return;

        const { pageIds, databaseIds } = await collectPageSubtreeIds(tx, pageId);
        await cascadeDeletePages(tx, pageIds, databaseIds);
      },
      { maxWait: 15000, timeout: 30000 }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ success: true });
    }
    console.error("[DELETE /api/pages/[pageId]]", e);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
