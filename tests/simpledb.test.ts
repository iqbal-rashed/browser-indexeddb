import { describe, it, expect, afterEach } from 'vitest';
import { SimpleDB, CollectionError } from '../src';

describe('SimpleDB', () => {
  let db: SimpleDB;

  afterEach(async () => {
    if (db) {
      await db.drop();
    }
  });

  describe('constructor', () => {
    it('should accept string as database name', () => {
      db = new SimpleDB('test-db');
      expect(db.getName()).toBe('test-db');
    });

    it('should accept options object', () => {
      db = new SimpleDB({ name: 'test-db', version: 2 });
      expect(db.getName()).toBe('test-db');
    });
  });

  describe('connect/close', () => {
    it('should connect and close', async () => {
      db = new SimpleDB('test-db');
      expect(db.isConnected()).toBe(false);

      await db.connect();
      expect(db.isConnected()).toBe(true);

      db.close();
      expect(db.isConnected()).toBe(false);
    });

    it('should handle multiple connect calls', async () => {
      db = new SimpleDB('test-db');
      await db.connect();
      await db.connect(); // Should not throw
      expect(db.isConnected()).toBe(true);
    });
  });

  describe('collection', () => {
    it('should create and return a collection', async () => {
      db = new SimpleDB('test-db');
      await db.connect();

      const users = db.collection('users');
      expect(users).toBeDefined();
      expect(users.getName()).toBe('users');
    });

    it('should return same collection instance', async () => {
      db = new SimpleDB('test-db');
      await db.connect();

      const users1 = db.collection('users');
      const users2 = db.collection('users');
      expect(users1).toBe(users2);
    });

    it('should throw for invalid collection name', async () => {
      db = new SimpleDB('test-db');
      await db.connect();

      expect(() => db.collection('')).toThrow(CollectionError);
      expect(() => db.collection('123invalid')).toThrow(CollectionError);
    });
  });

  describe('dropCollection', () => {
    it('should drop a collection', async () => {
      db = new SimpleDB('test-db');
      await db.connect();

      const users = db.collection('users');
      await users.insert({ name: 'Test', email: 'test@test.com' });

      await db.dropCollection('users');
      expect(db.hasCollection('users')).toBe(false);
    });
  });

  describe('drop', () => {
    it('should drop the entire database', async () => {
      db = new SimpleDB('test-db');
      await db.connect();

      db.collection('users');
      db.collection('posts');

      await db.drop();
      expect(db.isConnected()).toBe(false);
    });
  });
});
