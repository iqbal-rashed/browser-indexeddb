/**
 * Base error class for BrowserDB errors
 */
export class BrowserDBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserDBError';
  }
}

/**
 * Error thrown when a document is not found
 */
export class DocumentNotFoundError extends BrowserDBError {
  constructor(collectionName: string, id?: string) {
    super(
      id
        ? `Document with id "${id}" not found in collection "${collectionName}"`
        : `Document not found in collection "${collectionName}"`
    );
    this.name = 'DocumentNotFoundError';
  }
}

/**
 * Error thrown when a duplicate key is detected
 */
export class DuplicateKeyError extends BrowserDBError {
  constructor(collectionName: string, id: string) {
    super(
      `Duplicate key error: document with id "${id}" already exists in collection "${collectionName}"`
    );
    this.name = 'DuplicateKeyError';
  }
}

/**
 * Schema issue type (compatible with Zod)
 */
export interface SchemaIssue {
  path: PropertyKey[];
  message: string;
  code?: string;
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends BrowserDBError {
  public readonly collectionName: string;
  public readonly issues: SchemaIssue[];
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(collectionName: string, issues: SchemaIssue[], field?: string, value?: unknown) {
    const issueMessages = issues.map((i) => `${String(i.path.join('.'))}: ${i.message}`).join('; ');
    super(`Validation failed for collection "${collectionName}": ${issueMessages}`);
    this.name = 'ValidationError';
    this.collectionName = collectionName;
    this.issues = issues;
    this.field = field;
    this.value = value;
  }
}

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends BrowserDBError {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

/**
 * Error thrown when collection operations fail
 */
export class CollectionError extends BrowserDBError {
  constructor(message: string) {
    super(message);
    this.name = 'CollectionError';
  }
}

/**
 * Error thrown when IndexedDB is not available
 */
export class IndexedDBNotAvailableError extends BrowserDBError {
  constructor() {
    super('IndexedDB is not available in this environment');
    this.name = 'IndexedDBNotAvailableError';
  }
}
