import { useState, useCallback, useRef, useEffect } from 'react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { DbSchema, TableNodeData, RelationEdgeData } from '@obnofi/types/db-diagram'
import { parseMySQLDDL } from '@/src/components/blocks/db-diagram/utils/sqlParser'
import { generateMySQLDDL } from '@/src/components/blocks/db-diagram/utils/sqlGenerator'
import { schemaToFlowElements, flowElementsToSchema, extractPositions } from '@/src/components/blocks/db-diagram/utils/astToFlow'

export interface UseDbDiagramSyncReturn {
  sql: string
  setSql: (sql: string, skipSync?: boolean) => void
  schema: DbSchema
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  updateSchemaFromErd: (updatedSchema: DbSchema) => void
  parseError: string | null
  tableCount: number
}

function buildPositionMap(
  layout?: Record<string, { x: number; y: number }>
) {
  return new Map<string, { x: number; y: number }>(
    Object.entries(layout ?? {})
  )
}

export function useDbDiagramSync(
  initialSql: string = '',
  initialLayout?: Record<string, { x: number; y: number }>
): UseDbDiagramSyncReturn {
  const [sql, setSqlInternal] = useState(initialSql)
  const [schema, setSchema] = useState<DbSchema>({ tables: [] })
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  
  // Refs for debouncing and preventing infinite loops
  const isUpdatingFromErd = useRef(false)
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const initialLayoutRef = useRef(buildPositionMap(initialLayout))
  const latestSqlRef = useRef(initialSql)

  // Keep refs in sync
  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  // Sync SQL -> ERD (with debounce)
  const syncSqlToErd = useCallback((newSql: string) => {
    latestSqlRef.current = newSql
    const { schema: newSchema, errors } = parseMySQLDDL(newSql)
    
    if (errors.length > 0) {
      setParseError(errors.join('; '))
    } else {
      setParseError(null)
    }

    // Preserve existing positions for tables that still exist
    const currentPositions = extractPositions(nodesRef.current)
    const preservedPositions = new Map<string, { x: number; y: number }>()
    
    for (const table of newSchema.tables) {
      const pos =
        currentPositions.get(table.name) ??
        initialLayoutRef.current.get(table.name)
      if (pos) {
        preservedPositions.set(table.name, pos)
      }
    }

    const { nodes: newNodes, edges: newEdges } = schemaToFlowElements(
      newSchema,
      preservedPositions.size > 0 ? preservedPositions : undefined
    )

    // Store positions for future updates
    positionsRef.current = extractPositions(newNodes)

    setSchema(newSchema)
    setNodes(newNodes)
    setEdges(newEdges)
    edgesRef.current = newEdges
  }, [])

  // Sync ERD -> SQL
  const syncErdToSql = useCallback(() => {
    const currentNodes = nodesRef.current
    const currentEdges = edgesRef.current
    const newSchema = flowElementsToSchema(currentNodes as Node<TableNodeData>[], currentEdges as Edge<RelationEdgeData>[])
    const newSql = generateMySQLDDL(newSchema)
    
    isUpdatingFromErd.current = true
    latestSqlRef.current = newSql
    setSqlInternal(newSql)
    setSchema(newSchema)
    
    // Reset flag after a tick
    setTimeout(() => {
      isUpdatingFromErd.current = false
    }, 0)
  }, [])

  // Public setSql with skipSync option
  const setSql = useCallback((newSql: string, skipSync: boolean = false) => {
    latestSqlRef.current = newSql
    setSqlInternal(newSql)
    
    if (skipSync) {
      // Just update SQL without triggering ERD sync
      return
    }

    if (!newSql.trim()) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      syncSqlToErd(newSql)
      return
    }

    // Debounce the sync
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      syncSqlToErd(newSql)
    }, 500)
  }, [syncSqlToErd])

  // Handle node changes from React Flow
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(prev => {
      const updated = applyNodeChanges(changes, prev)
      nodesRef.current = updated
      positionsRef.current = extractPositions(updated)
      return updated
    })

    const shouldUpdateSql = changes.some(change => change.type === 'remove')

    // Dragging/selecting/resizing nodes only changes layout, not DDL.
    if (shouldUpdateSql && !isUpdatingFromErd.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        syncErdToSql()
      }, 300)
    }
  }, [syncErdToSql])

  // Handle edge changes from React Flow
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(prev => {
      const updated = applyEdgeChanges(changes, prev)
      edgesRef.current = updated
      return updated
    })

    const shouldUpdateSql = changes.some(change => change.type === 'remove')

    if (shouldUpdateSql && !isUpdatingFromErd.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        syncErdToSql()
      }, 300)
    }
  }, [syncErdToSql])

  // Update schema from ERD (for explicit updates like table edits, new tables, or FK connections)
  const updateSchemaFromErd = useCallback((updatedSchema: DbSchema) => {
    setSchema(updatedSchema)

    const newSql = generateMySQLDDL(updatedSchema)
    isUpdatingFromErd.current = true
    latestSqlRef.current = newSql
    setSqlInternal(newSql)

    // Build updated nodes: update existing tables in-place, add nodes for new tables
    const currentNodes = nodesRef.current
    const existingNodeMap = new Map(currentNodes.map(n => [n.id, n]))

    const updatedNodes: Node[] = updatedSchema.tables.map((table, index) => {
      const existing = existingNodeMap.get(table.name)
      if (existing) {
        return {
          ...existing,
          data: { ...(existing.data as TableNodeData), table }
        }
      }
      // New table — cascade offset so multiple adds don't stack
      const base = currentNodes.length + index
      return {
        id: table.name,
        type: 'tableNode',
        position: { x: 120 + base * 30, y: 120 + base * 30 },
        data: { table },
        width: 240
      } as Node
    })

    nodesRef.current = updatedNodes
    positionsRef.current = extractPositions(updatedNodes)
    setNodes(updatedNodes)

    // Regenerate edges from updated schema
    const { edges: newEdges } = schemaToFlowElements(updatedSchema, positionsRef.current)
    setEdges(newEdges)
    edgesRef.current = newEdges

    setTimeout(() => {
      isUpdatingFromErd.current = false
    }, 0)
  }, [])

  // Initial sync
  useEffect(() => {
    if (initialSql) {
      if (initialSql !== latestSqlRef.current) {
        latestSqlRef.current = initialSql
        setSqlInternal(initialSql)
      }
      syncSqlToErd(initialSql)
    } else {
      latestSqlRef.current = ''
      setSqlInternal('')
      syncSqlToErd('')
      if (initialLayoutRef.current.size > 0) {
        positionsRef.current = new Map(initialLayoutRef.current)
      }
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [initialSql, syncSqlToErd])

  return {
    sql,
    setSql,
    schema,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    updateSchemaFromErd,
    parseError,
    tableCount: schema.tables.length
  }
}
