/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TableDef } from '@obnofi/types/db-diagram'
import { parseColumnDefinition } from './columnParser'
import { extractConstraintColumns, parseForeignKey } from './constraintParser'

// ---------------------------------------------------------------------------
// parseCreateTable
// ---------------------------------------------------------------------------

export function parseCreateTable(ast: any): TableDef | null {
  if (!ast.table || !ast.create_definitions) {
    return null
  }

  const tableName = extractTableName(ast.table)
  const comment = ast.table?.comment?.value || undefined

  const columns = []
  const foreignKeys = []
  const primaryKeyColumns: string[] = []
  const uniqueColumns = new Set<string>()

  // First pass: collect constraints and column definitions
  for (const def of ast.create_definitions) {
    if (!def) continue

    switch (def.resource) {
      case 'column': {
        const col = parseColumnDefinition(def)
        if (col) {
          columns.push(col)
        }
        break
      }

      case 'constraint': {
        const ct = (def.constraint_type ?? '').toLowerCase()
        if (ct === 'primary key' && def.definition) {
          primaryKeyColumns.push(...extractConstraintColumns(def.definition))
        }
        if (ct.includes('unique') && def.definition) {
          extractConstraintColumns(def.definition).forEach((col) => uniqueColumns.add(col))
        }
        if (ct === 'foreign key' && def.definition) {
          const fk = parseForeignKey(def)
          if (fk) {
            foreignKeys.push(fk)
          }
        }
        break
      }
    }
  }

  // Second pass: apply constraints to columns
  for (const col of columns) {
    if (primaryKeyColumns.includes(col.name)) {
      col.primaryKey = true
    }
    if (uniqueColumns.has(col.name)) {
      col.unique = true
    }
  }

  return { name: tableName, columns, foreignKeys, comment }
}

// ---------------------------------------------------------------------------
// extractTableName
// ---------------------------------------------------------------------------

export function extractTableName(tableAst: any): string {
  // Handle array format from node-sql-parser
  if (Array.isArray(tableAst)) {
    if (tableAst.length > 0) {
      return extractTableName(tableAst[0])
    }
    return 'unknown'
  }

  if (typeof tableAst === 'string') {
    return tableAst
  }
  if (tableAst?.table) {
    return tableAst.table
  }
  if (tableAst?.name) {
    return tableAst.name
  }
  return 'unknown'
}
