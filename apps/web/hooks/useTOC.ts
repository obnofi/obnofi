"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface TOCHeading {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

interface UseTOCResult {
  activeHeadingId: string | null;
  headings: TOCHeading[];
  scrollToHeading: (headingId: string) => void;
}

const HEADING_SELECTOR = "h1, h2, h3";

function slugifyHeading(text: string) {
  const slug = text
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "section";
}

function getHeadingLevel(element: Element): 1 | 2 | 3 | null {
  if (element.tagName === "H1") return 1;
  if (element.tagName === "H2") return 2;
  if (element.tagName === "H3") return 3;
  return null;
}

function getScrollParent(element: HTMLElement | null) {
  if (!element) {
    return null;
  }

  let current = element.parentElement;

  while (current) {
    const styles = window.getComputedStyle(current);
    const overflowY = styles.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function findHeadingElement(container: HTMLElement, headingId: string) {
  const scopedElement = container.querySelector<HTMLElement>(
    `#${CSS.escape(headingId)}`
  );

  if (scopedElement) {
    return scopedElement;
  }

  const documentElement = document.getElementById(headingId);
  return documentElement instanceof HTMLElement ? documentElement : null;
}

function getVisibleHeadingElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(HEADING_SELECTOR)).filter(
    (element) => Boolean(getHeadingLevel(element) && element.textContent?.trim())
  );
}

function headingsMatch(a: TOCHeading[], b: TOCHeading[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((heading, index) => {
    const nextHeading = b[index];
    return (
      heading.id === nextHeading.id &&
      heading.level === nextHeading.level &&
      heading.text === nextHeading.text
    );
  });
}

export function useTOC(container: HTMLElement | null): UseTOCResult {
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!container) {
      setHeadings([]);
      setActiveHeadingId(null);
      return;
    }

    const collectHeadings = () => {
      const headingElements = Array.from(
        container.querySelectorAll<HTMLElement>(HEADING_SELECTOR)
      );

      const idCounts = new Map<string, number>();
      const nextHeadings: TOCHeading[] = headingElements.flatMap((element) => {
        const level = getHeadingLevel(element);
        const text = element.textContent?.trim() ?? "";

        if (!level || !text) {
          return [];
        }

        if (!element.id) {
          const baseId = slugifyHeading(text);
          const duplicateCount = idCounts.get(baseId) ?? 0;
          const nextId = duplicateCount === 0 ? baseId : `${baseId}-${duplicateCount + 1}`;
          idCounts.set(baseId, duplicateCount + 1);
          element.id = nextId;
        }

        return [{ id: element.id, level, text }];
      });

      setHeadings((currentHeadings) =>
        headingsMatch(currentHeadings, nextHeadings)
          ? currentHeadings
          : nextHeadings
      );
      setActiveHeadingId((currentId) => {
        if (nextHeadings.length === 0) {
          return currentId === null ? currentId : null;
        }

        return nextHeadings.some((heading) => heading.id === currentId)
          ? currentId
          : nextHeadings[0].id;
      });
    };

    collectHeadings();

    const scheduleCollectHeadings = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        collectHeadings();
      });
    };

    const mutationObserver = new MutationObserver(() => {
      scheduleCollectHeadings();
    });

    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      // 스타일 변경으로 인한 스크롤 방지를 위해 attributes 감시 제한
      attributeFilter: ["id"],
    });

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      mutationObserver.disconnect();
    };
  }, [container]);

  useEffect(() => {
    if (!container || headings.length === 0) {
      setActiveHeadingId(null);
      return;
    }

    const currentHeadingElements = getVisibleHeadingElements(container);
    const headingElements = headings
      .map((heading, index) => {
        const element = findHeadingElement(container, heading.id);
        return element ?? currentHeadingElements[index] ?? null;
      })
      .filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (headingElements.length === 0) {
      setActiveHeadingId(null);
      return;
    }

    const scrollParent = getScrollParent(container);
    const root = scrollParent ?? null;

    const updateActiveHeading = () => {
      const rootTop = root?.getBoundingClientRect().top ?? 0;
      const threshold = rootTop + 120;

      let nextActiveId = headingElements[0]?.id ?? null;

      for (const element of headingElements) {
        if (element.getBoundingClientRect().top <= threshold) {
          nextActiveId = element.id;
        } else {
          break;
        }
      }

      setActiveHeadingId(nextActiveId);
    };

    updateActiveHeading();

    const intersectionObserver = new IntersectionObserver(
      () => {
        updateActiveHeading();
      },
      {
        root,
        rootMargin: "-96px 0px -65% 0px",
        threshold: [0, 1],
      }
    );

    headingElements.forEach((element) => {
      intersectionObserver.observe(element);
    });

    return () => {
      intersectionObserver.disconnect();
    };
  }, [container, headings]);

  const scrollToHeading = useMemo(() => {
    return (headingId: string) => {
      if (!container) {
        return;
      }

      const headingIndex = headings.findIndex(
        (heading) => heading.id === headingId
      );
      const headingElement =
        findHeadingElement(container, headingId) ??
        (headingIndex >= 0
          ? getVisibleHeadingElements(container)[headingIndex] ?? null
          : null);
      if (!headingElement) {
        return;
      }

      if (!headingElement.id) {
        headingElement.id = headingId;
      }

      const scrollParent = getScrollParent(container);
      const scrollOffset = 96;

      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const headingRect = headingElement.getBoundingClientRect();
        const nextTop =
          headingRect.top - parentRect.top + scrollParent.scrollTop - scrollOffset;

        scrollParent.scrollTo({
          top: Math.max(0, nextTop),
          behavior: "smooth",
        });
        setActiveHeadingId(headingId);
        return;
      }

      window.scrollTo({
        top: Math.max(
          0,
          headingElement.getBoundingClientRect().top + window.scrollY - scrollOffset
        ),
        behavior: "smooth",
      });
      setActiveHeadingId(headingId);
    };
  }, [container, headings]);

  return useMemo(
    () => ({
      activeHeadingId,
      headings,
      scrollToHeading,
    }),
    [activeHeadingId, headings, scrollToHeading]
  );
}
