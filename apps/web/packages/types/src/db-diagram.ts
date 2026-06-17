export interface ColumnDef {
  name: string
  type: string          // VARCHAR(255), INT, BIGINT, etc.
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  autoIncrement: boolean
  defaultValue?: string
  comment?: string
}

export interface ForeignKeyDef {
  columnName: string
  referencedTable: string
  referencedColumn: string
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
}

export interface TableDef {
  name: string
  columns: ColumnDef[]
  foreignKeys: ForeignKeyDef[]
  comment?: string
}

export interface DbSchema {
  tables: TableDef[]
}

// Sync direction type
export type SyncDirection = 'sql-to-erd' | 'erd-to-sql'

// React Flow specific types
export interface TableNodeData extends Record<string, unknown> {
  table: TableDef
  onTableChange?: (table: TableDef) => void
  onColumnSelect?: (column: ColumnDef) => void
  showHandles?: boolean
}

export interface RelationEdgeData extends Record<string, unknown> {
  foreignKey: ForeignKeyDef
  sourceTable: string
  targetTable: string
  onFkChange?: (fk: ForeignKeyDef) => void
}
