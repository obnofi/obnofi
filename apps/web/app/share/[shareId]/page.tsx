import { notFound } from "next/navigation";
import { SharePageClient } from "./SharePageClient";
import { PublicPageView } from "@/components/share/PublicPageView";
import { buildPublicPageResponse } from "@/lib/public-pages";

interface SharePageProps {
  params: Promise<{ shareId: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;
  const page = await buildPublicPageResponse(shareId);

  if (!page) {
    notFound();
  }

  if (!page.isPasswordProtected) {
    return (
      <PublicPageView
        title={page.title}
        icon={page.icon}
        coverImage={page.coverImage}
        content={page.content}
        updatedAt={page.updatedAt}
      />
    );
  }

  return <SharePageClient shareId={shareId} />;
}
