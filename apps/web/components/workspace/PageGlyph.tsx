import type { Page, PageType } from "@obnofi/types";
import { Database, FileText, Palette } from "lucide-react";

interface PageGlyphProps {
  page?: Pick<Page, "icon" | "type"> | null;
  className?: string;
  emojiClassName?: string;
  typeClassName?: string;
}

const glyphByType: Record<PageType, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  canvas: Palette,
  database: Database,
};

export function PageGlyph({
  page,
  className,
  emojiClassName,
  typeClassName,
}: PageGlyphProps) {
  if (page?.icon) {
    if (page.icon.startsWith("http") || page.icon.startsWith("data:")) {
      return (
        <span className={className}>
          <img
            src={page.icon}
            alt="페이지 아이콘"
            className={emojiClassName}
          />
        </span>
      );
    }

    return (
      <span className={className}>
        <span className={emojiClassName}>{page.icon}</span>
      </span>
    );
  }

  const Icon = glyphByType[page?.type ?? "document"];
  return <Icon className={typeClassName ?? className} />;
}
