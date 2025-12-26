import type { Document, Query, ComparisonOperators } from '../types';
import { getNestedValue } from '../utils';

/**
 * QueryEngine - Handles query matching for documents
 */
export class QueryEngine<T extends Document> {
  /**
   * Check if a document matches a query
   */
  matches(doc: T, query: Query<T>): boolean {
    // Handle logical operators
    if (query.$and) {
      return query.$and.every((q) => this.matches(doc, q));
    }

    if (query.$or) {
      return query.$or.some((q) => this.matches(doc, q));
    }

    if (query.$not) {
      return !this.matches(doc, query.$not);
    }

    // Check each field in the query
    for (const [key, condition] of Object.entries(query)) {
      if (key.startsWith('$')) continue; // Skip logical operators

      const docValue = getNestedValue(doc, key);

      if (!this.matchesCondition(docValue, condition)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a value matches a condition
   */
  private matchesCondition(value: unknown, condition: unknown): boolean {
    // Direct equality
    if (condition === null || typeof condition !== 'object' || condition instanceof RegExp) {
      return this.isEqual(value, condition);
    }

    // Handle operators
    const operators = condition as ComparisonOperators<unknown>;

    // $eq - Equal
    if ('$eq' in operators) {
      if (!this.isEqual(value, operators.$eq)) return false;
    }

    // $ne - Not equal
    if ('$ne' in operators) {
      if (this.isEqual(value, operators.$ne)) return false;
    }

    // $gt - Greater than
    if ('$gt' in operators) {
      if (value === undefined || value === null) return false;
      if (!((value as number) > (operators.$gt as number))) return false;
    }

    // $gte - Greater than or equal
    if ('$gte' in operators) {
      if (value === undefined || value === null) return false;
      if (!((value as number) >= (operators.$gte as number))) return false;
    }

    // $lt - Less than
    if ('$lt' in operators) {
      if (value === undefined || value === null) return false;
      if (!((value as number) < (operators.$lt as number))) return false;
    }

    // $lte - Less than or equal
    if ('$lte' in operators) {
      if (value === undefined || value === null) return false;
      if (!((value as number) <= (operators.$lte as number))) return false;
    }

    // $in - In array
    if ('$in' in operators && operators.$in) {
      if (!operators.$in.some((v) => this.isEqual(value, v))) return false;
    }

    // $nin - Not in array
    if ('$nin' in operators && operators.$nin) {
      if (operators.$nin.some((v) => this.isEqual(value, v))) return false;
    }

    // $regex - Regular expression match
    if ('$regex' in operators) {
      if (typeof value !== 'string') return false;
      const regex =
        operators.$regex instanceof RegExp ? operators.$regex : new RegExp(operators.$regex as string);
      if (!regex.test(value)) return false;
    }

    // $exists - Field existence
    if ('$exists' in operators) {
      const exists = value !== undefined;
      if (operators.$exists !== exists) return false;
    }

    // $startsWith - String starts with
    if ('$startsWith' in operators) {
      if (typeof value !== 'string') return false;
      if (!value.startsWith(operators.$startsWith as string)) return false;
    }

    // $endsWith - String ends with
    if ('$endsWith' in operators) {
      if (typeof value !== 'string') return false;
      if (!value.endsWith(operators.$endsWith as string)) return false;
    }

    // $contains - Array contains
    if ('$contains' in operators) {
      if (!Array.isArray(value)) return false;
      if (!value.some((v) => this.isEqual(v, operators.$contains))) return false;
    }

    return true;
  }

  /**
   * Check deep equality between two values
   */
  private isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => this.isEqual(val, b[idx]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const aKeys = Object.keys(a as object);
      const bKeys = Object.keys(b as object);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((key) =>
        this.isEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
      );
    }

    return false;
  }

  /**
   * Filter documents by query
   */
  filter(docs: T[], query?: Query<T>): T[] {
    if (!query || Object.keys(query).length === 0) {
      return docs;
    }
    return docs.filter((doc) => this.matches(doc, query));
  }
}
