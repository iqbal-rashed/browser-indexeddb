// Main exports
export { SimpleDB } from './core/SimpleDB';
export { Collection } from './core/Collection';

// Schema validator type (for Zod integration)
export type { SchemaValidator } from './core/Collection';

// Types
export type {
  Document,
  Query,
  QueryField,
  ComparisonOperators,
  UpdateOperators,
  FindOptions,
  Sort,
  SortOrder,
  CollectionOptions,
  SimpleDBOptions,
} from './types';

// Errors
export {
  SimpleDBError,
  DocumentNotFoundError,
  DuplicateKeyError,
  ValidationError,
  StorageError,
  CollectionError,
  IndexedDBNotAvailableError,
} from './errors';
export type { SchemaIssue } from './errors';

// Utilities
export { generateId, isValidId } from './utils';
