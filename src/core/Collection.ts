import type { Document, Query, FindOptions, UpdateOperators, Sort, SortOrder } from '../types';
import { QueryEngine } from './QueryEngine';
import { Storage } from './Storage';
import { DuplicateKeyError, ValidationError } from '../errors';
import { generateId, deepClone } from '../utils';

/**
 * Schema validator interface (compatible with Zod)
 */
export interface SchemaValidator<T> {
  safeParse(data: unknown): {
    success: true;
    data: T;
  } | {
    success: false;
    error: {
      issues: Array<{ path: PropertyKey[]; message: string; code?: string }>;
    };
  };
}

/**
 * Collection class for managing documents in IndexedDB
 */
export class Collection<T extends Document> {
  private readonly name: string;
  private readonly storage: Storage;
  private readonly queryEngine: QueryEngine<T>;
  private readonly idGenerator: () => string;
  private readonly schema?: SchemaValidator<T>;

  constructor(
    name: string,
    storage: Storage,
    options?: {
      idGenerator?: () => string;
      schema?: SchemaValidator<T>;
    }
  ) {
    this.name = name;
    this.storage = storage;
    this.queryEngine = new QueryEngine<T>();
    this.idGenerator = options?.idGenerator || generateId;
    this.schema = options?.schema;
  }

  /**
   * Validate a document against the schema (if defined)
   */
  private validate(doc: T): void {
    if (!this.schema) return;

    const result = this.schema.safeParse(doc);
    if (!result.success) {
      throw new ValidationError(this.name, result.error.issues);
    }
  }

  /**
   * Insert a single document
   */
  async insert(doc: Omit<T, '_id'> & { _id?: string }): Promise<T> {
    const id = doc._id || this.idGenerator();
    const newDoc = { ...doc, _id: id } as T;

    // Validate
    this.validate(newDoc);

    // Check for duplicates
    const existing = await this.storage.getById<T>(this.name, id);
    if (existing) {
      throw new DuplicateKeyError(this.name, id);
    }

    await this.storage.insert(this.name, newDoc);
    return deepClone(newDoc);
  }

  /**
   * Insert a single document without duplicate check (faster)
   */
  async insertFast(doc: Omit<T, '_id'> & { _id?: string }): Promise<T> {
    const id = doc._id || this.idGenerator();
    const newDoc = { ...doc, _id: id } as T;

    this.validate(newDoc);
    await this.storage.insert(this.name, newDoc);
    return deepClone(newDoc);
  }

  /**
   * Insert multiple documents
   */
  async insertMany(docs: (Omit<T, '_id'> & { _id?: string })[]): Promise<T[]> {
    const newDocs: T[] = [];

    for (const doc of docs) {
      const id = doc._id || this.idGenerator();
      const newDoc = { ...doc, _id: id } as T;
      this.validate(newDoc);
      newDocs.push(newDoc);
    }

    await this.storage.insertMany(this.name, newDocs);
    return newDocs.map((d) => deepClone(d));
  }

  /**
   * Find documents matching a query
   */
  async find(query?: Query<T>, options?: FindOptions<T>): Promise<T[]> {
    const allDocs = await this.storage.getAll<T>(this.name);
    let results = this.queryEngine.filter(allDocs, query);

    // Sort
    if (options?.sort) {
      results = this.sortDocuments(results, options.sort);
    }

    // Skip
    if (options?.skip) {
      results = results.slice(options.skip);
    }

    // Limit
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results.map((d) => deepClone(d));
  }

  /**
   * Find a single document matching a query
   */
  async findOne(query: Query<T>): Promise<T | null> {
    const results = await this.find(query, { limit: 1 });
    return results[0] || null;
  }

  /**
   * Find a document by ID
   */
  async findById(id: string): Promise<T | null> {
    const doc = await this.storage.getById<T>(this.name, id);
    return doc ? deepClone(doc) : null;
  }

  /**
   * Count documents matching a query
   */
  async count(query?: Query<T>): Promise<number> {
    const allDocs = await this.storage.getAll<T>(this.name);
    const results = this.queryEngine.filter(allDocs, query);
    return results.length;
  }

  /**
   * Update documents matching a query
   */
  async update(query: Query<T>, update: UpdateOperators<T> | Partial<T>): Promise<number> {
    const allDocs = await this.storage.getAll<T>(this.name);
    const matches = this.queryEngine.filter(allDocs, query);

    let updatedCount = 0;
    for (const doc of matches) {
      const updatedDoc = this.applyUpdate(doc, update);
      await this.storage.update(this.name, updatedDoc);
      updatedCount++;
    }

    return updatedCount;
  }

  /**
   * Update a single document matching a query
   */
  async updateOne(query: Query<T>, update: UpdateOperators<T> | Partial<T>): Promise<T | null> {
    const doc = await this.findOne(query);
    if (!doc) return null;

    const updatedDoc = this.applyUpdate(doc, update);
    await this.storage.update(this.name, updatedDoc);
    return deepClone(updatedDoc);
  }

  /**
   * Update a document by ID
   */
  async updateById(id: string, update: UpdateOperators<T> | Partial<T>): Promise<T | null> {
    const doc = await this.storage.getById<T>(this.name, id);
    if (!doc) return null;

    const updatedDoc = this.applyUpdate(doc, update);
    await this.storage.update(this.name, updatedDoc);
    return deepClone(updatedDoc);
  }

  /**
   * Delete documents matching a query
   */
  async delete(query: Query<T>): Promise<number> {
    const allDocs = await this.storage.getAll<T>(this.name);
    const matches = this.queryEngine.filter(allDocs, query);

    for (const doc of matches) {
      await this.storage.delete(this.name, doc._id);
    }

    return matches.length;
  }

  /**
   * Delete a single document matching a query
   */
  async deleteOne(query: Query<T>): Promise<T | null> {
    const doc = await this.findOne(query);
    if (!doc) return null;

    await this.storage.delete(this.name, doc._id);
    return doc;
  }

  /**
   * Delete a document by ID
   */
  async deleteById(id: string): Promise<T | null> {
    const doc = await this.storage.getById<T>(this.name, id);
    if (!doc) return null;

    await this.storage.delete(this.name, id);
    return deepClone(doc);
  }

  /**
   * Get all documents in the collection
   */
  async getAll(): Promise<T[]> {
    const docs = await this.storage.getAll<T>(this.name);
    return docs.map((d) => deepClone(d));
  }

  /**
   * Clear all documents in the collection
   */
  async clear(): Promise<void> {
    await this.storage.clear(this.name);
  }

  /**
   * Drop the collection
   */
  async drop(): Promise<void> {
    await this.storage.deleteStore(this.name);
  }

  /**
   * Get the collection name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Apply update operators to a document
   */
  private applyUpdate(doc: T, update: UpdateOperators<T> | Partial<T>): T {
    const result = { ...doc };

    // Check if it's using operators
    const hasOperators = Object.keys(update).some((key) => key.startsWith('$'));

    if (!hasOperators) {
      // Direct update
      Object.assign(result, update);
      return result;
    }

    const ops = update as UpdateOperators<T>;

    // $set - Set fields
    if (ops.$set) {
      Object.assign(result, ops.$set);
    }

    // $unset - Remove fields
    if (ops.$unset) {
      for (const key of Object.keys(ops.$unset)) {
        delete (result as Record<string, unknown>)[key];
      }
    }

    // $inc - Increment numeric fields
    if (ops.$inc) {
      for (const [key, value] of Object.entries(ops.$inc)) {
        const current = (result as Record<string, unknown>)[key];
        if (typeof current === 'number' && typeof value === 'number') {
          (result as Record<string, unknown>)[key] = current + value;
        }
      }
    }

    // $push - Add to array
    if (ops.$push) {
      for (const [key, value] of Object.entries(ops.$push)) {
        const current = (result as Record<string, unknown>)[key];
        if (Array.isArray(current)) {
          current.push(value);
        }
      }
    }

    // $pull - Remove from array
    if (ops.$pull) {
      for (const [key, value] of Object.entries(ops.$pull)) {
        const current = (result as Record<string, unknown>)[key];
        if (Array.isArray(current)) {
          (result as Record<string, unknown>)[key] = current.filter((v) => v !== value);
        }
      }
    }

    // $addToSet - Add to array if not exists
    if (ops.$addToSet) {
      for (const [key, value] of Object.entries(ops.$addToSet)) {
        const current = (result as Record<string, unknown>)[key];
        if (Array.isArray(current) && !current.includes(value)) {
          current.push(value);
        }
      }
    }

    return result;
  }

  /**
   * Sort documents by the specified sort options
   */
  private sortDocuments(docs: T[], sort: Sort<T>): T[] {
    const sortEntries = Object.entries(sort) as [keyof T, SortOrder][];

    return [...docs].sort((a, b) => {
      for (const [key, order] of sortEntries) {
        const aVal = a[key];
        const bVal = b[key];

        const direction = order === -1 || order === 'desc' ? -1 : 1;

        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
      }
      return 0;
    });
  }
}
