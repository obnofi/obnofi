import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";
import { SharePageClient } from "./SharePageClient";
import { authOptions } from "@/lib/auth";

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
  const session = await getServerSession(authOptions);
  const { shareId } = await params;
  const page = await getPublicPage(shareId);

  if (!page) {
    notFound();
  }

  const workspacePath = `/workspace/${page.workspaceId}?page=${page.id}`;

  if (!page.isPasswordProtected) {
    if (!session?.user) {
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent(workspacePath)}`);
    }
    redirect(workspacePath);
  }

  return (
    <SharePageClient
      shareId={shareId}
      redirectPath={workspacePath}
      requiresSignIn={!session?.user}
    />
  );
}
