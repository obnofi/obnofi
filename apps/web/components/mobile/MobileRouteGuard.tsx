"use client";

import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileNotice } from "./MobileNotice";

/**
 * 모바일에서 허용된 경로:
 *  - `/`            랜딩 페이지
 *  - `/auth/*`      로그인 / 회원가입
 *  - `/workspace`         (리다이렉트 전용)
 *  - `/workspace/{id}`    문서 에디터 (글쓰기)
 *
 * 그 외 모든 경로(설정, 포레스트, 공유, 그래프 등)는 차단한다.
 * `/workspace/{id}` 내부의 문서 외 페이지 타입(canvas/database/mindmap)은
 * WorkspacePageContent에서 별도로 차단한다.
 */
function isPathAllowedOnMobile(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);

  // 랜딩
  if (segments.length === 0) return true;

  // 로그인 / 회원가입
  if (segments[0] === "auth") return true;

  // 워크스페이스 루트 또는 문서 에디터 (서브라우트는 차단)
  if (segments[0] === "workspace" && segments.length <= 2) return true;

  return false;
}

export function MobileRouteGuard({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (isMobile && !isPathAllowedOnMobile(pathname)) {
    return (
      <MobileNotice message="모바일에서는 랜딩, 회원가입, 문서 글쓰기만 지원합니다. 이 화면은 데스크톱에서 이용해 주세요." />
    );
  }

  return <>{children}</>;
}
