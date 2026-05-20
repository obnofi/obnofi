import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { buildPublicPageResponse, getSharedPageRecord } from "@/lib/public-pages";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const body = await request.json();
    const { password } = body;
    const page = await getSharedPageRecord(shareId);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (page.sharePassword) {
      const isValid = await bcrypt.compare(password, page.sharePassword);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }
    }
    const publicPage = await buildPublicPageResponse(shareId, {
      includeProtectedContent: true,
    });

    if (!publicPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(publicPage);
  } catch {
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
