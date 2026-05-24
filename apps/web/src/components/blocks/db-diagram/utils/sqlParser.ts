/* eslint-disable @typescript-eslint/no-explicit-any */
import { Parser } from 'node-sql-parser'
import type { DbSchema } from '@obnofi/types/db-diagram'
import { parseCreateTable } from './tableParser'

// Re-export sub-module helpers so existing importers of this file keep working.
export { parseCreateTable, extractTableName } from './tableParser'
export { parseColumnDefinition, parseDataType, extractDefaultValue, extractComment } from './columnParser'
export {
  extractConstraintColumns,
  parseForeignKey,
  normalizeOnAction,
} from './constraintParser'

const parser = new Parser()

export interface ParseResult {
  schema: DbSchema
  errors: string[]
}

// ---------------------------------------------------------------------------
// parseMySQLDDL — public entry point
// ---------------------------------------------------------------------------

export function parseMySQLDDL(sql: string): ParseResult {
  const errors: string[] = []
  const tables = []

  if (!sql.trim()) {
    return { schema: { tables: [] }, errors: [] }
  }

  const statements = splitStatements(sql)

  for (const stmt of statements) {
    if (!stmt.trim() || !stmt.trim().toUpperCase().startsWith('CREATE TABLE')) {
      continue
    }

    try {
      const ast = parser.astify(stmt, { database: 'mysql' })
      const astArray = Array.isArray(ast) ? ast : [ast]

      for (const singleAst of astArray) {
        if (singleAst?.type === 'create' && singleAst?.keyword === 'table') {
          const table = parseCreateTable(singleAst)
          if (table) {
            tables.push(table)
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error'
      errors.push(`Failed to parse statement: ${errorMsg}`)
    }
  }

  return { schema: { tables }, errors }
}

// ---------------------------------------------------------------------------
// splitStatements
// ---------------------------------------------------------------------------

function splitStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let depth = 0

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = sql[i + 1] || ''

    // Handle string literals
    if (!inString && (char === "'" || char === '"' || char === '`')) {
      inString = true
      stringChar = char
      current += char
      continue
    }

    if (inString) {
      current += char
      // Handle escaped characters
      if (char === '\\' && nextChar === stringChar) {
        current += nextChar
        i++
        continue
      }
      if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      continue
    }

    // Handle nested parentheses
    if (char === '(') {
      depth++
      current += char
      continue
    }

    if (char === ')') {
      depth--
      current += char
      continue
    }

    // Statement separator
    if (char === ';' && depth === 0) {
      if (current.trim()) {
        statements.push(current.trim())
      }
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) {
    statements.push(current.trim())
  }

  return statements
}
