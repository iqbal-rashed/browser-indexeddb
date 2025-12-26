import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserDB, CollectionError } from '../src';
describe('BrowserDB', () => {
  let db: BrowserDB | null = null;

  afterEach(async () => {
    if (db && db.isConnected()) {
      await db.drop();
    }
    db = null;
  });

  describe('constructor', () => {
    it('should accept string as database name', async () => {
      db = new BrowserDB('test-db-1');
      await db.connect();
      expect(db.getName()).toBe('test-db-1');
    });

    it('should accept options object', async () => {
      db = new BrowserDB({ name: 'test-db-2', version: 1 });
      await db.connect();
      expect(db.getName()).toBe('test-db-2');
    });
  });

  describe('connect/close', () => {
    it('should auto-connect and be connected after await', async () => {
      db = new BrowserDB('test-db-3');
      await db.connect();
      expect(db.isConnected()).toBe(true);
    });

    it('should close connection', async () => {
      db = new BrowserDB('test-db-4');
      await db.connect();
      expect(db.isConnected()).toBe(true);

      db.close();
      expect(db.isConnected()).toBe(false);
    });

    it('should handle multiple connect calls', async () => {
      db = new BrowserDB('test-db-5');
      await db.connect();
      await db.connect();
      expect(db.isConnected()).toBe(true);
    });
  });

  describe('collection', () => {
    beforeEach(async () => {
      db = new BrowserDB('test-db-6');
      await db.connect();
    });

    it('should create and return a collection', () => {
      const users = db!.collection('users');
      expect(users).toBeDefined();
      expect(users.getName()).toBe('users');
    });

    it('should return same collection instance', () => {
      const users1 = db!.collection('users');
      const users2 = db!.collection('users');
      expect(users1).toBe(users2);
    });

    it('should throw for invalid collection name', () => {
      expect(() => db!.collection('')).toThrow(CollectionError);
      expect(() => db!.collection('123invalid')).toThrow(CollectionError);
    });
  });

  describe('dropCollection', () => {
    it('should drop a collection', async () => {
      db = new BrowserDB('test-db-7');
      await db.connect();

      const users = db.collection('users');
      await users.insert({ name: 'Test', email: 'test@test.com' });

      await db.dropCollection('users');
      expect(db.hasCollection('users')).toBe(false);
    });
  });

  describe('drop', () => {
    it('should drop the entire database', async () => {
      db = new BrowserDB('test-db-8');
      await db.connect();

      db.collection('users');
      db.collection('posts');

      await db.drop();
      expect(db.isConnected()).toBe(false);
      db = null; // Already dropped
    });
  });
});
