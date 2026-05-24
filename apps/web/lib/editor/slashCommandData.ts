import { slashCommands } from "@/lib/editor/slashCommandItems";

export type { SlashCommandItem, SlashCommandCategory } from "@/lib/editor/slashCommandTypes";
export { slashCommands } from "@/lib/editor/slashCommandItems";

export const SUPPORTED_BASIC_MARKDOWN_COMMAND_IDS = new Set([
  "text",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "divider",
]);

export const CATEGORIES = [
  { id: "basic", label: "기본 블록" },
  { id: "media", label: "미디어" },
  { id: "code", label: "코드" },
  { id: "database", label: "데이터베이스" },
  { id: "canvas", label: "캔버스 / 그래프" },
  { id: "developer", label: "개발자 특화" },
  { id: "advanced", label: "고급 블록" },
  { id: "page", label: "페이지" },
  { id: "embed", label: "임베드" },
  { id: "inline", label: "인라인" },
];

export function isVisibleSlashCommandItem(item: { id: string; category: string }): boolean {
  if (item.category !== "basic") {
    return true;
  }

  return SUPPORTED_BASIC_MARKDOWN_COMMAND_IDS.has(item.id);
}

export function getSlashCommandItems(query: string) {
  const q = query.toLowerCase().trim();
  const visibleItems = slashCommands.filter(isVisibleSlashCommandItem);

  if (!q) return visibleItems;

  return visibleItems.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.keywords?.some((kw) => kw.includes(q))
  );
}
