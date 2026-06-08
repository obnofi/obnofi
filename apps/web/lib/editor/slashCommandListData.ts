import type { SlashCommandItem } from "@/components/editor/extensions/SlashCommandExtension";
import { CATEGORIES } from "@/components/editor/extensions/SlashCommandExtension";
import { isVisibleSlashCommandItem } from "@/components/editor/extensions/SlashCommandExtension";

export type GroupConfig = {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  childIds: string[];
};

export const SUBMENU_GROUPS: GroupConfig[] = [
  {
    id: "g-headings",
    category: "basic",
    title: "제목",
    description: "1~6 단계 제목",
    icon: "Heading1",
    childIds: ["h1", "h2", "h3", "h4", "h5", "h6"],
  },
  {
    id: "g-lists",
    category: "basic",
    title: "목록",
    description: "글머리, 번호, 체크박스",
    icon: "List",
    childIds: ["bulletList", "orderedList", "taskList", "toggleList"],
  },
  {
    id: "g-db-views",
    category: "database",
    title: "데이터베이스 보기",
    description: "표, 보드, 갤러리, 캘린더 등",
    icon: "Table2",
    childIds: [
      "dbTable",
      "dbBoard",
      "dbGallery",
      "dbList",
      "dbCalendar",
      "dbTimeline",
    ],
  },
  {
    id: "g-media",
    category: "media",
    title: "미디어",
    description: "이미지, 동영상, 오디오, 파일, 북마크",
    icon: "Image",
    childIds: ["image", "video", "audio", "file", "bookmark"],
  },
  {
    id: "g-toggle-headings",
    category: "advanced",
    title: "토글 제목",
    description: "접을 수 있는 제목",
    icon: "ChevronDown",
    childIds: ["toggleH1", "toggleH2", "toggleH3"],
  },
  {
    id: "g-columns",
    category: "advanced",
    title: "열 레이아웃",
    description: "2열 또는 3열 나란히",
    icon: "Columns2",
    childIds: ["columns2", "columns3"],
  },
  {
    id: "g-templates",
    category: "advanced",
    title: "템플릿",
    description: "회의록, 프로젝트, 주간 양식",
    icon: "LayoutTemplate",
    childIds: ["template-meeting", "template-project", "template-weekly"],
  },
  {
    id: "g-github",
    category: "developer",
    title: "GitHub",
    description: "Repository, Gist, 이슈, PR",
    icon: "GitGraph",
    childIds: ["githubEmbed", "githubGist", "githubIssue", "githubPull"],
  },
  {
    id: "g-embed",
    category: "embed",
    title: "임베드",
    description: "링크, Google Drive, Tweet",
    icon: "Globe",
    childIds: ["embed", "googleDrive", "tweet"],
  },
];

export const HIDDEN_ITEM_IDS = new Set(["template"]);

export type LeafNode = { kind: "leaf"; item: SlashCommandItem };
export type GroupNode = {
  kind: "group";
  group: GroupConfig;
  children: SlashCommandItem[];
};
export type TreeNode = LeafNode | GroupNode;

export type CategorySection = {
  id: string;
  label: string;
  nodes: TreeNode[];
};

export function buildTree(items: SlashCommandItem[]): CategorySection[] {
  const result: CategorySection[] = [];
  for (const cat of CATEGORIES) {
    const catItems = items.filter(
      (it) =>
        it.category === cat.id &&
        !HIDDEN_ITEM_IDS.has(it.id) &&
        isVisibleSlashCommandItem(it)
    );
    if (catItems.length === 0) continue;

    const catGroups = SUBMENU_GROUPS.filter((g) => g.category === cat.id);
    const childToGroup = new Map<string, GroupConfig>();
    for (const g of catGroups) {
      for (const cid of g.childIds) childToGroup.set(cid, g);
    }

    const emitted = new Set<string>();
    const nodes: TreeNode[] = [];
    for (const item of catItems) {
      const group = childToGroup.get(item.id);
      if (group) {
        if (!emitted.has(group.id)) {
          const children = group.childIds
            .map((cid) => catItems.find((it) => it.id === cid))
            .filter((x): x is SlashCommandItem => Boolean(x));
          nodes.push({ kind: "group", group, children });
          emitted.add(group.id);
        }
        continue;
      }
      nodes.push({ kind: "leaf", item });
    }

    if (nodes.length > 0) {
      result.push({ id: cat.id, label: cat.label, nodes });
    }
  }
  return result;
}

export function buildFlat(items: SlashCommandItem[]): CategorySection[] {
  const result: CategorySection[] = [];
  for (const cat of CATEGORIES) {
    const catItems = items.filter(
      (it) => it.category === cat.id && !HIDDEN_ITEM_IDS.has(it.id)
    );
    if (catItems.length === 0) continue;
    result.push({
      id: cat.id,
      label: cat.label,
      nodes: catItems.map((item) => ({ kind: "leaf" as const, item })),
    });
  }
  return result;
}
