"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import DbDiagramLayout from './DbDiagramLayout'
import { usePageStore } from '@/store/pageStore'

interface DbDiagramBlockProps {
  node: {
    attrs: {
      sql?: string
      layout?: Record<string, { x: number; y: number }>
      pageId?: string | null
      workspaceId?: string | null
    }
  }
  updateAttributes: (attrs: Record<string, any>) => void
}

export default function DbDiagramBlock({ node, updateAttributes }: DbDiagramBlockProps) {
  const { sql = '', layout = {}, pageId = null } = node.attrs
  const { pages } = usePageStore()
  const parentPage = pageId ? pages.find(p => p.id === pageId) : null
  const pageName = parentPage?.title || null
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
    // React 렌더링 사이클 완료 후 업데이트 (flushSync 방지)
    setTimeout(() => {
      updateAttributes({ sql: newSql })
    }, 0)
  }

  const handleLayoutChange = (newLayout: Record<string, { x: number; y: number }>) => {
    // React 렌더링 사이클 완료 후 업데이트 (flushSync 방지)
    setTimeout(() => {
      updateAttributes({ layout: newLayout })
    }, 0)
  }

  return (
    <>
      <div className="my-4 h-[500px]">
        <ReactFlowProvider>
          <DbDiagramLayout
            initialSql={sql}
            initialLayout={layout}
            onSqlChange={handleSqlChange}
            onLayoutChange={handleLayoutChange}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(f => !f)}
            pageName={pageName}
          />
        </ReactFlowProvider>
      </div>
      {isFullscreen && (
        <div
          className="fixed left-60 right-0 top-0 bottom-0 bg-black/40 z-[35] backdrop-blur-[2px]"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </>
  )
}
