import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-db";
import { PageType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    const pages = mockDb.pages.getByWorkspace(workspaceId);
    return NextResponse.json(pages);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, parentId, workspaceId, databaseId } = body;

    if (!title || !type || !workspaceId) {
      return NextResponse.json(
        { error: "title, type, and workspaceId are required" },
        { status: 400 }
      );
    }

    const validTypes: PageType[] = ["document", "canvas", "database"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid page type" }, { status: 400 });
    }

    const newPage = mockDb.pages.create({
      title,
      type,
      parentId: parentId || null,
      workspaceId,
      databaseId: databaseId || null,
      parentDatabaseId: databaseId || null,
      content: type === "document" ? { type: "doc", content: [{ type: "paragraph" }] } : null,
      icon: null,
      isPublic: false,
      shareId: null,
      sharePassword: null,
    });

    if (type === "database") {
      const database = mockDb.databases.create(newPage.id);
      mockDb.columns.create({
        databaseId: database.id,
        name: "Status",
        type: "select",
        options: [
          { id: `opt-${Date.now()}-todo`, label: "To Do", color: "#E3E2E0" },
          { id: `opt-${Date.now()}-progress`, label: "In Progress", color: "#FDECC8" },
          { id: `opt-${Date.now()}-done`, label: "Done", color: "#DBEDDB" },
        ],
      });
      mockDb.columns.create({
        databaseId: database.id,
        name: "Notes",
        type: "text",
      });
    }

    return NextResponse.json(newPage, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
