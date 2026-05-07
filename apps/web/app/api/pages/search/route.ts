import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getSearchSnippet, matchesSearch, resolveSearchableContent, type PageSearchMode } from "@/lib/page-search";
import {
  getAuthenticatedUserId,
  resolveWorkspaceForUser,
} from "@/lib/workspace-resolution";

export const dynamic = "force-dynamic";

const SEARCHABLE_PAGE_SELECT = {
  id: true,
  title: true,
  type: true,
  icon: true,
  parentId: true,
  updatedAt: true,
  content: true,
  yjsDocument: {
    select: {
      state: true,
    },
  },
} as const;

const VALID_SEARCH_MODES: PageSearchMode[] = ["title", "content", "title_content"];

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedWorkspaceId = searchParams.get("workspaceId");
    const query = searchParams.get("q")?.trim() ?? "";
    const modeParam = searchParams.get("mode") ?? "title_content";
    const mode = VALID_SEARCH_MODES.includes(modeParam as PageSearchMode)
      ? (modeParam as PageSearchMode)
      : "title_content";

    const workspace = await resolveWorkspaceForUser(userId, requestedWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (!query) {
      return NextResponse.json([]);
    }

    const candidatePages = await prisma.page.findMany({
      where: {
        workspaceId: workspace.id,
        parentDatabaseId: null,
        ...(mode === "title"
          ? { title: { contains: query, mode: "insensitive" } }
          : {}),
      },
      select: SEARCHABLE_PAGE_SELECT,
      orderBy: [{ updatedAt: "desc" }],
      take: mode === "title" ? 50 : 250,
    });

    const results = candidatePages
      .map((page) => {
        const contentText = resolveSearchableContent({
          content: page.content,
          yjsState: page.yjsDocument?.state,
        });

        if (
          !matchesSearch({
            query,
            title: page.title,
            content: contentText,
            mode,
          })
        ) {
          return null;
        }

        const titleMatches = page.title.toLowerCase().includes(query.toLowerCase());
        const contentMatches = contentText.toLowerCase().includes(query.toLowerCase());
        const snippet =
          mode === "title" && !contentMatches
            ? ""
            : getSearchSnippet(contentText, query);

        return {
          id: page.id,
          title: page.title,
          type: page.type.toLowerCase(),
          icon: page.icon ?? null,
          parentId: page.parentId,
          updatedAt: page.updatedAt.toISOString(),
          snippet,
          matchedIn:
            titleMatches && contentMatches
              ? "title_content"
              : titleMatches
                ? "title"
                : "content",
          score: (titleMatches ? 10 : 0) + (contentMatches ? 3 : 0),
        };
      })
      .filter((page): page is NonNullable<typeof page> => page !== null)
      .sort((a, b) => b.score - a.score || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 30)
      .map((page) => ({
        id: page.id,
        title: page.title,
        type: page.type,
        icon: page.icon,
        parentId: page.parentId,
        updatedAt: page.updatedAt,
        snippet: page.snippet,
        matchedIn: page.matchedIn,
      }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET /api/pages/search]", error);
    return NextResponse.json(
      { error: "Failed to search pages" },
      { status: 500 }
    );
  }
}
