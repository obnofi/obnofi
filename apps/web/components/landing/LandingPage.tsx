"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useInView, useScrollY } from "@/lib/landing/landingHooks";
import {
  AppWindowMockup,
  CanvasMockup,
  DatabaseMockup,
} from "@/components/landing/LandingMockups";
import {
  LANDING_STYLES,
  LandingNav,
  HowItWorksSection,
  FeaturesGridSection,
  EmotionSection,
  FeaturesMarqueeSection,
  FaqSection,
  CtaSection,
  LandingFooter,
} from "@/components/landing/LandingSections";

export function LandingPage() {
  const scrollY = useScrollY();

  const { ref: heroRef,  inView: heroIn  } = useInView(0.01);
  const { ref: howRef,   inView: howIn   } = useInView(0.05);
  const { ref: s1Ref,    inView: s1In    } = useInView(0.1);
  const { ref: s2Ref,    inView: s2In    } = useInView(0.1);
  const { ref: ctaRef,   inView: ctaIn   } = useInView(0.1);
  const { ref: faqRef,   inView: faqIn   } = useInView(0.1);
  const { ref: emotionRef, inView: emotionIn } = useInView(0.1);

  return (
    <>
      <style>{LANDING_STYLES}</style>

      <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, sans-serif" }}>

        <LandingNav />

        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <section
          className="relative flex items-center overflow-hidden"
          style={{ background: "#0C1810", minHeight: "calc(100vh - 56px)" }}
        >
          {/* glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div style={{ position:"absolute", top:"10%", left:"-5%", width:"50%", height:"70%", background:"radial-gradient(circle, rgba(46,180,80,0.28) 0%, transparent 60%)", filter:"blur(90px)", animation:"orb-1 14s ease-in-out infinite" }} />
            <div style={{ position:"absolute", bottom:"5%", right:"20%", width:"40%", height:"55%", background:"radial-gradient(circle, rgba(30,120,60,0.18) 0%, transparent 60%)", filter:"blur(80px)", animation:"orb-3 11s ease-in-out infinite" }} />
          </div>

          {/* Left: text */}
          <div ref={heroRef} className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 xl:px-28 py-20">
            <p className={`text-xs font-semibold mb-6 reveal${heroIn ? " in" : ""}`} style={{ color: "rgba(80,210,120,0.75)", letterSpacing: "0.2em" }}>
              생각을 위한 하나의 공간
            </p>
            <h1 className={`mb-6 leading-[1.05] reveal reveal-delay-1${heroIn ? " in" : ""}`} style={{ fontSize: "clamp(40px, 5vw, 76px)", letterSpacing: "-0.05em", color: "#FFFFFF", fontWeight: 800 }}>
              끊기지 않는<br /><span style={{ color: "#4ADB7A" }}>사고흐름</span>
            </h1>
            <p className={`mb-10 reveal reveal-delay-2${heroIn ? " in" : ""}`} style={{ color: "rgba(255,255,255,0.45)", fontSize: "clamp(15px, 1.4vw, 19px)", maxWidth: "30ch", lineHeight: 1.75 }}>
              메모, 캔버스, 데이터베이스.<br />도구 전환 없이 한 곳에서.
            </p>
            <div className={`reveal reveal-delay-3${heroIn ? " in" : ""}`}>
              <Link href="/auth/signin" className="inline-flex items-center font-semibold px-7 py-3.5 rounded-xl text-white" style={{ background: "#2E7D45", fontSize: "15px" }}>
                시작하기
              </Link>
            </div>
          </div>

          {/* Right: mockup */}
          <div className="hidden lg:flex relative z-10 flex-1 items-center justify-center pr-8 xl:pr-16 py-16">
            <div style={{ animation: "float-mockup 8s ease-in-out infinite", width: "100%", maxWidth: "680px", filter: "drop-shadow(0 32px 64px rgba(0,0,0,0.5))" }}>
              <AppWindowMockup />
            </div>
          </div>
        </section>

        <HowItWorksSection howRef={howRef} howIn={howIn} />

        <FeaturesGridSection />

        {/* ══ CANVAS ════════════════════════════════════════════════ */}
        <section style={{ background: "linear-gradient(160deg, #E8F5EC 0%, #F0FAF3 60%, #E4F4EC 100%)", display: "flex", alignItems: "center" }}>
          <div
            ref={s1Ref}
            className={`max-w-6xl mx-auto px-6 lg:px-12 py-16 grid items-center gap-12 w-full reveal${s1In ? " in" : ""} lg:grid-cols-2`}
          >
            <div>
              <p className="text-xs font-semibold mb-5" style={{ color: "#2E7D45", letterSpacing: "0.14em" }}>클리어링 캔버스</p>
              <h2 className="mb-6 leading-tight" style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.04em", color: "#1F3D2A", fontWeight: 800 }}>
                아이디어를 펼치는<br />무한 캔버스
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "#3D6B50", maxWidth: "36ch" }}>
                스티키 노트, 도형, 커넥터, 이미지를 자유롭게 배치하세요.
                무한히 확장되는 공간에서 생각을 시각화하세요.
              </p>
              <ul className="space-y-3">
                {["무한 확장 가능한 캔버스", "스티키 노트와 도형", "커넥터로 아이디어 연결", "페이지와 연결"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#3D6B50" }}>
                    <Check size={14} style={{ color: "#2E7D45" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <CanvasMockup />
          </div>
        </section>

        {/* ══ DATABASE ══════════════════════════════════════════════ */}
        <section style={{ background: "#FFFFFF", display: "flex", alignItems: "center" }}>
          <div
            ref={s2Ref}
            className={`max-w-6xl mx-auto px-6 lg:px-12 py-16 grid items-center gap-12 w-full reveal${s2In ? " in" : ""} lg:grid-cols-2`}
          >
            <DatabaseMockup />
            <div>
              <p className="text-xs font-semibold mb-5" style={{ color: "#2E7D45", letterSpacing: "0.14em" }}>언더그로스 데이터베이스</p>
              <h2 className="mb-6 leading-tight" style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.04em", color: "#111111", fontWeight: 800 }}>
                데이터를<br />원하는 방식으로
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "#787774", maxWidth: "36ch" }}>
                테이블, 보드, 갤러리, 리스트, 캘린더, 타임라인 — 같은 데이터를
                6가지 뷰로 자유롭게 전환. 필터와 정렬로 인사이트를 꺼내세요.
              </p>
              <ul className="space-y-3">
                {["6가지 뷰 전환", "필터와 정렬", "관계형 데이터베이스", "속성 타입 10+ 종류"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#787774" }}>
                    <Check size={14} style={{ color: "#2E7D45" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <FeaturesMarqueeSection />

        <FaqSection faqRef={faqRef} faqIn={faqIn} />

        <EmotionSection emotionRef={emotionRef} emotionIn={emotionIn} />

        <CtaSection ctaRef={ctaRef} ctaIn={ctaIn} />

        <LandingFooter />
      </div>
    </>
  );
}
