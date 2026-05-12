import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireSessionUser(callbackUrl?: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    const nextPath = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/auth/signin${nextPath}`);
  }

  return session.user;
}
