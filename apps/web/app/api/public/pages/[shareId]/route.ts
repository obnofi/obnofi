import { NextResponse } from "next/server";
import { buildPublicPageResponse } from "@/lib/public-pages";

import { logError } from "@/lib/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const page = await buildPublicPageResponse(shareId);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (error) {
    logError("GET /api/public/pages/[shareId]", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
