import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getSessionUserId, generateCliToken } from "@/lib/request-auth";
import { isLocalCallbackUrl } from "@/lib/cli-auth";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { callbackUrl, state, name } = body as {
    callbackUrl?: string;
    state?: string;
    name?: string;
  };

  if (!callbackUrl || !state) {
    return NextResponse.json(
      { error: "callbackUrl과 state는 필수입니다." },
      { status: 400 }
    );
  }

  if (!isLocalCallbackUrl(callbackUrl)) {
    return NextResponse.json(
      { error: "callback URL은 localhost / 127.0.0.1만 허용됩니다." },
      { status: 400 }
    );
  }

  const tokenName =
    typeof name === "string" && name.trim() ? name.trim() : "CLI Token";

  const { raw, hash } = generateCliToken();

  await prisma.cliToken.create({
    data: { userId, name: tokenName, tokenHash: hash },
  });

  // 서버 → CLI 로컬 서버로 토큰 전달 (브라우저를 경유하지 않아 URL에 노출되지 않음)
  try {
    const callbackRes = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: raw, state }),
      signal: AbortSignal.timeout(8000),
    });

    if (!callbackRes.ok) {
      console.error("[cli-auth] callback returned non-ok status:", callbackRes.status);
      return NextResponse.json(
        { error: "CLI callback 서버가 오류를 반환했습니다. CLI가 아직 실행 중인지 확인하세요." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[cli-auth] callback fetch failed:", err);
    return NextResponse.json(
      { error: "CLI callback 서버에 연결할 수 없습니다. CLI가 아직 실행 중인지 확인하세요." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
