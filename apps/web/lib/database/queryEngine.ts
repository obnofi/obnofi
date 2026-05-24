/**
 * Database Query Engine
 * Handles filtering, sorting, grouping, and pagination for database views
 */

import type {
  Page,
  Database,
  DatabaseView,
  ViewQuery,
  ViewSort,
  Filter,
  FilterGroup,
  PropertyType,
} from '@obnofi/types/core';
import { evaluateFilterOperator, compareValues } from "./filterEvaluator";

export interface QueryResult {
  pages: Page[];
  totalCount: number;
  hasMore: boolean;
  groups?: Map<string, Page[]>;
}

export class DatabaseQueryEngine {
  private database: Database;
  private pages: Map<string, Page>;

  constructor(database: Database, pages: Page[]) {
    this.database = database;
    this.pages = new Map(pages.map(p => [p.id, p]));
  }

  /**
   * Execute a complete query pipeline
   */
  async execute(view: DatabaseView, offset = 0, limit = 100): Promise<QueryResult> {
    // 1. Get all pages in database
    let pages = this.getDatabasePages();

    // 2. Apply filters
    pages = this.filterPages(pages, view.query);

    // 3. Apply sorts
    pages = this.sortPages(pages, view.query.sorts);

    // 4. Calculate total before pagination
    const totalCount = pages.length;

    // 5. Group if needed (for board view)
    let groups: Map<string, Page[]> | undefined;
    if (view.query.groupBy) {
      groups = this.groupPages(pages, view.query.groupBy);
    }

    // 6. Paginate
    const paginatedPages = this.paginate(pages, offset, limit);

    return {
      pages: paginatedPages,
      totalCount,
      hasMore: offset + limit < totalCount,
      groups,
    };
  }

  /**
   * Get all pages belonging to this database
   */
  private getDatabasePages(): Page[] {
    return this.database.pageIds
      .map(id => this.pages.get(id))
      .filter((p): p is Page => p !== undefined);
  }

  /**
   * Apply filter groups to pages
   */
  filterPages(pages: Page[], query: ViewQuery): Page[] {
    if (query.filterGroups.length === 0) return pages;

    return pages.filter(page => {
      // All filter groups must pass (AND logic between groups)
      return query.filterGroups.every(group => this.applyFilterGroup(page, group));
    });
  }

  /**
   * Apply a single filter group
   */
  private applyFilterGroup(page: Page, group: FilterGroup): boolean {
    const results = group.filters.map(filter => this.applyFilter(page, filter));
    
    // OR within group, AND between groups
    return group.operator === 'AND' 
      ? results.every(r => r)
      : results.some(r => r);
  }

  /**
   * Apply a single filter to a page
   */
  private applyFilter(page: Page, filter: Filter): boolean {
    const propertyValue = page.propertyValues[filter.propertyId];
    const propertyDef = this.database.properties.find(p => p.id === filter.propertyId);
    
    if (!propertyDef) return false;

    const actualValue = propertyValue?.value ?? null;
    
    return evaluateFilterOperator(
      filter.operator,
      actualValue,
      filter.value,
      propertyDef.type
    );
  }

  /**
   * Apply sorts to pages
   */
  sortPages(pages: Page[], sorts: ViewSort[]): Page[] {
    if (sorts.length === 0) {
      // Default sort by created time descending
      sorts = [{ propertyId: 'created_time', direction: 'descending' }];
    }

    return [...pages].sort((a, b) => {
      for (const sort of sorts) {
        const comparison = this.comparePages(a, b, sort);
        if (comparison !== 0) {
          return sort.direction === 'ascending' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Compare two pages by a sort criteria
   */
  private comparePages(a: Page, b: Page, sort: ViewSort): number {
    const propDef = this.database.properties.find(p => p.id === sort.propertyId);
    
    // Handle system properties
    if (sort.propertyId === 'created_time') {
      return a.createdAt - b.createdAt;
    }
    if (sort.propertyId === 'last_edited_time') {
      return a.updatedAt - b.updatedAt;
    }
    if (sort.propertyId === 'title') {
      const titleA = this.getPageTitle(a);
      const titleB = this.getPageTitle(b);
      return titleA.localeCompare(titleB);
    }

    if (!propDef) return 0;

    const valueA = a.propertyValues[sort.propertyId]?.value ?? null;
    const valueB = b.propertyValues[sort.propertyId]?.value ?? null;

    return compareValues(valueA, valueB, propDef.type);
  }

  /**
   * Group pages by a property value (for board view)
   */
  groupPages(pages: Page[], groupByPropertyId: string): Map<string, Page[]> {
    const groups = new Map<string, Page[]>();
    const propertyDef = this.database.properties.find(p => p.id === groupByPropertyId);

    for (const page of pages) {
      const value = page.propertyValues[groupByPropertyId]?.value;
      const key = this.valueToGroupKey(value, propertyDef?.type);
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(page);
    }

    return groups;
  }

  /**
   * Paginate results
   */
  paginate(pages: Page[], offset: number, limit: number): Page[] {
    return pages.slice(offset, offset + limit);
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getPageTitle(page: Page): string {
    // Get title from title property
    const titleProp = this.database.properties.find(p => p.type === 'title');
    if (titleProp) {
      return String(page.propertyValues[titleProp.id]?.value ?? 'Untitled');
    }
    return 'Untitled';
  }

  private valueToGroupKey(value: unknown, type?: PropertyType): string {
    void type;
    if (value === null || value === undefined) return 'Uncategorized';

    if (Array.isArray(value)) {
      if (value.length === 0) return 'Uncategorized';
      return String(value[0]);
    }

    return String(value);
  }
}

export { ComputedPropertyEngine } from "./computedPropertyEngine";
