import { useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { ReactFlowProvider } from '@xyflow/react'
import DbDiagramLayout from './DbDiagramLayout'

interface DbDiagramBlockProps {
  node: {
    attrs: {
      sql?: string
      layout?: Record<string, { x: number; y: number }>
    }
  }
  updateAttributes: (attrs: Record<string, any>) => void
}

export default function DbDiagramBlock({ node, updateAttributes }: DbDiagramBlockProps) {
  const { sql = '', layout = {} } = node.attrs
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  const handleSqlChange = (newSql: string) => {
    updateAttributes({ sql: newSql })
  }

  const handleLayoutChange = (newLayout: Record<string, { x: number; y: number }>) => {
    updateAttributes({ layout: newLayout })
  }

  return (
    <NodeViewWrapper className="db-diagram-block">
      <div className="my-4 h-[500px]">
        <ReactFlowProvider>
          <DbDiagramLayout
            initialSql={sql}
            onSqlChange={handleSqlChange}
            onLayoutChange={handleLayoutChange}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(f => !f)}
          />
        </ReactFlowProvider>
      </div>
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </NodeViewWrapper>
  )
}
