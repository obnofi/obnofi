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
    return (
      <span className={className}>
        <span className={emojiClassName}>{page.icon}</span>
      </span>
    );
  }

  const Icon = glyphByType[page?.type ?? "document"];
  return <Icon className={typeClassName ?? className} />;
}
