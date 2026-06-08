import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { toPropertyValue } from "@/lib/prisma-transforms";

import { logError } from "@/lib/logger";

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

    const propertyValue = await prisma.propertyValue.upsert({
      where: { pageId_propertyId: { pageId, propertyId: columnId } },
      update: { value: value as object },
      create: { pageId, propertyId: columnId, value: value as object },
    });

    return NextResponse.json(toPropertyValue(propertyValue), { status: 201 });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2003") {
      return NextResponse.json({ error: "Page or property not found" }, { status: 404 });
    }
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
  } catch (error) {
    logError("PUT /api/property-values", error);
    return NextResponse.json(
      { error: "Failed to upsert property value" },
      { status: 500 }
    );
  }
}
