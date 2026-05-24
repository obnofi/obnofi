/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@obnofi/types/db-diagram'

// ---------------------------------------------------------------------------
// parseColumnDefinition
// ---------------------------------------------------------------------------

export function parseColumnDefinition(def: any): ColumnDef | null {
  if (!def.column || !def.definition) {
    return null
  }

  const name = typeof def.column === 'string' ? def.column : def.column.column || def.column.name
  const dataType = parseDataType(def.definition)

  let nullable = true
  let autoIncrement = false
  let defaultValue: string | undefined
  let comment: string | undefined
  let unique = false
  let primaryKey = false

  // Check for auto_increment at top level
  if (def.auto_increment === 'auto_increment') {
    autoIncrement = true
  }

  // Check for primary_key at top level
  if (def.primary_key === 'primary key') {
    primaryKey = true
  }

  // Check for unique at top level
  if (def.unique === 'unique') {
    unique = true
  }

  // Check for nullable at top level
  if (def.nullable) {
    if (def.nullable.type === 'not null' || def.nullable.value === 'not null') {
      nullable = false
    } else if (def.nullable.type === 'null' || def.nullable.value === 'null') {
      nullable = true
    }
  }

  // Check for default_val at top level
  if (def.default_val) {
    defaultValue = extractDefaultValue(def.default_val.value)
  }

  // Parse column constraints (fallback)
  if (def.definition.constraints) {
    for (const constraint of def.definition.constraints) {
      if (!constraint) continue

      switch (constraint.type) {
        case 'not null':
        case 'not_null':
          nullable = false
          break
        case 'null':
          nullable = true
          break
        case 'auto_increment':
          autoIncrement = true
          break
        case 'unique':
          unique = true
          break
        case 'primary key':
        case 'primary_key':
          primaryKey = true
          break
        case 'default':
          defaultValue = extractDefaultValue(constraint.value)
          break
        case 'comment':
          comment = extractComment(constraint.value)
          break
      }
    }
  }

  return {
    name,
    type: dataType,
    nullable,
    primaryKey,
    unique,
    autoIncrement,
    defaultValue,
    comment,
  }
}

// ---------------------------------------------------------------------------
// parseDataType
// ---------------------------------------------------------------------------

export function parseDataType(dataType: any): string {
  if (!dataType) return 'UNKNOWN'

  if (typeof dataType === 'string') {
    return dataType.toUpperCase()
  }

  const typeName = dataType.dataType || dataType.type || 'UNKNOWN'
  const length = dataType.length

  if (length !== undefined && length !== null) {
    if (Array.isArray(length)) {
      return `${typeName.toUpperCase()}(${length.join(',')})`
    }
    return `${typeName.toUpperCase()}(${length})`
  }

  return typeName.toUpperCase()
}

// ---------------------------------------------------------------------------
// extractDefaultValue
// ---------------------------------------------------------------------------

export function extractDefaultValue(value: any): string | undefined {
  if (!value) return undefined

  if (typeof value === 'string') {
    return value
  }

  if (value.type === 'function') {
    const funcName = value.name?.name?.[0]?.value || value.name?.name || 'UNKNOWN'
    return funcName.toUpperCase()
  }

  if (value.value !== undefined) {
    return String(value.value)
  }

  return String(value)
}

// ---------------------------------------------------------------------------
// extractComment
// ---------------------------------------------------------------------------

export function extractComment(value: any): string | undefined {
  if (!value) return undefined

  if (typeof value === 'string') {
    return value
  }

  if (value.value !== undefined) {
    return String(value.value)
  }

  return String(value)
}
