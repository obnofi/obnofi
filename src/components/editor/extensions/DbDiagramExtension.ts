import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import DbDiagramBlock from '@/src/components/blocks/db-diagram/DbDiagramBlock'

export interface DbDiagramOptions {
  HTMLAttributes: Record<string, any>
  workspaceId?: string
  pageId?: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dbDiagram: {
      insertDbDiagram: (options?: { sql?: string }) => ReturnType
    }
  }
}

export const DbDiagramExtension = Node.create<DbDiagramOptions>({
  name: 'dbDiagram',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      workspaceId: undefined,
      pageId: undefined,
    }
  },

  addAttributes() {
    return {
      sql: { default: '' },
      layout: { default: {} },
      workspaceId: { default: null },
      pageId: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="db-diagram"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(
      { 'data-type': 'db-diagram' },
      this.options.HTMLAttributes,
      HTMLAttributes
    )]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DbDiagramBlock)
  },

  addCommands() {
    return {
      insertDbDiagram: (options?: { sql?: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            sql: options?.sql || '',
            layout: {},
            workspaceId: this.options.workspaceId ?? null,
            pageId: this.options.pageId ?? null,
          }
        })
      }
    }
  }
})
