import type { Document, SimpleDBOptions } from '../types';
import { Storage } from './Storage';
import { Collection, SchemaValidator } from './Collection';
import { CollectionError } from '../errors';

/**
 * SimpleDB - A simple IndexedDB wrapper with MongoDB-like API
 */
export class SimpleDB {
  private readonly options: SimpleDBOptions;
  private readonly storage: Storage;
  private readonly collections: Map<string, Collection<Document>> = new Map();
  private connected: boolean = false;

  /**
   * Create a new SimpleDB instance
   * @param options Database configuration options
   */
  constructor(options: SimpleDBOptions | string) {
    if (typeof options === 'string') {
      this.options = { name: options };
    } else {
      this.options = options;
    }
    this.storage = new Storage(this.options.name, this.options.version);
  }

  /**
   * Connect to the database (initialize IndexedDB)
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    await this.storage.open();
    this.connected = true;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (!this.connected) return;

    this.storage.close();
    this.collections.clear();
    this.connected = false;
  }

  /**
   * Get or create a collection
   * @param name Collection name
   * @param options Collection options (including optional Zod schema)
   */
  collection<T extends Document>(
    name: string,
    options?: {
      schema?: SchemaValidator<T>;
      idGenerator?: () => string;
    }
  ): Collection<T> {
    if (!name || typeof name !== 'string') {
      throw new CollectionError('Collection name must be a non-empty string');
    }

    // Validate collection name
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name)) {
      throw new CollectionError(
        'Collection name must start with a letter or underscore and contain only letters, numbers, underscores, and hyphens'
      );
    }

    // If collection already exists, return it
    if (this.collections.has(name)) {
      return this.collections.get(name) as Collection<T>;
    }

    const collection = new Collection<T>(name, this.storage, {
      schema: options?.schema,
      idGenerator: options?.idGenerator,
    });

    this.collections.set(name, collection as Collection<Document>);
    return collection;
  }

  /**
   * Check if a collection exists
   */
  hasCollection(name: string): boolean {
    return this.storage.hasStore(name);
  }

  /**
   * Get list of all collection names
   */
  listCollections(): string[] {
    return this.storage.listStores();
  }

  /**
   * Drop a collection
   */
  async dropCollection(name: string): Promise<void> {
    const collection = this.collections.get(name);
    if (collection) {
      await collection.drop();
      this.collections.delete(name);
    } else {
      await this.storage.deleteStore(name);
    }
  }

  /**
   * Drop the entire database
   */
  async drop(): Promise<void> {
    await this.storage.deleteDatabase();
    this.collections.clear();
    this.connected = false;
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get database name
   */
  getName(): string {
    return this.options.name;
  }
}
