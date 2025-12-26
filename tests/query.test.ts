import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { QueryEngine } from '../src/core/QueryEngine';

interface TestDoc {
  _id: string;
  name: string;
  age?: number;
  email?: string;
  role?: string;
  active?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

describe('QueryEngine', () => {
  let engine: QueryEngine<TestDoc>;
  let docs: TestDoc[];

  beforeEach(() => {
    engine = new QueryEngine<TestDoc>();
    docs = [
      {
        _id: '1',
        name: 'Alice',
        age: 25,
        email: 'alice@test.com',
        role: 'admin',
        active: true,
        tags: ['a', 'b'],
      },
      {
        _id: '2',
        name: 'Bob',
        age: 30,
        email: 'bob@test.com',
        role: 'user',
        active: true,
        tags: ['b', 'c'],
      },
      {
        _id: '3',
        name: 'Charlie',
        age: 35,
        email: 'charlie@test.com',
        role: 'user',
        active: false,
        tags: ['c'],
      },
      { _id: '4', name: 'Diana', age: 28, role: 'guest', active: true },
    ];
  });

  describe('$eq operator', () => {
    it('should match equal values', () => {
      const results = engine.filter(docs, { name: { $eq: 'Alice' } });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice');
    });

    it('should match with implicit equality', () => {
      const results = engine.filter(docs, { name: 'Alice' });
      expect(results).toHaveLength(1);
    });
  });

  describe('$ne operator', () => {
    it('should match not equal values', () => {
      const results = engine.filter(docs, { role: { $ne: 'admin' } });
      expect(results).toHaveLength(3);
    });
  });

  describe('$gt/$gte/$lt/$lte operators', () => {
    it('should match $gt', () => {
      const results = engine.filter(docs, { age: { $gt: 28 } });
      expect(results).toHaveLength(2);
    });

    it('should match $gte', () => {
      const results = engine.filter(docs, { age: { $gte: 28 } });
      expect(results).toHaveLength(3);
    });

    it('should match $lt', () => {
      const results = engine.filter(docs, { age: { $lt: 30 } });
      expect(results).toHaveLength(2);
    });

    it('should match $lte', () => {
      const results = engine.filter(docs, { age: { $lte: 30 } });
      expect(results).toHaveLength(3);
    });
  });

  describe('$in/$nin operators', () => {
    it('should match $in', () => {
      const results = engine.filter(docs, { role: { $in: ['admin', 'guest'] } });
      expect(results).toHaveLength(2);
    });

    it('should match $nin', () => {
      const results = engine.filter(docs, { role: { $nin: ['admin', 'guest'] } });
      expect(results).toHaveLength(2);
    });
  });

  describe('$regex operator', () => {
    it('should match with RegExp', () => {
      const results = engine.filter(docs, { email: { $regex: /@test\.com$/ } });
      expect(results).toHaveLength(3);
    });

    it('should match with string pattern', () => {
      const results = engine.filter(docs, { name: { $regex: '^A' } });
      expect(results).toHaveLength(1);
    });
  });

  describe('$exists operator', () => {
    it('should match existing fields', () => {
      const results = engine.filter(docs, { email: { $exists: true } });
      expect(results).toHaveLength(3);
    });

    it('should match non-existing fields', () => {
      const results = engine.filter(docs, { email: { $exists: false } });
      expect(results).toHaveLength(1);
    });
  });

  describe('$startsWith/$endsWith operators', () => {
    it('should match $startsWith', () => {
      const results = engine.filter(docs, { name: { $startsWith: 'A' } });
      expect(results).toHaveLength(1);
    });

    it('should match $endsWith', () => {
      const results = engine.filter(docs, { email: { $endsWith: '.com' } });
      expect(results).toHaveLength(3);
    });
  });

  describe('$contains operator', () => {
    it('should match array contains', () => {
      const results = engine.filter(docs, { tags: { $contains: 'b' } });
      expect(results).toHaveLength(2);
    });
  });

  describe('logical operators', () => {
    it('should match $and', () => {
      const results = engine.filter(docs, {
        $and: [{ role: 'user' }, { active: true }],
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bob');
    });

    it('should match $or', () => {
      const results = engine.filter(docs, {
        $or: [{ role: 'admin' }, { role: 'guest' }],
      });
      expect(results).toHaveLength(2);
    });

    it('should match $not', () => {
      const results = engine.filter(docs, {
        $not: { role: 'user' },
      });
      expect(results).toHaveLength(2);
    });
  });

  describe('combined queries', () => {
    it('should match multiple conditions', () => {
      const results = engine.filter(docs, {
        age: { $gte: 25, $lte: 30 },
        active: true,
      });
      expect(results).toHaveLength(3);
    });
  });
});
