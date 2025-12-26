import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserDB, Collection, DuplicateKeyError } from '../src';

interface User {
  _id: string;
  name: string;
  email: string;
  age?: number;
  role?: string;
  tags?: string[];
  [key: string]: unknown;
}

describe('Collection', () => {
  let db: BrowserDB;
  let users: Collection<User>;
  let testId = 0;

  beforeEach(async () => {
    testId++;
    db = new BrowserDB(`collection-test-db-${testId}`);
    await db.connect();
    users = db.collection<User>('users');
  });

  afterEach(async () => {
    if (db && db.isConnected()) {
      await db.drop();
    }
  });

  describe('insert', () => {
    it('should insert a document', async () => {
      const user = await users.insert({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });

      expect(user._id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    it('should generate an _id if not provided', async () => {
      const user = await users.insert({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      expect(user._id).toBeDefined();
      expect(typeof user._id).toBe('string');
      expect(user._id.length).toBeGreaterThan(0);
    });

    it('should use provided _id', async () => {
      const user = await users.insert({
        _id: 'custom-id',
        name: 'Custom ID User',
        email: 'custom@example.com',
      });

      expect(user._id).toBe('custom-id');
    });

    it('should throw DuplicateKeyError for duplicate _id', async () => {
      await users.insert({
        _id: 'duplicate-id',
        name: 'User 1',
        email: 'user1@example.com',
      });

      await expect(
        users.insert({
          _id: 'duplicate-id',
          name: 'User 2',
          email: 'user2@example.com',
        })
      ).rejects.toThrow(DuplicateKeyError);
    });
  });

  describe('insertMany', () => {
    it('should insert multiple documents', async () => {
      const newUsers = await users.insertMany([
        { name: 'User 1', email: 'user1@example.com' },
        { name: 'User 2', email: 'user2@example.com' },
        { name: 'User 3', email: 'user3@example.com' },
      ]);

      expect(newUsers).toHaveLength(3);
      expect(newUsers[0]._id).toBeDefined();
      expect(newUsers[1]._id).toBeDefined();
      expect(newUsers[2]._id).toBeDefined();
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      await users.insertMany([
        { name: 'Alice', email: 'alice@example.com', age: 25, role: 'admin' },
        { name: 'Bob', email: 'bob@example.com', age: 30, role: 'user' },
        { name: 'Charlie', email: 'charlie@example.com', age: 35, role: 'user' },
      ]);
    });

    it('should find all documents without query', async () => {
      const result = await users.find();
      expect(result).toHaveLength(3);
    });

    it('should find documents with simple query', async () => {
      const result = await users.find({ role: 'user' });
      expect(result).toHaveLength(2);
    });

    it('should find documents with $gt operator', async () => {
      const result = await users.find({ age: { $gt: 25 } });
      expect(result).toHaveLength(2);
    });

    it('should find documents with $in operator', async () => {
      const result = await users.find({ name: { $in: ['Alice', 'Bob'] } });
      expect(result).toHaveLength(2);
    });

    it('should support sort option', async () => {
      const result = await users.find({}, { sort: { age: -1 } });
      expect(result[0].name).toBe('Charlie');
      expect(result[2].name).toBe('Alice');
    });

    it('should support limit option', async () => {
      const result = await users.find({}, { limit: 2 });
      expect(result).toHaveLength(2);
    });

    it('should support skip option', async () => {
      const result = await users.find({}, { skip: 1 });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    beforeEach(async () => {
      await users.insertMany([
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ]);
    });

    it('should find a single document', async () => {
      const user = await users.findOne({ name: 'Alice' });
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Alice');
    });

    it('should return null if not found', async () => {
      const user = await users.findOne({ name: 'Unknown' });
      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a document by ID', async () => {
      const inserted = await users.insert({
        _id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
      });

      const found = await users.findById('test-id');
      expect(found).not.toBeNull();
      expect(found?._id).toBe(inserted._id);
    });

    it('should return null for non-existent ID', async () => {
      const found = await users.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await users.insertMany([
        { _id: '1', name: 'Alice', email: 'alice@example.com', age: 25 },
        { _id: '2', name: 'Bob', email: 'bob@example.com', age: 30 },
      ]);
    });

    it('should update documents with $set', async () => {
      const count = await users.update({ name: 'Alice' }, { $set: { age: 26 } });
      expect(count).toBe(1);

      const alice = await users.findById('1');
      expect(alice?.age).toBe(26);
    });

    it('should update documents with $inc', async () => {
      await users.update({ name: 'Alice' }, { $inc: { age: 5 } });
      const alice = await users.findById('1');
      expect(alice?.age).toBe(30);
    });

    it('should update multiple documents', async () => {
      const count = await users.update({}, { $set: { role: 'member' } });
      expect(count).toBe(2);
    });
  });

  describe('updateById', () => {
    it('should update a document by ID', async () => {
      await users.insert({ _id: 'test', name: 'Test', email: 'test@example.com' });

      const updated = await users.updateById('test', { $set: { name: 'Updated' } });
      expect(updated?.name).toBe('Updated');
    });

    it('should return null for non-existent ID', async () => {
      const result = await users.updateById('non-existent', { $set: { name: 'Test' } });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await users.insertMany([
        { name: 'Alice', email: 'alice@example.com', role: 'admin' },
        { name: 'Bob', email: 'bob@example.com', role: 'user' },
        { name: 'Charlie', email: 'charlie@example.com', role: 'user' },
      ]);
    });

    it('should delete matching documents', async () => {
      const count = await users.delete({ role: 'user' });
      expect(count).toBe(2);

      const remaining = await users.getAll();
      expect(remaining).toHaveLength(1);
    });
  });

  describe('deleteById', () => {
    it('should delete a document by ID', async () => {
      await users.insert({ _id: 'delete-me', name: 'Delete Me', email: 'delete@example.com' });

      const deleted = await users.deleteById('delete-me');
      expect(deleted).not.toBeNull();
      expect(deleted?.name).toBe('Delete Me');

      const found = await users.findById('delete-me');
      expect(found).toBeNull();
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      await users.insertMany([
        { name: 'User 1', email: 'user1@example.com', role: 'admin' },
        { name: 'User 2', email: 'user2@example.com', role: 'user' },
        { name: 'User 3', email: 'user3@example.com', role: 'user' },
      ]);
    });

    it('should count all documents', async () => {
      const count = await users.count();
      expect(count).toBe(3);
    });

    it('should count filtered documents', async () => {
      const count = await users.count({ role: 'user' });
      expect(count).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all documents', async () => {
      await users.insertMany([
        { name: 'User 1', email: 'user1@example.com' },
        { name: 'User 2', email: 'user2@example.com' },
      ]);

      await users.clear();
      const count = await users.count();
      expect(count).toBe(0);
    });
  });

  describe('array operations', () => {
    it('should support $push operator', async () => {
      await users.insert({
        _id: 'array-test',
        name: 'Array Test',
        email: 'array@example.com',
        tags: ['initial'],
      });

      await users.updateById('array-test', { $push: { tags: 'new-tag' } });

      const user = await users.findById('array-test');
      expect(user?.tags).toContain('new-tag');
      expect(user?.tags).toHaveLength(2);
    });

    it('should support $pull operator', async () => {
      await users.insert({
        _id: 'pull-test',
        name: 'Pull Test',
        email: 'pull@example.com',
        tags: ['keep', 'remove'],
      });

      await users.updateById('pull-test', { $pull: { tags: 'remove' } });

      const user = await users.findById('pull-test');
      expect(user?.tags).not.toContain('remove');
      expect(user?.tags).toHaveLength(1);
    });

    it('should support $addToSet operator', async () => {
      await users.insert({
        _id: 'addtoset-test',
        name: 'AddToSet Test',
        email: 'addtoset@example.com',
        tags: ['existing'],
      });

      await users.updateById('addtoset-test', { $addToSet: { tags: 'new' } });
      let user = await users.findById('addtoset-test');
      expect(user?.tags).toHaveLength(2);

      await users.updateById('addtoset-test', { $addToSet: { tags: 'existing' } });
      user = await users.findById('addtoset-test');
      expect(user?.tags).toHaveLength(2);
    });
  });
});
