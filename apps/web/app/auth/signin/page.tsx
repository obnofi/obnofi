"use client";

import Link from "next/link";
import { Suspense, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { SiteLogo } from "@/components/branding/SiteLogo";

const DEFAULT_CALLBACK = "/workspace";

function SignInContent() {
  const searchParams = useSearchParams();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK;
  const isCliFlow =
    searchParams.get("callbackUrl")?.includes("127.0.0.1") ||
    searchParams.get("callbackUrl")?.includes("localhost");

  return (
    <>
      <style>{`
        @keyframes orb-1 {
          0%,100% { transform: translate(0px,   0px)  scale(1);    }
          33%      { transform: translate(45px, -35px) scale(1.1);  }
          66%      { transform: translate(-25px, 45px) scale(0.92); }
        }
        @keyframes orb-2 {
          0%,100% { transform: translate(0px,   0px)   scale(1);   }
          40%      { transform: translate(-40px, 30px)  scale(1.08); }
          80%      { transform: translate(30px, -40px)  scale(0.95); }
        }
        @keyframes orb-3 {
          0%,100% { transform: translate(0px,  0px)  scale(1);   }
          50%      { transform: translate(25px, 35px) scale(1.12); }
        }
      `}</style>

      <div
        className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16"
        style={{ background: "#FFFFFF", fontFamily: "var(--font-sans)" }}
      >
        {/* Orb background */}
        <div className="absolute inset-0 pointer-events-none" style={{ overflow: "hidden" }} aria-hidden>
          <div style={{ position: "absolute", top: "-20%", left: "-8%", width: "60%", height: "75%", background: "radial-gradient(circle, rgba(46,125,69,0.13) 0%, transparent 70%)", filter: "blur(72px)", animation: "orb-1 14s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "5%", right: "-12%", width: "50%", height: "65%", background: "radial-gradient(circle, rgba(61,160,90,0.09) 0%, transparent 70%)", filter: "blur(80px)", animation: "orb-2 18s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "-8%", left: "22%", width: "55%", height: "60%", background: "radial-gradient(circle, rgba(46,125,69,0.10) 0%, transparent 70%)", filter: "blur(64px)", animation: "orb-3 11s ease-in-out infinite" }} />
        </div>

        {/* Card */}
        <div
          className="relative z-10 flex w-full max-w-[420px] flex-col items-center rounded-2xl px-10 py-12"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E3E2E0",
            boxShadow: "0 0 0 1px rgba(46,125,69,0.06), 0 32px 80px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* Logo */}
          <Link href="/">
            <SiteLogo className="h-auto w-[108px]" priority />
          </Link>

          {/* Headline */}
          <div className="mt-8 text-center">
            {isCliFlow && (
              <span
                className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "#E8F5EC", color: "#2E7D45", letterSpacing: "0.06em" }}
              >
                로컬 CLI 연결
              </span>
            )}
            <p className="text-xs font-semibold mb-3" style={{ color: "#2E7D45", letterSpacing: "0.12em" }}>
              WELCOME BACK
            </p>
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: "28px", letterSpacing: "-0.02em", color: "#1A1A1A" }}
            >
              워크스페이스로<br />계속하기
            </h1>
            <p className="mt-3 text-sm leading-6" style={{ color: "#787774" }}>
              Obnofi에 로그인하고 작업을 이어가세요.
            </p>
          </div>

          {/* Google button */}
          <div className="mt-8 w-full">
            <button
              type="button"
              onClick={() =>
                startGoogleTransition(() => {
                  void signIn("google", { callbackUrl });
                })
              }
              disabled={isGooglePending}
              className="flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-opacity disabled:cursor-wait disabled:opacity-60"
              style={{ background: "#2E7D45", fontSize: "15px" }}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="none" d="M0 0h24v24H0z" />
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isGooglePending ? "연결하는 중..." : "Google로 계속하기"}
            </button>
          </div>

          {/* Divider + note */}
          <div className="mt-8 w-full" style={{ borderTop: "1px solid #E3E2E0" }} />
          <p className="mt-5 max-w-[34ch] text-center text-xs leading-5" style={{ color: "#787774" }}>
            로그인하면 서비스 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
          </p>
        </div>

        {/* Footer link */}
        <div className="relative z-10 mt-8">
          <Link
            href="/"
            className="text-xs transition-colors"
            style={{ color: "#787774" }}
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
