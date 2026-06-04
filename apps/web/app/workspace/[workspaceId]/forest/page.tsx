import { Suspense } from "react";
import { ForestFeedClient } from "@/components/published/ForestFeedClient";
import { listForestTags, listPublishedSnapshots } from "@/lib/publishedPages";
import { getSessionUserId } from "@/lib/request-auth";

interface WorkspaceForestPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WorkspaceForestPage({
  searchParams,
}: WorkspaceForestPageProps) {
  const resolved = await searchParams;
  const sort = resolved.sort === "popular" ? "popular" : "latest";
  const tag = typeof resolved.tag === "string" ? resolved.tag : null;
  const viewerUserId = await getSessionUserId();
  const [publications, tags] = await Promise.all([
    listPublishedSnapshots({ sort, tag, viewerUserId }),
    listForestTags(),
  ]);

  return (
    <Suspense>
      <ForestFeedClient
        initialPublications={publications}
        initialTags={tags}
        initialSort={sort}
        initialTag={tag}
      />
    </Suspense>
  );
}
