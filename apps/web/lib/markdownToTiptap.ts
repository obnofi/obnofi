import { normalizeTiptapDocument } from "@/lib/normalizeTiptapDocument";

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

const MAX_MARKDOWN_SOURCE_CHARS = 160_000;
const MAX_MARKDOWN_SOURCE_LINES = 4_000;
const TASK_LIST_PATTERN = /^[ ]{0,3}[-*+]\s+\[(?: |x|X)\](?:\s+.*)?$/;
const TASK_LIST_ITEM_PATTERN = /^[ ]{0,3}[-*+]\s+\[( |x|X)\](?:\s+(.*))?$/;
const BULLET_LIST_PATTERN = /^[ ]{0,3}[-*+]\s+(?!\[(?: |x|X)\](?:\s|$))(.*)$/;
const ORDERED_LIST_PATTERN = /^[ ]{0,3}\d+\.\s+(.*)$/;
const BLOCKQUOTE_PATTERN = /^[ ]{0,3}>\s?(.*)$/;
const HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;
const HORIZONTAL_RULE_PATTERN = /^(?:---|\*\*\*|___)\s*$/;
const CODE_FENCE_PATTERN = /^```/;

function clampMarkdownSource(markdown: string) {
  const normalized = markdown.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return normalized;
  }

  const truncatedByChars =
    normalized.length > MAX_MARKDOWN_SOURCE_CHARS
      ? normalized.slice(0, MAX_MARKDOWN_SOURCE_CHARS)
      : normalized;

  const lines = truncatedByChars.split("\n");
  if (lines.length <= MAX_MARKDOWN_SOURCE_LINES) {
    return truncatedByChars;
  }

  return lines.slice(0, MAX_MARKDOWN_SOURCE_LINES).join("\n");
}

function createTextNode(text: string): TiptapNode {
  return { type: "text", text };
}

function appendMark(
  nodes: TiptapNode[],
  mark: { type: string; attrs?: Record<string, unknown> }
) {
  return nodes.map((node) =>
    node.type === "text"
      ? { ...node, marks: [...(node.marks ?? []), mark] }
      : node
  );
}

function findNextInlineMatch(text: string) {
  const patterns = [
    { type: "code", regex: /`([^`\n]+)`/ },
    { type: "bold", regex: /\*\*([^*\n]+)\*\*|__([^_\n]+)__/ },
    { type: "strike", regex: /~~([^~\n]+)~~/ },
    { type: "italic", regex: /\*([^*\n]+)\*|_([^_\n]+)_/ },
  ] as const;

  let bestMatch:
    | {
        type: (typeof patterns)[number]["type"];
        match: RegExpMatchArray;
      }
    | null = null;

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (!match || typeof match.index !== "number") {
      continue;
    }

    if (!bestMatch || match.index < (bestMatch.match.index ?? Number.MAX_SAFE_INTEGER)) {
      bestMatch = { type: pattern.type, match };
    }
  }

  return bestMatch;
}

function parseInlineMarkdown(text: string): TiptapNode[] {
  if (!text) {
    return [];
  }

  const nextMatch = findNextInlineMatch(text);
  if (!nextMatch) {
    return [createTextNode(text)];
  }

  const startIndex = nextMatch.match.index ?? 0;
  const fullMatch = nextMatch.match[0];
  const innerText =
    nextMatch.match[1] ?? nextMatch.match[2] ?? "";
  const nodes: TiptapNode[] = [];

  if (startIndex > 0) {
    nodes.push(createTextNode(text.slice(0, startIndex)));
  }

  if (innerText) {
    const inlineNodes = parseInlineMarkdown(innerText);
    const markType =
      nextMatch.type === "code"
        ? "code"
        : nextMatch.type === "bold"
          ? "bold"
          : nextMatch.type === "strike"
            ? "strike"
            : "italic";

    nodes.push(...appendMark(inlineNodes, { type: markType }));
  } else {
    nodes.push(createTextNode(fullMatch));
  }

  const remainingText = text.slice(startIndex + fullMatch.length);
  if (remainingText) {
    nodes.push(...parseInlineMarkdown(remainingText));
  }

  return nodes;
}

function createParagraphNode(text: string): TiptapNode {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return { type: "paragraph" };
  }

  return {
    type: "paragraph",
    content: parseInlineMarkdown(normalizedText),
  };
}

function isBlockBoundary(line: string) {
  return (
    HEADING_PATTERN.test(line) ||
    TASK_LIST_PATTERN.test(line) ||
    BULLET_LIST_PATTERN.test(line) ||
    ORDERED_LIST_PATTERN.test(line) ||
    BLOCKQUOTE_PATTERN.test(line) ||
    HORIZONTAL_RULE_PATTERN.test(line) ||
    CODE_FENCE_PATTERN.test(line)
  );
}

function consumeParagraph(lines: string[], startIndex: number) {
  const paragraphLines: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      break;
    }
    if (index !== startIndex && isBlockBoundary(line)) {
      break;
    }
    paragraphLines.push(line.trim());
    index += 1;
  }

  return {
    node: createParagraphNode(paragraphLines.join(" ")),
    nextIndex: index,
  };
}

function consumeBulletList(lines: string[], startIndex: number) {
  const items: TiptapNode[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(BULLET_LIST_PATTERN);
    if (!match) {
      break;
    }

    items.push({
      type: "listItem",
      content: [createParagraphNode(match[1])],
    });
    index += 1;
  }

  return {
    node: { type: "bulletList", content: items },
    nextIndex: index,
  };
}

function consumeTaskList(lines: string[], startIndex: number) {
  const items: TiptapNode[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(TASK_LIST_ITEM_PATTERN);
    if (!match) {
      break;
    }

    items.push({
      type: "taskItem",
      attrs: { checked: match[1].toLowerCase() === "x" },
      content: [createParagraphNode(match[2] ?? "")],
    });
    index += 1;
  }

  return {
    node: { type: "taskList", content: items },
    nextIndex: index,
  };
}

function consumeOrderedList(lines: string[], startIndex: number) {
  const items: TiptapNode[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(ORDERED_LIST_PATTERN);
    if (!match) {
      break;
    }

    items.push({
      type: "listItem",
      content: [createParagraphNode(match[1])],
    });
    index += 1;
  }

  return {
    node: { type: "orderedList", content: items },
    nextIndex: index,
  };
}

function consumeBlockquote(lines: string[], startIndex: number) {
  const quotedLines: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(BLOCKQUOTE_PATTERN);
    if (!match) {
      break;
    }
    quotedLines.push(match[1]);
    index += 1;
  }

  return {
    node: {
      type: "blockquote",
      content: [createParagraphNode(quotedLines.join(" "))],
    },
    nextIndex: index,
  };
}

function consumeCodeBlock(lines: string[], startIndex: number) {
  const openingLine = lines[startIndex];
  const language = openingLine.slice(3).trim();
  const codeLines: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length && !lines[index].startsWith("```")) {
    codeLines.push(lines[index]);
    index += 1;
  }

  if (index < lines.length && lines[index].startsWith("```")) {
    index += 1;
  }

  return {
    node: {
      type: "codeBlock",
      attrs: { language: language || null },
      content: [createTextNode(codeLines.join("\n"))],
    },
    nextIndex: index,
  };
}

export function markdownToTiptap(markdown: string): object {
  const normalized = clampMarkdownSource(markdown);
  if (!normalized) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const lines = normalized.split("\n");
  const content: TiptapNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (CODE_FENCE_PATTERN.test(trimmedLine)) {
      const result = consumeCodeBlock(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (HORIZONTAL_RULE_PATTERN.test(trimmedLine)) {
      content.push({ type: "horizontalRule" });
      index += 1;
      continue;
    }

    const headingMatch = trimmedLine.match(HEADING_PATTERN);
    if (headingMatch) {
      content.push({
        type: "heading",
        attrs: { level: headingMatch[1].length },
        content: parseInlineMarkdown(headingMatch[2].trim()),
      });
      index += 1;
      continue;
    }

    // Block parsers are checked in explicit priority order so overlapping regexes stay predictable.
    if (TASK_LIST_PATTERN.test(line)) {
      const result = consumeTaskList(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (BULLET_LIST_PATTERN.test(line)) {
      const result = consumeBulletList(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (ORDERED_LIST_PATTERN.test(line)) {
      const result = consumeOrderedList(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    if (BLOCKQUOTE_PATTERN.test(line)) {
      const result = consumeBlockquote(lines, index);
      content.push(result.node);
      index = result.nextIndex;
      continue;
    }

    const result = consumeParagraph(lines, index);
    content.push(result.node);
    index = result.nextIndex;
  }

  return normalizeTiptapDocument({
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  });
}
