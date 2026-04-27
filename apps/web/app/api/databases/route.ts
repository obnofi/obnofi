import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getExampleDatabaseColumns } from "@/lib/database-utils";
import {
  toDatabase,
  toPrismaPropertyType,
  toPrismaViewType,
} from "@/lib/prisma-transforms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if database already exists for this page
    const existingDb = await prisma.database.findUnique({
      where: { pageId },
      include: {
        properties: { orderBy: { order: "asc" } },
        views: { orderBy: { order: "asc" } },
        rows: {
          where: { parentDatabaseId: undefined },
          include: { propertyValues: true },
        },
      },
    });

    if (existingDb) {
      // Fix rows query: find rows where parentDatabaseId = existingDb.id
      const fullDb = await prisma.database.findUnique({
        where: { id: existingDb.id },
        include: {
          properties: { orderBy: { order: "asc" } },
          views: { orderBy: { order: "asc" } },
          rows: {
            where: { parentDatabaseId: existingDb.id },
            include: { propertyValues: true },
          },
        },
      });
      return NextResponse.json(toDatabase(fullDb!));
    }

    const defaultColumns = getExampleDatabaseColumns();

    const database = await prisma.$transaction(async (tx) => {
      const newDb = await tx.database.create({
        data: { pageId },
      });

      let order = 0;
      for (const col of defaultColumns) {
        await tx.property.create({
          data: {
            databaseId: newDb.id,
            name: col.name,
            type: toPrismaPropertyType(col.type),
            options: col.options ? (col.options as object[]) : undefined,
            order: order++,
          },
        });
      }

      await tx.view.create({
        data: {
          databaseId: newDb.id,
          name: "Table",
          type: toPrismaViewType("table"),
          order: 0,
        },
      });

      return newDb;
    });

    const fullDb = await prisma.database.findUnique({
      where: { id: database.id },
      include: {
        properties: { orderBy: { order: "asc" } },
        views: { orderBy: { order: "asc" } },
        rows: {
          where: { parentDatabaseId: database.id },
          include: { propertyValues: true },
        },
      },
    });

    return NextResponse.json(toDatabase(fullDb!), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create database" },
      { status: 500 }
    );
  }
}
