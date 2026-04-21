import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import DbDiagramBlock from '@/src/components/blocks/db-diagram/DbDiagramBlock'

export interface DbDiagramOptions {
  HTMLAttributes: Record<string, any>
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
      HTMLAttributes: {}
    }
  },

  addAttributes() {
    return {
      sql: {
        default: ''
      },
      layout: {
        default: {}
      }
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
            layout: {}
          }
        })
      }
    }
  }
})
