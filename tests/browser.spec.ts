import { test, expect } from '@playwright/test';

test.describe('SimpleDB', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).SimpleDB !== 'undefined', {
      timeout: 5000,
    });
  });

  test.describe('constructor and connection', () => {
    test('should accept string as database name', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const name = db.getName();
        await db.drop();
        return { name };
      });
      expect(result.name).toBe('test-db');
    });

    test('should auto-connect on instantiation', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const connected = db.isConnected();
        await db.drop();
        return { connected };
      });
      expect(result.connected).toBe(true);
    });

    test('should close connection', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        db.close();
        const connected = db.isConnected();
        return { connected };
      });
      expect(result.connected).toBe(false);
    });
  });

  test.describe('collection management', () => {
    test('should create and return a collection', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        const name = users.getName();
        await db.drop();
        return { name, defined: !!users };
      });
      expect(result.defined).toBe(true);
      expect(result.name).toBe('users');
    });

    test('should return same collection instance', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users1 = db.collection('users');
        const users2 = db.collection('users');
        const same = users1 === users2;
        await db.drop();
        return { same };
      });
      expect(result.same).toBe(true);
    });

    test('should throw for invalid collection name', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        let error1 = null;
        let error2 = null;
        try {
          db.collection('');
        } catch (e: any) {
          error1 = e.message;
        }
        try {
          db.collection('123invalid');
        } catch (e: any) {
          error2 = e.message;
        }
        await db.drop();
        return { error1, error2 };
      });
      expect(result.error1).toBeTruthy();
      expect(result.error2).toBeTruthy();
    });
  });
});

test.describe('Collection CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).SimpleDB !== 'undefined', {
      timeout: 5000,
    });
  });

  test.describe('insert', () => {
    test('should insert a document and generate _id', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        const user = await users.insert({ name: 'John', email: 'john@example.com', age: 30 });
        await db.drop();
        return { hasId: !!user._id, name: user.name };
      });
      expect(result.hasId).toBe(true);
      expect(result.name).toBe('John');
    });

    test('should use provided _id', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        const user = await users.insert({
          _id: 'custom-id',
          name: 'Jane',
          email: 'jane@example.com',
        });
        await db.drop();
        return { id: user._id };
      });
      expect(result.id).toBe('custom-id');
    });

    test('should throw DuplicateKeyError for duplicate _id', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB, DuplicateKeyError: _DuplicateKeyError } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insert({ _id: 'dup-id', name: 'User 1', email: 'u1@example.com' });
        let error = null;
        try {
          await users.insert({ _id: 'dup-id', name: 'User 2', email: 'u2@example.com' });
        } catch (e: any) {
          error = e.name;
        }
        await db.drop();
        return { error };
      });
      expect(result.error).toBe('DuplicateKeyError');
    });

    test('should insert multiple documents', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        const newUsers = await users.insertMany([
          { name: 'User 1', email: 'u1@example.com' },
          { name: 'User 2', email: 'u2@example.com' },
          { name: 'User 3', email: 'u3@example.com' },
        ]);
        await db.drop();
        return { count: newUsers.length, allHaveIds: newUsers.every((u: any) => !!u._id) };
      });
      expect(result.count).toBe(3);
      expect(result.allHaveIds).toBe(true);
    });
  });

  test.describe('find', () => {
    test('should find all documents', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insertMany([
          { name: 'Alice', email: 'alice@example.com', age: 25 },
          { name: 'Bob', email: 'bob@example.com', age: 30 },
        ]);
        const all = await users.find();
        await db.drop();
        return { count: all.length };
      });
      expect(result.count).toBe(2);
    });

    test('should find by query', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insertMany([
          { name: 'Alice', role: 'admin' },
          { name: 'Bob', role: 'user' },
          { name: 'Charlie', role: 'user' },
        ]);
        const admins = await users.find({ role: 'admin' });
        const regularUsers = await users.find({ role: 'user' });
        await db.drop();
        return { adminCount: admins.length, userCount: regularUsers.length };
      });
      expect(result.adminCount).toBe(1);
      expect(result.userCount).toBe(2);
    });

    test('should findOne', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insert({ name: 'Alice', email: 'alice@example.com' });
        const found = await users.findOne({ name: 'Alice' });
        const notFound = await users.findOne({ name: 'Unknown' });
        await db.drop();
        return { foundName: found?.name, notFound: notFound };
      });
      expect(result.foundName).toBe('Alice');
      expect(result.notFound).toBeNull();
    });

    test('should findById', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        const _inserted = await users.insert({ _id: 'test-id', name: 'Test' });
        const found = await users.findById('test-id');
        const notFound = await users.findById('non-existent');
        await db.drop();
        return { foundId: found?._id, notFound: notFound };
      });
      expect(result.foundId).toBe('test-id');
      expect(result.notFound).toBeNull();
    });
  });

  test.describe('update', () => {
    test('should update with $set', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insert({ _id: 'u1', name: 'Alice', age: 25 });
        await users.update({ name: 'Alice' }, { $set: { age: 26 } });
        const updated = await users.findById('u1');
        await db.drop();
        return { age: updated?.age };
      });
      expect(result.age).toBe(26);
    });

    test('should update with $inc', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insert({ _id: 'u1', name: 'Alice', age: 25 });
        await users.update({ name: 'Alice' }, { $inc: { age: 5 } });
        const updated = await users.findById('u1');
        await db.drop();
        return { age: updated?.age };
      });
      expect(result.age).toBe(30);
    });

    test('should updateById', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insert({ _id: 'test', name: 'Test', email: 'test@example.com' });
        const updated = await users.updateById('test', { $set: { name: 'Updated' } });
        await db.drop();
        return { name: updated?.name };
      });
      expect(result.name).toBe('Updated');
    });
  });

  test.describe('delete', () => {
    test('should delete by query', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insertMany([
          { name: 'Alice', role: 'admin' },
          { name: 'Bob', role: 'user' },
          { name: 'Charlie', role: 'user' },
        ]);
        const deleteCount = await users.delete({ role: 'user' });
        const remaining = await users.getAll();
        await db.drop();
        return { deleteCount, remainingCount: remaining.length };
      });
      expect(result.deleteCount).toBe(2);
      expect(result.remainingCount).toBe(1);
    });

    test('should deleteById', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insert({ _id: 'delete-me', name: 'Delete Me' });
        const deleted = await users.deleteById('delete-me');
        const found = await users.findById('delete-me');
        await db.drop();
        return { deletedName: deleted?.name, found: found };
      });
      expect(result.deletedName).toBe('Delete Me');
      expect(result.found).toBeNull();
    });

    test('should clear all documents', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { SimpleDB } = window as any;
        const db = new SimpleDB('test-db');
        await db.connect();
        const users = db.collection('users');
        await users.insertMany([{ name: 'User 1' }, { name: 'User 2' }]);
        await users.clear();
        const count = await users.count();
        await db.drop();
        return { count };
      });
      expect(result.count).toBe(0);
    });
  });
});

test.describe('Query Operators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).SimpleDB !== 'undefined', {
      timeout: 5000,
    });
  });

  test('should support $gt, $gte, $lt, $lte', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { SimpleDB } = window as any;
      const db = new SimpleDB('test-db');
      await db.connect();
      const users = db.collection('users');
      await users.insertMany([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 },
        { name: 'Diana', age: 28 },
      ]);
      const gt28 = await users.find({ age: { $gt: 28 } });
      const gte28 = await users.find({ age: { $gte: 28 } });
      const lt30 = await users.find({ age: { $lt: 30 } });
      const lte30 = await users.find({ age: { $lte: 30 } });
      await db.drop();
      return {
        gt28: gt28.length,
        gte28: gte28.length,
        lt30: lt30.length,
        lte30: lte30.length,
      };
    });
    expect(result.gt28).toBe(2);
    expect(result.gte28).toBe(3);
    expect(result.lt30).toBe(2);
    expect(result.lte30).toBe(3);
  });

  test('should support $in and $nin', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { SimpleDB } = window as any;
      const db = new SimpleDB('test-db');
      await db.connect();
      const users = db.collection('users');
      await users.insertMany([
        { name: 'Alice', role: 'admin' },
        { name: 'Bob', role: 'user' },
        { name: 'Charlie', role: 'guest' },
      ]);
      const inResult = await users.find({ role: { $in: ['admin', 'guest'] } });
      const ninResult = await users.find({ role: { $nin: ['admin', 'guest'] } });
      await db.drop();
      return { inCount: inResult.length, ninCount: ninResult.length };
    });
    expect(result.inCount).toBe(2);
    expect(result.ninCount).toBe(1);
  });

  test('should support $regex', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { SimpleDB } = window as any;
      const db = new SimpleDB('test-db');
      await db.connect();
      const users = db.collection('users');
      await users.insertMany([
        { name: 'Alice', email: 'alice@gmail.com' },
        { name: 'Bob', email: 'bob@outlook.com' },
        { name: 'Charlie', email: 'charlie@gmail.com' },
      ]);
      const gmail = await users.find({ email: { $regex: /@gmail\.com$/ } });
      await db.drop();
      return { gmailCount: gmail.length };
    });
    expect(result.gmailCount).toBe(2);
  });

  test('should support $exists', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { SimpleDB } = window as any;
      const db = new SimpleDB('test-db');
      await db.connect();
      const users = db.collection('users');
      await users.insertMany([
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
        { name: 'Charlie' },
      ]);
      const withEmail = await users.find({ email: { $exists: true } });
      const withoutEmail = await users.find({ email: { $exists: false } });
      await db.drop();
      return { withEmail: withEmail.length, withoutEmail: withoutEmail.length };
    });
    expect(result.withEmail).toBe(2);
    expect(result.withoutEmail).toBe(1);
  });

  test('should support $or and $and', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { SimpleDB } = window as any;
      const db = new SimpleDB('test-db');
      await db.connect();
      const users = db.collection('users');
      await users.insertMany([
        { name: 'Alice', role: 'admin', active: true },
        { name: 'Bob', role: 'user', active: true },
        { name: 'Charlie', role: 'user', active: false },
      ]);
      const orResult = await users.find({ $or: [{ role: 'admin' }, { active: false }] });
      const andResult = await users.find({ $and: [{ role: 'user' }, { active: true }] });
      await db.drop();
      return { orCount: orResult.length, andCount: andResult.length };
    });
    expect(result.orCount).toBe(2);
    expect(result.andCount).toBe(1);
  });
});

test.describe('Array Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).SimpleDB !== 'undefined', {
      timeout: 5000,
    });
  });

  test('should support $push', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { SimpleDB } = window as any;
      const db = new SimpleDB('test-db');
      await db.connect();
      const users = db.collection('users');
      await users.insert({ _id: 'u1', name: 'Alice', tags: ['initial'] });
      await users.updateById('u1', { $push: { tags: 'new-tag' } });
      const updated = await users.findById('u1');
      await db.drop();
      return { tags: updated?.tags };
    });
    expect(result.tags).toContain('new-tag');
    expect(result.tags.length).toBe(2);
  });

  test('should support $pull', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { SimpleDB } = window as any;
      const db = new SimpleDB('test-db');
      await db.connect();
      const users = db.collection('users');
      await users.insert({ _id: 'u1', name: 'Alice', tags: ['keep', 'remove'] });
      await users.updateById('u1', { $pull: { tags: 'remove' } });
      const updated = await users.findById('u1');
      await db.drop();
      return { tags: updated?.tags };
    });
    expect(result.tags).not.toContain('remove');
    expect(result.tags.length).toBe(1);
  });

  test('should support $addToSet', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { SimpleDB } = window as any;
      const db = new SimpleDB('test-db');
      await db.connect();
      const users = db.collection('users');
      await users.insert({ _id: 'u1', name: 'Alice', tags: ['existing'] });
      await users.updateById('u1', { $addToSet: { tags: 'new' } });
      await users.updateById('u1', { $addToSet: { tags: 'existing' } });
      const updated = await users.findById('u1');
      await db.drop();
      return { tags: updated?.tags };
    });
    expect(result.tags.length).toBe(2);
    expect(result.tags).toContain('existing');
    expect(result.tags).toContain('new');
  });
});
