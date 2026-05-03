"use client";

import { useRouter } from "next/navigation";
import { PasswordPrompt } from "@/components/share/PasswordPrompt";

interface SharePageClientProps {
  shareId: string;
  redirectPath: string;
  requiresSignIn: boolean;
}

export function SharePageClient({
  shareId,
  redirectPath,
  requiresSignIn,
}: SharePageClientProps) {
  const router = useRouter();

  return (
    <PasswordPrompt
      shareId={shareId}
      onSuccess={() => {
        if (requiresSignIn) {
          router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(redirectPath)}`);
          return;
        }

        router.replace(redirectPath);
      }}
    />
  );
}
