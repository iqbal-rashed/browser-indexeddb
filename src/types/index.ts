/**
 * Base document type - all documents must have an _id field
 */
export type Document = {
  _id: string;
} & Record<string, unknown>;

/**
 * Query comparison operators
 */
export interface ComparisonOperators<T> {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $regex?: RegExp | string;
  $exists?: boolean;
  $startsWith?: string;
  $endsWith?: string;
  $contains?: T extends unknown[] ? T[number] : never;
}

/**
 * Field-level query type
 */
export type QueryField<T> = T | ComparisonOperators<T>;

/**
 * Query type for finding documents
 */
export type Query<T> = {
  [K in keyof T]?: QueryField<T[K]>;
} & {
  $and?: Query<T>[];
  $or?: Query<T>[];
  $not?: Query<T>;
};

/**
 * Update operators for modifying documents
 */
export interface UpdateOperators<T> {
  $set?: Partial<T>;
  $unset?: { [K in keyof T]?: true };
  $inc?: { [K in keyof T]?: T[K] extends number ? number : never };
  $push?: { [K in keyof T]?: T[K] extends unknown[] ? T[K][number] : never };
  $pull?: { [K in keyof T]?: T[K] extends unknown[] ? T[K][number] : never };
  $addToSet?: { [K in keyof T]?: T[K] extends unknown[] ? T[K][number] : never };
}

/**
 * Sort order for query results
 */
export type SortOrder = 1 | -1 | 'asc' | 'desc';

/**
 * Sort specification
 */
export type Sort<T> = {
  [K in keyof T]?: SortOrder;
};

/**
 * Options for find operations
 */
export interface FindOptions<T> {
  sort?: Sort<T>;
  limit?: number;
  skip?: number;
}

/**
 * BrowserDB configuration options
 */
export interface BrowserDBOptions {
  /** Database name (used as IndexedDB database name) */
  name: string;
  /** Database version (default: 1) */
  version?: number;
}

/**
 * Collection configuration options
 */
export interface CollectionOptions {
  /** Name of the collection */
  name: string;
  /** Custom ID generator function */
  idGenerator?: () => string;
}
