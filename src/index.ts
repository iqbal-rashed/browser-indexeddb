// Main exports
export { BrowserDB } from './core/BrowserDB';
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
  BrowserDBOptions,
} from './types';

// Errors
export {
  BrowserDBError,
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

// Auto-register to window for CDN usage
import { BrowserDB } from './core/BrowserDB';
import { Collection } from './core/Collection';
import {
  BrowserDBError,
  DocumentNotFoundError,
  DuplicateKeyError,
  ValidationError,
  StorageError,
  CollectionError,
  IndexedDBNotAvailableError,
} from './errors';
import { generateId, isValidId } from './utils';

if (typeof window !== 'undefined') {
  const w = window as any;
  w.BrowserDB = BrowserDB;
  w.Collection = Collection;
  w.BrowserDBError = BrowserDBError;
  w.DocumentNotFoundError = DocumentNotFoundError;
  w.DuplicateKeyError = DuplicateKeyError;
  w.ValidationError = ValidationError;
  w.StorageError = StorageError;
  w.CollectionError = CollectionError;
  w.IndexedDBNotAvailableError = IndexedDBNotAvailableError;
  w.generateId = generateId;
  w.isValidId = isValidId;
}
