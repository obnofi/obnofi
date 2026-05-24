import { type TiptapNode, parseInlineMarkdown } from "./inlineParsers";
import {
  TASK_LIST_PATTERN,
  TASK_LIST_ITEM_PATTERN,
  BULLET_LIST_PATTERN,
  ORDERED_LIST_PATTERN,
  BLOCKQUOTE_PATTERN,
  HEADING_PATTERN,
  HORIZONTAL_RULE_PATTERN,
  CODE_FENCE_PATTERN,
  CODE_BLOCK_LANGUAGE_ALIASES,
} from "./patterns";

export function createParagraphNode(text: string): TiptapNode {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return { type: "paragraph" };
  }

  return {
    type: "paragraph",
    content: parseInlineMarkdown(normalizedText),
  };
}

export function isBlockBoundary(line: string) {
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

export function consumeParagraph(lines: string[], startIndex: number) {
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

export function consumeBulletList(lines: string[], startIndex: number) {
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

export function consumeTaskList(lines: string[], startIndex: number) {
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

export function consumeOrderedList(lines: string[], startIndex: number) {
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

export function consumeBlockquote(lines: string[], startIndex: number) {
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

export function consumeCodeBlock(lines: string[], startIndex: number) {
  const openingLine = lines[startIndex];
  const rawLanguage = openingLine.slice(3).trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const language =
    CODE_BLOCK_LANGUAGE_ALIASES[rawLanguage] ?? rawLanguage ?? "plaintext";
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
      attrs: {
        language: language || "plaintext",
        code: codeLines.join("\n"),
        isOpen: true,
      },
    },
    nextIndex: index,
  };
}

export type { TiptapNode };
