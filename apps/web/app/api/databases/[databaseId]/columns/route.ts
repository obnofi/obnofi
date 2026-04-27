import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import {
  createDefaultPropertyValue,
  DATABASE_COLUMN_TYPES,
  normalizePropertyOptions,
} from "@/lib/database-utils";
import { toProperty, toPrismaPropertyType } from "@/lib/prisma-transforms";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;
    const body = await request.json();
    const { name, type, options } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      );
    }

    const database = await prisma.database.findUnique({
      where: { id: databaseId },
      select: { id: true },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    if (!DATABASE_COLUMN_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid column type" }, { status: 400 });
    }

    const normalizedOptions = normalizePropertyOptions(type, name, options);

    // Get current property count for order
    const propertyCount = await prisma.property.count({
      where: { databaseId },
    });

    const property = await prisma.property.create({
      data: {
        databaseId,
        name,
        type: toPrismaPropertyType(type),
        options: normalizedOptions ? (normalizedOptions as object[]) : undefined,
        order: propertyCount,
      },
    });

    // Create default PropertyValues for all existing rows
    const rows = await prisma.page.findMany({
      where: { parentDatabaseId: databaseId },
      select: { id: true },
    });

    const mappedProperty = toProperty(property);

    if (rows.length > 0) {
      await prisma.propertyValue.createMany({
        data: rows.map((row) => ({
          pageId: row.id,
          propertyId: property.id,
          value: createDefaultPropertyValue(mappedProperty) as object,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(mappedProperty, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}
