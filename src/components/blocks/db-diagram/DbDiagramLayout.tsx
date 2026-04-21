import { useState, useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import type { Connection } from '@xyflow/react'
import type { DbSchema, ForeignKeyDef } from '@/src/types/db-diagram'
import { useDbDiagramSync } from '@/src/hooks/useDbDiagramSync'
import SqlEditorPanel from './SqlEditorPanel'
import ErdCanvas from './ErdCanvas'

interface DbDiagramLayoutProps {
  initialSql?: string
  onSqlChange?: (sql: string) => void
  onLayoutChange?: (layout: Record<string, { x: number; y: number }>) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

const DEFAULT_SQL = `CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  role_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY (email),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) COMMENT='유저 테이블';

CREATE TABLE IF NOT EXISTS roles (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  PRIMARY KEY (id)
) COMMENT='역할 테이블';`

export default function DbDiagramLayout({
  initialSql = DEFAULT_SQL,
  onSqlChange,
  onLayoutChange,
  isFullscreen = false,
  onToggleFullscreen
}: DbDiagramLayoutProps) {
  const [panelWidth, setPanelWidth] = useState(320)
  
  const {
    sql,
    setSql,
    schema,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    updateSchemaFromErd,
    parseError,
    tableCount
  } = useDbDiagramSync(initialSql)

  const handleSqlChange = useCallback((newSql: string) => {
    setSql(newSql)
    onSqlChange?.(newSql)
  }, [setSql, onSqlChange])

  const handleResize = useCallback((delta: number) => {
    setPanelWidth(prev => {
      const newWidth = prev + delta
      return Math.max(200, Math.min(600, newWidth))
    })
  }, [])

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return

    // Handle IDs: "src::columnName" / "tgt::columnName"
    const sourceColumn = connection.sourceHandle?.replace(/^src::/, '') ?? ''

    // targetHandle may be null when dropped on node body — fall back to first PK column
    let targetColumn = connection.targetHandle?.replace(/^tgt::/, '') ?? ''
    if (!targetColumn) {
      const tgt = schema.tables.find(t => t.name === connection.target)
      targetColumn =
        tgt?.columns.find(c => c.primaryKey)?.name ??
        tgt?.columns.find(c => c.unique)?.name ??
        tgt?.columns[0]?.name ??
        ''
    }

    if (!sourceColumn || !targetColumn) return

    const sourceTable = schema.tables.find(t => t.name === connection.source)
    if (!sourceTable) return

    const duplicate = sourceTable.foreignKeys.find(
      fk => fk.columnName === sourceColumn &&
            fk.referencedTable === connection.target &&
            fk.referencedColumn === targetColumn
    )
    if (duplicate) return

    const updatedTables = schema.tables.map(table =>
      table.name === connection.source
        ? {
            ...table,
            foreignKeys: [
              ...table.foreignKeys,
              {
                columnName: sourceColumn,
                referencedTable: connection.target!,
                referencedColumn: targetColumn,
                onDelete: 'NO ACTION' as const,
                onUpdate: 'NO ACTION' as const
              }
            ]
          }
        : table
    )

    updateSchemaFromErd({ tables: updatedTables })
  }, [schema.tables, updateSchemaFromErd])

  const handleSchemaChange = useCallback((newSchema: DbSchema) => {
    updateSchemaFromErd(newSchema)
  }, [updateSchemaFromErd])

  return (
    <div
      className={
        isFullscreen
          ? 'flex flex-col w-full h-full bg-white dark:bg-[#111110] fixed inset-0 z-50'
          : 'flex flex-col h-full w-full bg-white dark:bg-[#111110] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800'
      }
    >
      {/* Block Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#2E7D45]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
            DB 다이어그램
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Fullscreen toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isFullscreen ? '인라인으로 보기' : '전체 화면으로 보기'}
          >
            {isFullscreen ? (
              /* Compress icon */
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              /* Expand icon */
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <ReactFlowProvider>
          <SqlEditorPanel
            sql={sql}
            onChange={handleSqlChange}
            parseError={parseError}
            tableCount={tableCount}
            width={panelWidth}
            onResize={handleResize}
          />
          <ErdCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onSchemaChange={handleSchemaChange}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
