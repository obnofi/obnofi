import type { TOCHeading } from "@/hooks/useTOC";

export const HEADING_SELECTOR = "h1, h2, h3";

export function slugifyHeading(text: string) {
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

export function getHeadingLevel(element: Element): 1 | 2 | 3 | null {
  if (element.tagName === "H1") return 1;
  if (element.tagName === "H2") return 2;
  if (element.tagName === "H3") return 3;
  return null;
}

export function getScrollParent(element: HTMLElement | null) {
  if (!element) return null;

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

export function findHeadingElement(container: HTMLElement, headingId: string) {
  const scopedElement = container.querySelector<HTMLElement>(`#${CSS.escape(headingId)}`);
  if (scopedElement) return scopedElement;

  const documentElement = document.getElementById(headingId);
  return documentElement instanceof HTMLElement ? documentElement : null;
}

export function getVisibleHeadingElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(HEADING_SELECTOR)).filter(
    (element) => Boolean(getHeadingLevel(element) && element.textContent?.trim())
  );
}

export function headingsMatch(a: TOCHeading[], b: TOCHeading[]) {
  if (a.length !== b.length) return false;

  return a.every((heading, index) => {
    const nextHeading = b[index];
    return (
      heading.id === nextHeading.id &&
      heading.level === nextHeading.level &&
      heading.text === nextHeading.text
    );
  });
}
