/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ForeignKeyDef } from '@obnofi/types/db-diagram'

// ---------------------------------------------------------------------------
// extractConstraintColumns
// ---------------------------------------------------------------------------

export function extractConstraintColumns(definition: any): string[] {
  if (!definition) return []

  if (Array.isArray(definition)) {
    return definition
      .map((col: any) => (typeof col === 'string' ? col : col.column || col.name))
      .filter(Boolean)
  }

  if (typeof definition === 'string') {
    return [definition]
  }

  if (definition.column) {
    return [definition.column]
  }

  return []
}

// ---------------------------------------------------------------------------
// parseForeignKey
// ---------------------------------------------------------------------------

export function parseForeignKey(def: any): ForeignKeyDef | null {
  if (!def.definition || !def.reference_definition) {
    return null
  }

  const columns = extractConstraintColumns(def.definition)
  if (columns.length === 0) return null

  const ref = def.reference_definition

  // node-sql-parser returns ref.table as an array: [{ table: 'roles', ... }]
  let refTable: string | undefined
  if (Array.isArray(ref.table)) {
    refTable = ref.table[0]?.table
  } else if (typeof ref.table === 'string') {
    refTable = ref.table
  } else {
    refTable = ref.table?.name || ref.table?.table
  }

  const refColumns = extractConstraintColumns(ref.definition)

  if (!refTable || refColumns.length === 0) return null

  const fk: ForeignKeyDef = {
    columnName: columns[0],
    referencedTable: refTable,
    referencedColumn: refColumns[0],
  }

  // node-sql-parser returns ON DELETE/UPDATE as on_action array:
  // [{ type: 'on delete', value: { type: 'origin', value: 'cascade' } }]
  if (Array.isArray(ref.on_action)) {
    for (const action of ref.on_action) {
      const actionValue = String(action.value?.value ?? action.value ?? '')
      if (action.type === 'on delete') {
        fk.onDelete = normalizeOnAction(actionValue)
      } else if (action.type === 'on update') {
        fk.onUpdate = normalizeOnAction(actionValue)
      }
    }
  } else {
    // Fallback for alternative AST formats
    if (ref.on_delete) fk.onDelete = normalizeOnAction(ref.on_delete)
    if (ref.on_update) fk.onUpdate = normalizeOnAction(ref.on_update)
  }

  return fk
}

// ---------------------------------------------------------------------------
// normalizeOnAction
// ---------------------------------------------------------------------------

export function normalizeOnAction(
  action: string
): 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' {
  const normalized = action.toUpperCase().replace(/_/g, ' ')

  if (normalized === 'CASCADE') return 'CASCADE'
  if (normalized === 'SET NULL' || normalized === 'SETNULL') return 'SET NULL'
  if (normalized === 'RESTRICT') return 'RESTRICT'
  return 'NO ACTION'
}
