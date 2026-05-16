/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, type MouseEvent } from 'react'
import { InputRule, Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { blockActionsPluginKey } from '@/components/editor/extensions/blockActionsPluginKey'
import { InlineBlockShell } from '@/components/editor/InlineBlockShell'

// 동적 import를 위한 컴포넌트 캐시
let DbDiagramBlockModule: typeof import('@/src/components/blocks/db-diagram/DbDiagramBlock') | null = null

function DbDiagramBlockWrapper(props: NodeViewProps) {
  const [DbDiagramBlock, setDbDiagramBlock] = useState<React.ComponentType<any> | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // React 렌더링 사이클 완료 후 컴포넌트 로드 (flushSync 방지)
    const rafId = requestAnimationFrame(() => {
      // 이미 로드된 모듈이 있으면 재사용
      if (DbDiagramBlockModule) {
        setDbDiagramBlock(() => DbDiagramBlockModule!.default)
        setIsReady(true)
        return
      }

      // 모듈을 비동기로 로드
      import('@/src/components/blocks/db-diagram/DbDiagramBlock').then((module) => {
        DbDiagramBlockModule = module
        setDbDiagramBlock(() => module.default)
        setIsReady(true)
      })
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  const markDbDiagramHovered = (event: MouseEvent<HTMLElement>) => {
    const blockElement = event.currentTarget.closest<HTMLElement>("[data-grove-block='true']")
    const blockId = blockElement?.dataset.blockId ?? String(props.node.attrs.blockId ?? '')

    if (!blockId || !props.editor.isEditable) {
      return
    }

    const pluginState = blockActionsPluginKey.getState(props.editor.state)
    if (pluginState?.hoveredBlockId === blockId) {
      return
    }

    props.editor.view.dispatch(
      props.editor.state.tr.setMeta(blockActionsPluginKey, { hoveredBlockId: blockId })
    )
  }

  return (
    <NodeViewWrapper
      className="db-diagram-block my-2"
      contentEditable={false}
      data-testid="db-diagram-block"
      onMouseMoveCapture={markDbDiagramHovered}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <InlineBlockShell activationHint="더블클릭하여 다이어그램 편집">
        {isReady && DbDiagramBlock ? (
          <DbDiagramBlock {...(props as any)} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-[var(--color-text-secondary)]">
            Loading diagram...
          </div>
        )}
      </InlineBlockShell>
    </NodeViewWrapper>
  )
}

export interface DbDiagramOptions {
  HTMLAttributes: Record<string, unknown>
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

  selectable: true,

  draggable: false,

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
    return ReactNodeViewRenderer(DbDiagramBlockWrapper)
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
        }) && commands.createParagraphNear()
      }
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/(?:dbdiagram|db-diagram|diagramdb|erd|db)$/,
        handler: ({ state, range, chain }) => {
          const from = range.from
          const to = range.to
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, '\n', '\0')
          const deleteFrom = prefix === ' ' ? from - 1 : from

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: {
                sql: '',
                layout: {},
                workspaceId: this.options.workspaceId ?? null,
                pageId: this.options.pageId ?? null,
              }
            })
            .createParagraphNear()
            .run()
        },
      }),
    ]
  }
})
