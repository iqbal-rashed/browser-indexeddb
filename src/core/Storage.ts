import type { Document } from '../types';
import { StorageError, IndexedDBNotAvailableError } from '../errors';

/**
 * Storage - IndexedDB storage adapter
 */
export class Storage {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly version: number;
  private readonly stores: Set<string> = new Set();

  constructor(dbName: string, version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  /**
   * Check if IndexedDB is available
   */
  private checkIndexedDB(): void {
    if (typeof indexedDB === 'undefined') {
      throw new IndexedDBNotAvailableError();
    }
  }

  /**
   * Open the database connection
   */
  async open(storeNames?: string[]): Promise<void> {
    this.checkIndexedDB();

    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new StorageError(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        // Track existing stores
        Array.from(this.db.objectStoreNames).forEach((name) => this.stores.add(name));
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if provided
        if (storeNames) {
          for (const storeName of storeNames) {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: '_id' });
              this.stores.add(storeName);
            }
          }
        }
      };
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Ensure a collection/store exists
   */
  async ensureStore(storeName: string): Promise<void> {
    if (this.stores.has(storeName)) return;

    // Need to close and reopen with new version to create store
    const newVersion = this.db ? this.db.version + 1 : this.version;
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, newVersion);

      request.onerror = () => {
        reject(new StorageError(`Failed to create store: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.stores.add(storeName);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: '_id' });
        }
      };
    });
  }

  /**
   * Get a transaction for a store
   */
  private getTransaction(
    storeName: string,
    mode: IDBTransactionMode
  ): { transaction: IDBTransaction; store: IDBObjectStore } {
    if (!this.db) {
      throw new StorageError('Database not connected');
    }

    const transaction = this.db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    return { transaction, store };
  }

  /**
   * Insert a document
   */
  async insert<T extends Document>(storeName: string, doc: T): Promise<void> {
    await this.ensureStore(storeName);

    return new Promise((resolve, reject) => {
      const { store } = this.getTransaction(storeName, 'readwrite');
      const request = store.add(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new StorageError(`Failed to insert document: ${request.error?.message}`));
      };
    });
  }

  /**
   * Insert multiple documents
   */
  async insertMany<T extends Document>(storeName: string, docs: T[]): Promise<void> {
    await this.ensureStore(storeName);

    return new Promise((resolve, reject) => {
      const { transaction, store } = this.getTransaction(storeName, 'readwrite');

      for (const doc of docs) {
        store.add(doc);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        reject(new StorageError(`Failed to insert documents: ${transaction.error?.message}`));
      };
    });
  }

  /**
   * Get a document by ID
   */
  async getById<T extends Document>(storeName: string, id: string): Promise<T | null> {
    if (!this.stores.has(storeName)) return null;

    return new Promise((resolve, reject) => {
      const { store } = this.getTransaction(storeName, 'readonly');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        reject(new StorageError(`Failed to get document: ${request.error?.message}`));
      };
    });
  }

  /**
   * Get all documents from a store
   */
  async getAll<T extends Document>(storeName: string): Promise<T[]> {
    if (!this.stores.has(storeName)) return [];

    return new Promise((resolve, reject) => {
      const { store } = this.getTransaction(storeName, 'readonly');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        reject(new StorageError(`Failed to get documents: ${request.error?.message}`));
      };
    });
  }

  /**
   * Update a document
   */
  async update<T extends Document>(storeName: string, doc: T): Promise<void> {
    await this.ensureStore(storeName);

    return new Promise((resolve, reject) => {
      const { store } = this.getTransaction(storeName, 'readwrite');
      const request = store.put(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new StorageError(`Failed to update document: ${request.error?.message}`));
      };
    });
  }

  /**
   * Delete a document by ID
   */
  async delete(storeName: string, id: string): Promise<void> {
    if (!this.stores.has(storeName)) return;

    return new Promise((resolve, reject) => {
      const { store } = this.getTransaction(storeName, 'readwrite');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new StorageError(`Failed to delete document: ${request.error?.message}`));
      };
    });
  }

  /**
   * Clear all documents from a store
   */
  async clear(storeName: string): Promise<void> {
    if (!this.stores.has(storeName)) return;

    return new Promise((resolve, reject) => {
      const { store } = this.getTransaction(storeName, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new StorageError(`Failed to clear store: ${request.error?.message}`));
      };
    });
  }

  /**
   * Delete a store
   */
  async deleteStore(storeName: string): Promise<void> {
    if (!this.stores.has(storeName)) return;

    const newVersion = this.db ? this.db.version + 1 : this.version;
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, newVersion);

      request.onerror = () => {
        reject(new StorageError(`Failed to delete store: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.stores.delete(storeName);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName);
        }
      };
    });
  }

  /**
   * Check if a store exists
   */
  hasStore(storeName: string): boolean {
    return this.stores.has(storeName);
  }

  /**
   * List all store names
   */
  listStores(): string[] {
    return Array.from(this.stores);
  }

  /**
   * Delete the entire database
   */
  async deleteDatabase(): Promise<void> {
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        this.stores.clear();
        resolve();
      };
      request.onerror = () => {
        reject(new StorageError(`Failed to delete database: ${request.error?.message}`));
      };
    });
  }
}
