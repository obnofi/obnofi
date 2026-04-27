import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { createDefaultPropertyValue } from "@/lib/database-utils";
import { toPage, toProperty, toPropertyValue } from "@/lib/prisma-transforms";

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

    const row = await prisma.page.create({
      data: {
        title,
        type: "DOCUMENT",
        parentId: database.pageId,
        workspaceId: database.page.workspaceId,
        parentDatabaseId: databaseId,
        content: { type: "doc", content: [{ type: "paragraph" }] },
        isPublic: false,
      },
    });

    // Create default property values for all properties in the database
    const properties = database.properties.map(toProperty);

    if (properties.length > 0) {
      await prisma.propertyValue.createMany({
        data: properties.map((property) => ({
          pageId: row.id,
          propertyId: property.id,
          value: createDefaultPropertyValue(property) as object,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch the row with its property values to return
    const rowWithValues = await prisma.page.findUnique({
      where: { id: row.id },
      include: { propertyValues: true, database: { select: { id: true } } },
    });

    const mappedPage = toPage(rowWithValues!);
    const mappedPropertyValues = (rowWithValues?.propertyValues ?? []).map(
      toPropertyValue
    );

    return NextResponse.json(
      { ...mappedPage, propertyValues: mappedPropertyValues },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create row" },
      { status: 500 }
    );
  }
}
