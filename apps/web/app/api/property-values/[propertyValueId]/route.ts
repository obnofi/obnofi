import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { toPropertyValue } from "@/lib/prisma-transforms";

import { logError } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ propertyValueId: string }> }
) {
  try {
    const { propertyValueId } = await params;
    const body = await request.json();

    const existing = await prisma.propertyValue.findUnique({
      where: { id: propertyValueId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Property value not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if ("value" in body) updateData.value = body.value;

    const updatedPropertyValue = await prisma.propertyValue.update({
      where: { id: propertyValueId },
      data: updateData,
    });

    return NextResponse.json(toPropertyValue(updatedPropertyValue));
  } catch (error) {
    logError("PATCH /api/property-values/[propertyValueId]", error);
    return NextResponse.json(
      { error: "Failed to update property value" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ propertyValueId: string }> }
) {
  try {
    const { propertyValueId } = await params;

    const existing = await prisma.propertyValue.findUnique({
      where: { id: propertyValueId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Property value not found" },
        { status: 404 }
      );
    }

    await prisma.propertyValue.delete({ where: { id: propertyValueId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("DELETE /api/property-values/[propertyValueId]", error);
    return NextResponse.json(
      { error: "Failed to delete property value" },
      { status: 500 }
    );
  }
}
