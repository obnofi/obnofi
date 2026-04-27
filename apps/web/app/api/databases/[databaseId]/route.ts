import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { toDatabase } from "@/lib/prisma-transforms";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;

    const database = await prisma.database.findUnique({
      where: { id: databaseId },
      include: {
        properties: { orderBy: { order: "asc" } },
        views: { orderBy: { order: "asc" } },
        rows: {
          where: { parentDatabaseId: databaseId },
          include: { propertyValues: true },
        },
      },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json(toDatabase(database));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch database" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;

    const existing = await prisma.database.findUnique({
      where: { id: databaseId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    // Cascades handle properties, views, and rows
    await prisma.database.delete({ where: { id: databaseId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    );
  }
}
