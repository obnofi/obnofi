"use client";

import { InputRule, mergeAttributes, Node } from "@tiptap/core";
import type { InputRuleFinder } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import type { NodeViewProps } from "@tiptap/react";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";

type TaskItemAttrs = {
  checked?: boolean;
};

const taskListInputRuleMatcher: InputRuleFinder = (text) => {
  const match = text.match(/^\s*(?:[-+*]\s+)?\[( |x|X)\]\s?(.*)$/);

  if (!match || typeof match.index !== "number") {
    return null;
  }

  return {
    index: match.index,
    text: match[0],
  };
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    taskList: {
      toggleTaskList: () => ReturnType;
    };
  }
}

function TaskItemView({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as TaskItemAttrs;
  const checked = Boolean(attrs.checked);

  return (
    <NodeViewWrapper
      as="li"
      data-type="taskItem"
      data-checked={checked ? "true" : "false"}
      className={`grove-task-item ${checked ? "is-checked" : ""}`}
    >
      <label className="grove-task-item__checkbox" contentEditable={false}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) =>
            updateAttributes({ checked: event.currentTarget.checked })
          }
        />
      </label>
      <NodeViewContent className="grove-task-item__content" />
    </NodeViewWrapper>
  );
}

export const TaskList = Node.create({
  name: "taskList",

  group: "block list",

  content: "taskItem+",

  defining: true,

  parseHTML() {
    return [{ tag: 'ul[data-type="taskList"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(HTMLAttributes, {
        "data-type": "taskList",
        class: "grove-task-list",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ commands }) =>
          commands.toggleList(this.name, "taskItem"),
    };
  },
});

export const TaskItem = Node.create({
  name: "taskItem",

  content: "paragraph block*",

  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-checked") === "true",
        renderHTML: (attributes) => ({
          "data-checked": attributes.checked ? "true" : "false",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'li[data-type="taskItem"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(HTMLAttributes, {
        "data-type": "taskItem",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView);
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: taskListInputRuleMatcher,
        handler: ({ state, match }) => {
          const checked = typeof match[1] === "string" && match[1].toLowerCase() === "x";
          const text = typeof match[2] === "string" ? match[2] : "";
          const { tr, schema, selection } = state;
          const { $from } = selection;
          const paragraphNode = $from.parent;
          const taskListType = schema.nodes.taskList;
          const taskItemType = schema.nodes.taskItem;
          const paragraphType = schema.nodes.paragraph;

          if (
            paragraphNode.type.name !== "paragraph" ||
            !taskListType ||
            !taskItemType ||
            !paragraphType
          ) {
            return null;
          }

          const paragraphPos = $from.before();
          const paragraphEnd = paragraphPos + paragraphNode.nodeSize;

          const taskParagraph = text
            ? paragraphType.create(null, [schema.text(text)])
            : paragraphType.create();

          const taskListNode = taskListType.create(null, [
            taskItemType.create({ checked }, [taskParagraph]),
          ]);

          tr.replaceWith(paragraphPos, paragraphEnd, taskListNode);

          const cursorPos = paragraphPos + 3 + text.length;
          tr.setSelection(TextSelection.near(tr.doc.resolve(cursorPos)));
          tr.scrollIntoView();

          return true;
        },
      }),
    ];
  },
});
