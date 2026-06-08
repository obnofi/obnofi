import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { toView, toPrismaViewType } from "@/lib/prisma-transforms";

// GET /api/databases/[databaseId]/views
import { logError } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;

    const database = await prisma.database.findUnique({
      where: { id: databaseId },
      select: { id: true },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const views = await prisma.view.findMany({
      where: { databaseId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(views.map(toView));
  } catch (error) {
    logError("GET /api/databases/[databaseId]/views", error);
    return NextResponse.json(
      { error: "Failed to fetch views" },
      { status: 500 }
    );
  }
}

// POST /api/databases/[databaseId]/views
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const body = await request.json();
    const { name, type, config } = body;

    const [database, viewCount] = await Promise.all([
      prisma.database.findUnique({
        where: { id: databaseId },
        include: { properties: { select: { id: true }, orderBy: { order: "asc" } } },
      }),
      prisma.view.count({ where: { databaseId } }),
    ]);

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const typeLabel = typeof type === "string"
      ? type.charAt(0).toUpperCase() + type.slice(1)
      : "Table";

    const view = await prisma.view.create({
      data: {
        databaseId,
        name: name || `New ${typeLabel}`,
        type: toPrismaViewType(type || "table"),
        config: config || {
          visibleProperties: database.properties.map((p) => p.id),
          propertyWidths: {},
          sorts: [],
          filters: [],
        },
        order: viewCount,
      },
    });

    return NextResponse.json(toView(view), { status: 201 });
  } catch (error) {
    logError("POST /api/databases/[databaseId]/views", error);
    return NextResponse.json(
      { error: "Failed to create view" },
      { status: 500 }
    );
  }
}
