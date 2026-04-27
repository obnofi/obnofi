import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { toPropertyValue } from "@/lib/prisma-transforms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // columnId is the legacy name for propertyId
    const { pageId, columnId, value } = body;

    if (!pageId || !columnId || value === undefined) {
      return NextResponse.json(
        { error: "pageId, columnId, and value are required" },
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

    const property = await prisma.property.findUnique({
      where: { id: columnId },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Use upsert to handle both create and update
    const propertyValue = await prisma.propertyValue.upsert({
      where: { pageId_propertyId: { pageId, propertyId: columnId } },
      update: { value: value as object },
      create: { pageId, propertyId: columnId, value: value as object },
    });

    return NextResponse.json(toPropertyValue(propertyValue), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create property value" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // columnId is the legacy name for propertyId
    const { pageId, columnId, value } = body;

    if (!pageId || !columnId || value === undefined) {
      return NextResponse.json(
        { error: "pageId, columnId, and value are required" },
        { status: 400 }
      );
    }

    const propertyValue = await prisma.propertyValue.upsert({
      where: { pageId_propertyId: { pageId, propertyId: columnId } },
      update: { value: value as object },
      create: { pageId, propertyId: columnId, value: value as object },
    });

    return NextResponse.json(toPropertyValue(propertyValue));
  } catch {
    return NextResponse.json(
      { error: "Failed to upsert property value" },
      { status: 500 }
    );
  }
}
