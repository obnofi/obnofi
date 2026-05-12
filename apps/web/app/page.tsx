import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/workspace");
  }

  return <LandingPage />;
}
