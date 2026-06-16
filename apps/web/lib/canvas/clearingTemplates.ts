import type { Element } from "@obnofi/types/clearing";

export type ClearingTemplateId =
  | "brainstorm"
  | "agenda"
  | "flowchart"
  | "bug-bash"
  | "design-crit"
  | "user-journey"
  | "retrospective";

export const CLEARING_TEMPLATES: { id: ClearingTemplateId; label: string; accent: string }[] = [
  { id: "brainstorm", label: "Brainstorm", accent: "sun" },
  { id: "agenda", label: "Agenda", accent: "sky" },
  { id: "flowchart", label: "Flowchart", accent: "fern" },
  { id: "bug-bash", label: "Bug bash", accent: "rose" },
  { id: "design-crit", label: "Design crit", accent: "mist" },
  { id: "user-journey", label: "User journey", accent: "sky" },
  { id: "retrospective", label: "Retrospective", accent: "fern" },
];

type TemplateElementSeed = Omit<Element, "id" | "roomId" | "createdBy" | "createdAt" | "updatedAt" | "zIndex">;

function stampTemplateElements(
  seeds: TemplateElementSeed[],
  roomId: string,
  userId: string,
  zIndexStart: number
): Element[] {
  const timestamp = new Date().toISOString();
  return seeds.map((seed, index) => ({
    ...seed,
    id: crypto.randomUUID(),
    roomId,
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    zIndex: zIndexStart + index,
  } as Element));
}

const sectionBase = {
  rotation: 0,
  style: { color: "fern", opacity: 1 },
} as const;

export function buildClearingTemplateElements(
  templateId: ClearingTemplateId,
  roomId: string,
  userId: string,
  zIndexStart: number,
  origin = { x: 560, y: 280 }
): Element[] {
  const x = origin.x;
  const y = origin.y;

  const templates: Record<ClearingTemplateId, TemplateElementSeed[]> = {
    brainstorm: [
      { ...sectionBase, type: "section", x, y, width: 880, height: 520, content: { kind: "section", title: "Brainstorm", background: "rgba(46,125,69,0.08)" } },
      ...["Ideas", "Risks", "Next"].map((text, index) => ({
        type: "sticky" as const,
        x: x + 56 + index * 280,
        y: y + 96,
        width: 220,
        height: 180,
        rotation: 0,
        style: { color: index === 1 ? "rose" : "sun", opacity: 1 },
        content: { kind: "sticky" as const, text, tone: index === 1 ? "rose" as const : "sun" as const },
      })),
      { type: "text", x: x + 56, y: y + 340, width: 520, height: 64, rotation: 0, style: { color: "ink", opacity: 1 }, content: { kind: "text", text: "Cluster, vote, then pick one seed to grow.", fontSize: 26, align: "left", weight: 600 } },
    ],
    agenda: [
      { ...sectionBase, type: "section", x, y, width: 760, height: 500, content: { kind: "section", title: "Agenda", background: "rgba(51,126,169,0.08)" } },
      ...["Context", "Discussion", "Decision", "Actions"].map((text, index) => ({
        type: "shape" as const,
        x: x + 64,
        y: y + 80 + index * 92,
        width: 560,
        height: 56,
        rotation: 0,
        style: { color: "sky", strokeWidth: 2, opacity: 1 },
        content: { kind: "shape" as const, shape: "rectangle" as const, fill: "mist", label: text },
      })),
    ],
    flowchart: [
      { ...sectionBase, type: "section", x, y, width: 920, height: 420, content: { kind: "section", title: "Flowchart", background: "rgba(46,125,69,0.08)" } },
      ...["Start", "Choice", "Outcome"].map((text, index) => ({
        type: "shape" as const,
        x: x + 72 + index * 280,
        y: y + 140,
        width: 170,
        height: 92,
        rotation: 0,
        style: { color: "fern", strokeWidth: 2, opacity: 1 },
        content: { kind: "shape" as const, shape: index === 1 ? "diamond" as const : "rectangle" as const, fill: "mist", label: text },
      })),
      { type: "connector", x: 0, y: 0, width: 0, height: 0, rotation: 0, style: { color: "fern", strokeWidth: 2, opacity: 1 }, content: { kind: "connector", start: { x: x + 242, y: y + 186 }, end: { x: x + 352, y: y + 186 }, arrowStart: false, arrowEnd: true, lineStyle: "solid" } },
      { type: "connector", x: 0, y: 0, width: 0, height: 0, rotation: 0, style: { color: "fern", strokeWidth: 2, opacity: 1 }, content: { kind: "connector", start: { x: x + 522, y: y + 186 }, end: { x: x + 632, y: y + 186 }, arrowStart: false, arrowEnd: true, lineStyle: "solid" } },
    ],
    "bug-bash": [
      { ...sectionBase, type: "section", x, y, width: 860, height: 500, content: { kind: "section", title: "Bug bash", background: "rgba(212,76,71,0.08)" } },
      ...["Repro", "Impact", "Owner"].map((text, index) => ({
        type: "sticky" as const,
        x: x + 64 + index * 260,
        y: y + 112,
        width: 220,
        height: 190,
        rotation: 0,
        style: { color: index === 0 ? "rose" : "sun", opacity: 1 },
        content: { kind: "sticky" as const, text, tone: index === 0 ? "rose" as const : "sun" as const },
      })),
    ],
    "design-crit": [
      { ...sectionBase, type: "section", x, y, width: 900, height: 520, content: { kind: "section", title: "Design crit", background: "rgba(199,198,196,0.16)" } },
      ...["What works", "Questions", "Change"].map((text, index) => ({
        type: "shape" as const,
        x: x + 64 + index * 270,
        y: y + 116,
        width: 220,
        height: 240,
        rotation: 0,
        style: { color: "ink", strokeWidth: 2, opacity: 1 },
        content: { kind: "shape" as const, shape: "rectangle" as const, fill: "mist", label: text },
      })),
    ],
    "user-journey": [
      { ...sectionBase, type: "section", x, y, width: 980, height: 440, content: { kind: "section", title: "User journey", background: "rgba(51,126,169,0.08)" } },
      ...["Discover", "Try", "Commit", "Return"].map((text, index) => ({
        type: "vine" as const,
        x: x + 64 + index * 220,
        y: y + 156,
        width: 170,
        height: 72,
        rotation: 0,
        style: { color: "sky", opacity: 1 },
        content: { kind: "vine" as const, text, fontSize: 20, weight: 600 as const, fill: "mist" },
      })),
    ],
    retrospective: [
      { ...sectionBase, type: "section", x, y, width: 900, height: 520, content: { kind: "section", title: "Retrospective", background: "rgba(46,125,69,0.08)" } },
      ...["Keep", "Improve", "Try"].map((text, index) => ({
        type: "sticky" as const,
        x: x + 72 + index * 270,
        y: y + 112,
        width: 220,
        height: 220,
        rotation: 0,
        style: { color: index === 1 ? "sky" : "sun", opacity: 1 },
        content: { kind: "sticky" as const, text, tone: index === 1 ? "sky" as const : "sun" as const },
      })),
    ],
  };

  return stampTemplateElements(templates[templateId], roomId, userId, zIndexStart);
}
