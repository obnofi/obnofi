"use client";

import Link from "next/link";
import {

  FileText,
  Database,
  Layers,

  LayoutGrid,
  PenTool,
} from "lucide-react";
import { SiteLogo } from "@/components/branding/SiteLogo";
import { FeatureCard, FAQItem } from "@/components/landing/LandingCards";

export const LANDING_STYLES = `
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
  @keyframes orb-4 {
    0%,100% { transform: translate(0px,   0px)  scale(1);   }
    60%      { transform: translate(-20px,-30px) scale(1.06); }
  }
  @keyframes float-mockup {
    0%,100% { transform: translateY(0px);   }
    50%      { transform: translateY(-18px); }
  }
  @keyframes shimmer-text {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes cursor-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  @keyframes sticky-float-1 {
    0%,100% { transform: translateY(0px)   rotate(-2deg); }
    50%      { transform: translateY(-8px)  rotate(-1deg); }
  }
  @keyframes sticky-float-2 {
    0%,100% { transform: translateY(0px)  rotate(1.5deg); }
    50%      { transform: translateY(-6px) rotate(2.5deg); }
  }
  @keyframes sticky-float-3 {
    0%,100% { transform: translateY(0px)   rotate(-1deg); }
    50%      { transform: translateY(-10px) rotate(0deg);  }
  }
  @keyframes marquee-left {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .reveal {
    opacity: 0;
    transform: translateY(40px);
    filter: blur(4px);
    transition: opacity 0.8s ease, transform 0.8s ease, filter 0.8s ease;
  }
  .reveal.in {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.22s; }
  .reveal-delay-3 { transition-delay: 0.36s; }
  .reveal-delay-4 { transition-delay: 0.52s; }
`;

export const FEATURE_TAGS = [
  "블록 기반 편집",
  "슬래시 커맨드",
  "AI 보조 작성",
  "음성 입력 (Parrot)",
  "무한 캔버스",
  "6가지 DB 뷰",
  "그래프 뷰",
  "공개 링크 공유",
  "다크 / 라이트 / 정글 테마",
  "위키 링크",
  "URL 가져오기",
  "Forest 피드 발행",
];

export function LandingNav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 py-3.5"
      style={{ background: "rgba(12,24,16,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <img src="/obnofidarkmodelogo.png" alt="Obnofi" style={{ height: "28px", width: "auto" }} />
      <Link href="/auth/signin" className="text-sm font-semibold px-5 py-2 rounded-lg" style={{ color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.15)" }}>
        로그인
      </Link>
    </nav>
  );
}

interface HowItWorksSectionProps {
  howRef: React.Ref<HTMLDivElement>;
  howIn: boolean;
}

export function HowItWorksSection({ howRef, howIn }: HowItWorksSectionProps) {
  const steps = [
    { num: "01", title: "씨앗을 심으세요", desc: "새 페이지를 만들고 블록과 슬래시 커맨드로 자유롭게 작성하세요. AI 보조 작성과 음성 입력(Parrot)으로 더 빠르게.", icon: <FileText size={20} /> },
    { num: "02", title: "구조로 엮으세요", desc: "데이터베이스, 무한 캔버스, 그래프 뷰로 흩어진 생각을 연결하고 한눈에 정리하세요.", icon: <LayoutGrid size={20} /> },
    { num: "03", title: "세상에 꺼내세요", desc: "공개 링크로 페이지를 공유하고, Forest 피드에 발행해 나만의 지식을 세상과 나누세요.", icon: <Layers size={20} /> },
  ];

  return (
    <section style={{ background: "#FFFFFF" }}>
      <div ref={howRef} className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className={`pt-20 pb-14 text-center reveal${howIn ? " in" : ""}`}>
          <p className="text-sm mb-4" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>이용 방법</p>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", letterSpacing: "-0.04em", color: "#111111", fontWeight: 800 }}>
            아이디어를 한곳에서 완성하세요
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 pb-20">
          {steps.map((step, i) => (
            <div key={step.num} className={`reveal${howIn ? " in" : ""}`} style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="mb-4">
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: "#E8F5EC", color: "#2E7D45" }}>{step.num}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#E8F5EC", color: "#2E7D45" }}>
                {step.icon}
              </div>
              <h3 className="font-bold text-xl mb-3" style={{ color: "#1A1A1A" }}>{step.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: "#787774" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesGridSection() {
  return (
    <section style={{ background: "#F7F7F5", padding: "80px 0" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <p className="text-sm mb-3" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>기능</p>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", letterSpacing: "-0.04em", color: "#111111", fontWeight: 800 }}>생각의 모양에 따라 골라 쓰세요</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard icon={<FileText size={20} />} title="글로 쓰기" description="블록 에디터로 자유롭게. 제목, 목록, 코드 블록까지." />
          <FeatureCard icon={<PenTool size={20} />} title="펼쳐서 그리기" description="무한 캔버스에 마음대로 그리고 붙이세요." />
          <FeatureCard icon={<Database size={20} />} title="연결 보기" description="내 글들이 어떻게 이어지는지 한눈에." />
          <FeatureCard icon={<Layers size={20} />} title="발행하기" description="공개 링크와 Forest 피드로 지식을 세상에." />
        </div>
      </div>
    </section>
  );
}

interface ProblemSectionProps {
  problemRef: React.Ref<HTMLDivElement>;
  problemIn: boolean;
}

export function ProblemSection({ problemRef, problemIn }: ProblemSectionProps) {
  return (
    <section style={{ background: "#FFFFFF", padding: "140px 0" }}>
      <div ref={problemRef} className={`max-w-3xl mx-auto px-6 lg:px-12 text-center reveal${problemIn ? " in" : ""}`}>
        <p className="text-sm mb-4" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>왜 Obnofi인가</p>
        <h2 className="font-bold mb-6" style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#1A1A1A" }}>
          탭이 몇 개 열려 있나요?
        </h2>
        <p className="text-lg leading-relaxed mx-auto" style={{ color: "#787774", maxWidth: "52ch" }}>
          메모는 여기, 할 일은 저기, 아이디어 스케치는 또 다른 앱에. 생각이 정리되기 전에 도구 사이에서 길을 잃습니다. Obnofi는 그 흐름을 끊지 않습니다.
        </p>
      </div>
    </section>
  );
}

interface EmotionSectionProps {
  emotionRef: React.Ref<HTMLDivElement>;
  emotionIn: boolean;
}

export function EmotionSection({ emotionRef, emotionIn }: EmotionSectionProps) {
  return (
    <section style={{ background: "linear-gradient(160deg, #1F3D2A 0%, #2E7D45 100%)", padding: "100px 0" }}>
      <div ref={emotionRef} className={`max-w-3xl mx-auto px-6 lg:px-12 text-center reveal${emotionIn ? " in" : ""}`}>
        <h2 className="mb-5" style={{ fontSize: "clamp(32px, 4.5vw, 56px)", letterSpacing: "-0.05em", color: "#FFFFFF", lineHeight: 1.2, fontWeight: 800 }}>
          기억은 흐릿해지지만,<br />기록은 남습니다.
        </h2>
        <p className="text-lg" style={{ color: "rgba(255,252,237,0.7)" }}>
          지금 드는 생각, 일단 여기에 두세요.
        </p>
      </div>
    </section>
  );
}


export function FeaturesMarqueeSection() {
  return (
    <section style={{ background: "#2E7D45", overflow: "hidden", padding: "64px 0" }}>
      <p className="text-xs font-semibold text-center mb-10" style={{ color: "rgba(255,252,237,0.5)", letterSpacing: "0.14em" }}>기능</p>
      <div style={{ maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
        <div className="flex gap-5 flex-shrink-0" style={{ animation: "marquee-left 36s linear infinite" }}>
          {[...FEATURE_TAGS, ...FEATURE_TAGS].map((tag, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-7 py-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,252,237,0.16)", color: "#FFFCED", fontSize: "16px", fontWeight: 500, whiteSpace: "nowrap" }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface FaqSectionProps {
  faqRef: React.Ref<HTMLDivElement>;
  faqIn: boolean;
}

export function FaqSection({ faqRef, faqIn }: FaqSectionProps) {
  return (
    <section style={{ background: "#FFFFFF", padding: "80px 0" }}>
      <div ref={faqRef} className="max-w-3xl mx-auto px-6 lg:px-12">
        <div className={`text-center mb-16 reveal${faqIn ? " in" : ""}`}>
          <p className="text-sm mb-4" style={{ color: "#2E7D45", letterSpacing: "0.12em", fontWeight: 600 }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", letterSpacing: "-0.04em", color: "#111111", fontWeight: 800 }}>자주 묻는 질문</h2>
        </div>
        <div className={`reveal${faqIn ? " in" : ""}`}>
          <FAQItem question="데이터 소유권은 어떻게 되나요?" answer="데이터는 완전히 당신의 것입니다. 페이지와 데이터베이스를 언제든지 내보낼 수 있습니다. 종속 없이 콘텐츠에 항상 접근하고 이동할 수 있습니다." />
          <FAQItem question="어떤 보안 조치가 있나요?" answer="인증된 사용자만 자신의 워크스페이스에 접근할 수 있으며, 모든 통신은 HTTPS로 암호화됩니다. 페이지는 직접 공개 링크로 공유하기 전까지 비공개로 유지됩니다." />
          <FAQItem question="Obnofi는 Notion과 어떻게 다른가요?" answer="Notion이 문서와 데이터베이스에 집중하는 반면, Obnofi는 FigJam 스타일 캔버스와 Obsidian 스타일 그래프 뷰를 하나의 워크스페이스에서 제공합니다. 메모, 시각화, 데이터베이스를 오가며 생각의 흐름을 끊지 않는 것이 핵심입니다." />
          <FAQItem question="어떤 지원을 받을 수 있나요?" answer="문서와 커뮤니티를 통해 도움을 받을 수 있습니다. 워크스페이스 안에서 AI 채팅(Owl)으로 작성과 편집에 대한 도움도 바로 받을 수 있습니다." />
        </div>
      </div>
    </section>
  );
}

interface CtaSectionProps {
  ctaRef: React.Ref<HTMLDivElement>;
  ctaIn: boolean;
}

export function CtaSection({ ctaRef, ctaIn }: CtaSectionProps) {
  return (
    <section className="relative" style={{ background: "#F7F7F5", overflow: "hidden", display: "flex", alignItems: "center" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(46,125,69,0.07) 0%, transparent 70%)" }} />
      <div
        ref={ctaRef}
        className={`relative z-10 max-w-2xl mx-auto px-6 lg:px-12 py-20 text-center w-full reveal${ctaIn ? " in" : ""}`}
      >
        <h2 className="mb-5" style={{ fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.05em", color: "#111111", fontWeight: 800 }}>
          나만의 두 번째 뇌를<br />만들어보세요.
        </h2>
        <p className="text-lg mb-10" style={{ color: "rgba(55,53,47,0.5)" }}>지금 바로 시작하세요.</p>
        <Link href="/auth/signin" className="inline-flex items-center gap-2 font-semibold px-9 py-4 rounded-xl text-white" style={{ background: "#2E7D45", fontSize: "16px" }}>
          사용하기
        </Link>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="px-6 lg:px-12 py-10" style={{ background: "#FFFFFF", borderTop: "1px solid #E3E2E0" }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <SiteLogo className="h-auto w-[90px]" />
        <div className="flex items-center gap-6">
          <Link href="/auth/signin" className="text-sm" style={{ color: "#787774" }}>개인정보처리방침</Link>
          <Link href="/auth/signin" className="text-sm" style={{ color: "#787774" }}>이용약관</Link>
          <Link href="/auth/signin" className="text-sm" style={{ color: "#787774" }}>문의하기</Link>
        </div>
        <p className="text-sm" style={{ color: "#787774" }}>© 2025 Obnofi</p>
      </div>
    </footer>
  );
}
