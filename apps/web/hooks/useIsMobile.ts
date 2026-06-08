"use client";

import { useEffect, useState } from "react";

/**
 * 모바일 여부 판별 훅.
 * 화면 너비 < `breakpoint`(기본 768px)면 모바일로 간주한다.
 * SSR/초기 렌더에서는 false를 반환하고, 마운트 후 실제 너비로 동기화한다.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
