"use client";

import { useState } from "react";
import { PasswordPrompt } from "@/components/share/PasswordPrompt";
import { PublicPageView } from "@/components/share/PublicPageView";

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

interface SharePageClientProps {
  shareId: string;
}

export function SharePageClient({ shareId }: SharePageClientProps) {
  const [publicPage, setPublicPage] = useState<PublicPageResponse | null>(null);

  if (publicPage) {
    return (
      <PublicPageView
        title={publicPage.title}
        icon={publicPage.icon}
        coverImage={publicPage.coverImage}
        content={publicPage.content}
        updatedAt={publicPage.updatedAt}
      />
    );
  }

  return (
    <PasswordPrompt
      shareId={shareId}
      onSuccess={(page) => setPublicPage(page)}
    />
  );
}
