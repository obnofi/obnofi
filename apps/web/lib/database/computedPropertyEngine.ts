import type {
  Page,
  Database,
  RollupFunction,
} from '@obnofi/types/core';

export class ComputedPropertyEngine {
  private pages: Map<string, Page>;
  private databases: Map<string, Database>;

  constructor(pages: Page[], databases: Database[]) {
    this.pages = new Map(pages.map(p => [p.id, p]));
    this.databases = new Map(databases.map(d => [d.id, d]));
  }

  /**
   * Evaluate a formula expression
   */
  evaluateFormula(formula: string, page: Page): unknown {
    try {
      // Create formula context
      const context = this.createFormulaContext(page);

      // Simple expression evaluator (in production, use a proper parser)
      const fn = new Function(...Object.keys(context), `return ${formula}`);
      return fn(...Object.values(context));
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return null;
    }
  }

  /**
   * Calculate a rollup value
   */
  calculateRollup(
    page: Page,
    relationPropertyId: string,
    rollupPropertyId: string,
    fn: RollupFunction
  ): unknown {
    // Get related page IDs
    const relatedIds = page.propertyValues[relationPropertyId]?.value as string[] | undefined;
    if (!relatedIds || relatedIds.length === 0) {
      return this.getEmptyRollupValue(fn);
    }

    // Get values from related pages
    const values = relatedIds
      .map(id => this.pages.get(id))
      .filter((p): p is Page => p !== undefined)
      .map(p => p.propertyValues[rollupPropertyId]?.value)
      .filter(v => v !== undefined && v !== null);

    return this.aggregateValues(values, fn);
  }

  /**
   * Create context object for formula evaluation
   */
  private createFormulaContext(page: Page): Record<string, unknown> {
    const context: Record<string, unknown> = {
      // Built-in functions
      now: () => new Date(),
      today: () => new Date().toISOString().split('T')[0],

      // Date functions
      dateBetween: (start: string, end: string, unit: string) => {
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const diff = e - s;

        switch (unit.toLowerCase()) {
          case 'days': return Math.floor(diff / (1000 * 60 * 60 * 24));
          case 'hours': return Math.floor(diff / (1000 * 60 * 60));
          case 'minutes': return Math.floor(diff / (1000 * 60));
          default: return diff;
        }
      },

      dateAdd: (date: string, amount: number, unit: string) => {
        const d = new Date(date);
        switch (unit.toLowerCase()) {
          case 'days': d.setDate(d.getDate() + amount); break;
          case 'months': d.setMonth(d.getMonth() + amount); break;
          case 'years': d.setFullYear(d.getFullYear() + amount); break;
        }
        return d.toISOString();
      },

      formatDate: (date: string, format: string) => {
        void format;
        const d = new Date(date);
        // Simple format implementation
        return d.toLocaleDateString();
      },

      // String functions
      concat: (...args: string[]) => args.join(''),
      contains: (str: string, search: string) => str.includes(search),
      empty: (val: unknown) => !val || (Array.isArray(val) && val.length === 0),
      length: (val: string | unknown[]) => val?.length ?? 0,
      replace: (str: string, search: string, replace: string) =>
        str.replace(new RegExp(search, 'g'), replace),
      slice: (str: string, start: number, end?: number) => str.slice(start, end),

      // Math functions
      abs: Math.abs,
      ceil: Math.ceil,
      floor: Math.floor,
      max: Math.max,
      min: Math.min,
      round: Math.round,
      sqrt: Math.sqrt,
    };

    // Add property accessors
    for (const [propId, propValue] of Object.entries(page.propertyValues)) {
      const cleanName = propId.replace(/[^a-zA-Z0-9_]/g, '_');
      context[`prop_${cleanName}`] = propValue.value;
    }

    return context;
  }

  /**
   * Aggregate values using a rollup function
   */
  private aggregateValues(values: unknown[], fn: RollupFunction): unknown {
    if (values.length === 0) {
      return this.getEmptyRollupValue(fn);
    }

    switch (fn) {
      case 'count':
      case 'count_values':
        return values.length;

      case 'count_unique_values':
        return new Set(values.map(v => JSON.stringify(v))).size;

      case 'empty':
        return values.filter(v => v === null || v === undefined || v === '').length;

      case 'not_empty':
        return values.filter(v => v !== null && v !== undefined && v !== '').length;

      case 'sum':
        return (values as number[]).reduce((a, b) => (a || 0) + (b || 0), 0);

      case 'average': {
        const nums = values.filter(v => typeof v === 'number') as number[];
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      }

      case 'median': {
        const nums = [...(values as number[])].sort((a, b) => a - b);
        const mid = Math.floor(nums.length / 2);
        return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      }

      case 'min':
        return Math.min(...(values as number[]));

      case 'max':
        return Math.max(...(values as number[]));

      case 'range': {
        const nums = values as number[];
        return Math.max(...nums) - Math.min(...nums);
      }

      case 'earliest_date':
        return new Date(Math.min(...(values as string[]).map(d => new Date(d).getTime()))).toISOString();

      case 'latest_date':
        return new Date(Math.max(...(values as string[]).map(d => new Date(d).getTime()))).toISOString();

      case 'checked':
        return (values as boolean[]).filter(v => v).length;

      case 'unchecked':
        return (values as boolean[]).filter(v => !v).length;

      case 'join':
      case 'concatenate':
        return values.join(', ');

      case 'show_original':
      default:
        return values;
    }
  }

  private getEmptyRollupValue(fn: RollupFunction): unknown {
    switch (fn) {
      case 'count':
      case 'count_values':
      case 'count_unique_values':
      case 'empty':
      case 'not_empty':
      case 'checked':
      case 'unchecked':
        return 0;
      case 'sum':
      case 'average':
      case 'median':
        return 0;
      case 'join':
      case 'concatenate':
        return '';
      default:
        return null;
    }
  }
}
