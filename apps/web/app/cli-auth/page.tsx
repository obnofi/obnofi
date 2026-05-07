import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { AlertTriangle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { isLocalCallbackUrl } from "@/lib/cli-auth";
import { CliAuthClient } from "./CliAuthClient";

interface Props {
  searchParams: Promise<{
    callbackUrl?: string;
    state?: string;
    name?: string;
  }>;
}

export default async function CliAuthPage({ searchParams }: Props) {
  const { callbackUrl, state, name } = await searchParams;

  if (!callbackUrl || !state) {
    return <CliAuthError message="callbackUrl과 state 파라미터가 필요합니다." />;
  }

  if (!isLocalCallbackUrl(callbackUrl)) {
    return (
      <CliAuthError message="허용되지 않은 callback URL입니다. localhost / 127.0.0.1만 사용할 수 있습니다." />
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    const returnTo = `/cli-auth?callbackUrl=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(state)}${name ? `&name=${encodeURIComponent(name)}` : ""}`;
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  return (
    <CliAuthClient
      callbackUrl={callbackUrl}
      state={state}
      name={name ?? "CLI Token"}
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }}
    />
  );
}

function CliAuthError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-lg bg-[var(--color-surface)] p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
              <AlertTriangle className="h-6 w-6 text-[var(--color-accent)]" aria-hidden="true" />
            </div>
          </div>
          <h1 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            잘못된 요청
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
        </div>
      </div>
    </div>
  );
}
