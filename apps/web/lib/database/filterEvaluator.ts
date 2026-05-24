import type { FilterOperator, PropertyType } from '@obnofi/types/core';

export function areEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function stringContains(actual: unknown, filterValue: unknown): boolean {
  const str = String(actual ?? '').toLowerCase();
  const search = String(filterValue ?? '').toLowerCase();
  return str.includes(search);
}

export function stringStartsWith(actual: unknown, filterValue: unknown): boolean {
  const str = String(actual ?? '').toLowerCase();
  const search = String(filterValue ?? '').toLowerCase();
  return str.startsWith(search);
}

export function stringEndsWith(actual: unknown, filterValue: unknown): boolean {
  const str = String(actual ?? '').toLowerCase();
  const search = String(filterValue ?? '').toLowerCase();
  return str.endsWith(search);
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function compareDates(actual: unknown, filterValue: unknown): number {
  const dateA = new Date(actual as string).getTime();
  const dateB = new Date(filterValue as string).getTime();
  return dateA - dateB;
}

export function arrayIncludes(actual: unknown, filterValue: unknown): boolean {
  if (!Array.isArray(actual)) return false;
  return actual.some(item => areEqual(item, filterValue));
}

export function compareValues(a: unknown, b: unknown, type: PropertyType): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  switch (type) {
    case 'title':
    case 'rich_text':
    case 'url':
    case 'email':
    case 'phone_number':
      return String(a).localeCompare(String(b));

    case 'number':
      return (a as number) - (b as number);

    case 'date':
      return new Date(a as string).getTime() - new Date(b as string).getTime();

    case 'checkbox':
      return (a as boolean) === (b as boolean) ? 0 : a ? -1 : 1;

    case 'select':
      return String(a).localeCompare(String(b));

    case 'multi_select': {
      const countA = (a as string[]).length;
      const countB = (b as string[]).length;
      if (countA !== countB) return countA - countB;
      return compareValues((a as string[])[0], (b as string[])[0], 'select');
    }

    default:
      return String(a).localeCompare(String(b));
  }
}

export function evaluateFilterOperator(
  operator: FilterOperator,
  actualValue: unknown,
  filterValue: unknown,
  propertyType: PropertyType
): boolean {
  void propertyType;
  switch (operator) {
    case 'equals':
      return areEqual(actualValue, filterValue);
    case 'does_not_equal':
      return !areEqual(actualValue, filterValue);

    case 'contains':
      return stringContains(actualValue, filterValue);
    case 'does_not_contain':
      return !stringContains(actualValue, filterValue);
    case 'starts_with':
      return stringStartsWith(actualValue, filterValue);
    case 'ends_with':
      return stringEndsWith(actualValue, filterValue);

    case 'is_empty':
      return isEmpty(actualValue);
    case 'is_not_empty':
      return !isEmpty(actualValue);

    case 'greater_than':
      return (actualValue as number) > (filterValue as number);
    case 'less_than':
      return (actualValue as number) < (filterValue as number);
    case 'greater_than_or_equal':
      return (actualValue as number) >= (filterValue as number);
    case 'less_than_or_equal':
      return (actualValue as number) <= (filterValue as number);

    case 'before':
      return compareDates(actualValue, filterValue) < 0;
    case 'after':
      return compareDates(actualValue, filterValue) > 0;
    case 'on_or_before':
      return compareDates(actualValue, filterValue) <= 0;
    case 'on_or_after':
      return compareDates(actualValue, filterValue) >= 0;

    case 'is':
      return areEqual(actualValue, filterValue);
    case 'is_not':
      return !areEqual(actualValue, filterValue);
    case 'includes':
      return arrayIncludes(actualValue, filterValue);
    case 'does_not_include':
      return !arrayIncludes(actualValue, filterValue);

    default:
      return true;
  }
}
