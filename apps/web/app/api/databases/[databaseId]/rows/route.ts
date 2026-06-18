import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@obnofi/db";
import { prisma } from "@obnofi/db";
import { createDefaultPropertyValue } from "@/lib/database-utils";
import {
  PAGE_DATABASE_ROW_SELECT,
  toPage,
  toProperty,
  toPropertyValue,
} from "@/lib/prisma-transforms";

const ROW_CREATE_SELECT = PAGE_DATABASE_ROW_SELECT satisfies Prisma.PageSelect;

import { logError } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const body = await request.json();
    const { title = "Untitled" } = body;

    const database = await prisma.database.findUnique({
      where: { id: databaseId },
      include: {
        page: { select: { workspaceId: true, id: true } },
        properties: { orderBy: { order: "asc" } },
      },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const properties = database.properties.map(toProperty);
    const pvData = properties.map((property) => ({
      propertyId: property.id,
      value: createDefaultPropertyValue(property) as object,
    }));

    const row = await prisma.page.create({
      data: {
        title,
        type: "DOCUMENT",
        parentId: database.pageId,
        workspaceId: database.page.workspaceId,
        parentDatabaseId: databaseId,
        content: { type: "doc", content: [{ type: "paragraph" }] },
        isPublic: false,
        ...(pvData.length > 0
          ? { propertyValues: { createMany: { data: pvData, skipDuplicates: true } } }
          : {}),
      },
      select: ROW_CREATE_SELECT,
    });

    const mappedPage = toPage(row);
    const mappedPropertyValues = row.propertyValues.map(toPropertyValue);

    return NextResponse.json(
      { ...mappedPage, propertyValues: mappedPropertyValues },
      { status: 201 }
    );
  } catch (error) {
    logError("POST /api/databases/[databaseId]/rows", error);
    return NextResponse.json(
      { error: "Failed to create row" },
      { status: 500 }
    );
  }
}
