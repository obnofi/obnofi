import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { toProperty, toPrismaPropertyType } from "@/lib/prisma-transforms";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    // columnId is legacy naming — it maps to Property.id
    const { columnId } = await params;
    const body = await request.json();

    const existing = await prisma.property.findUnique({
      where: { id: columnId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if ("name" in body) updateData.name = body.name;
    if ("type" in body) updateData.type = toPrismaPropertyType(body.type);
    if ("options" in body) updateData.options = body.options;
    if ("order" in body) updateData.order = body.order;

    const updatedProperty = await prisma.property.update({
      where: { id: columnId },
      data: updateData,
    });

    return NextResponse.json(toProperty(updatedProperty));
  } catch {
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    // columnId is legacy naming — it maps to Property.id
    const { columnId } = await params;

    const existing = await prisma.property.findUnique({
      where: { id: columnId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Cascade handles PropertyValues
    await prisma.property.delete({ where: { id: columnId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete column" },
      { status: 500 }
    );
  }
}
