import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import {
  createDefaultPropertyValue,
  DATABASE_COLUMN_TYPES,
  normalizePropertyOptions,
} from "@/lib/database-utils";
import { toProperty, toPrismaPropertyType } from "@/lib/prisma-transforms";

import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { databaseId, name, type, options } = body;

    if (!databaseId || !name || !type) {
      return NextResponse.json(
        { error: "databaseId, name, and type are required" },
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

    // Count properties (for order) and fetch existing rows in parallel
    const [propertyCount, rows] = await Promise.all([
      prisma.property.count({ where: { databaseId } }),
      prisma.page.findMany({
        where: { parentDatabaseId: databaseId },
        select: { id: true },
      }),
    ]);

    const property = await prisma.property.create({
      data: {
        databaseId,
        name,
        type: toPrismaPropertyType(type),
        options: normalizedOptions ? (normalizedOptions as object[]) : undefined,
        order: propertyCount,
      },
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
  } catch (error) {
    logError("POST /api/columns", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}
