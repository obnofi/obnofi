import { notFound } from "next/navigation";
import { SharePageClient } from "./SharePageClient";
import { PublicPageView } from "@/components/share/PublicPageView";

interface SharePageProps {
  params: Promise<{ shareId: string }>;
}

interface PublicPageResponse {
  id: string;
  workspaceId: string;
  title: string;
  icon: string | null;
  coverImage: string | null;
  content: object | null;
  updatedAt: string;
  isPasswordProtected: boolean;
}

async function getPublicPage(shareId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/public/pages/${shareId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PublicPageResponse;
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;
  const page = await getPublicPage(shareId);

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
