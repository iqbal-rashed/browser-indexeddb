# simple-indexed-db

[![npm version](https://img.shields.io/npm/v/simple-indexed-db.svg)](https://www.npmjs.com/package/simple-indexed-db)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A simple, type-safe IndexedDB wrapper with MongoDB-like API for browser applications. Zero dependencies, fully typed, with familiar query operators.

## ✨ Features

- 🚀 **Zero Dependencies** - No external libraries required
- 📦 **Dual Module Support** - Works with both ESM and CommonJS bundlers
- 🔒 **Type-Safe** - Full TypeScript support with generics
- 🔍 **MongoDB-like Queries** - Familiar query operators (`$eq`, `$gt`, `$in`, `$regex`, etc.)
- ⚡ **Fast & Efficient** - Direct IndexedDB access with minimal overhead
- ✅ **Schema Validation** - Optional Zod integration for document validation
- 🌐 **Browser Native** - Uses IndexedDB for persistent storage

## 📦 Installation

```bash
npm install simple-indexed-db
```

```bash
yarn add simple-indexed-db
```

For schema validation (optional):
```bash
npm install zod
```

## 🚀 Quick Start

```typescript
import { SimpleDB, Document } from 'simple-indexed-db';

interface User extends Document {
  _id: string;
  name: string;
  email: string;
  age: number;
}

const db = new SimpleDB('my-app');
await db.connect();

const users = db.collection<User>('users');

// Insert
const user = await users.insert({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
});

// Find
const found = await users.findOne({ email: 'john@example.com' });

// Update
await users.updateById(user._id, { $set: { age: 31 } });

// Delete
await users.deleteById(user._id);

db.close();
```

## 📖 API Reference

### SimpleDB Methods

```typescript
const db = new SimpleDB('database-name');

await db.connect();                    // Initialize database
db.close();                            // Close connection
db.collection<T>('name', {schema?});   // Get typed collection
db.listCollections();                  // List all collections
db.hasCollection('name');              // Check if exists
await db.dropCollection('name');       // Delete collection
await db.drop();                       // Delete entire database
db.isConnected();                      // Check connection status
```

### Collection Methods

```typescript
// Insert
await collection.insert(doc);            // With duplicate check
await collection.insertFast(doc);        // Skip duplicate check (faster)
await collection.insertMany(docs);       // Bulk insert

// Find
await collection.find(query?, options?); // Find matching docs
await collection.findOne(query);         // Find first match
await collection.findById(id);           // Find by ID
await collection.count(query?);          // Count matches
await collection.getAll();               // Get all documents

// Update
await collection.update(query, update);     // Update many
await collection.updateOne(query, update);  // Update first match
await collection.updateById(id, update);    // Update by ID

// Delete
await collection.delete(query);          // Delete many
await collection.deleteOne(query);       // Delete first match
await collection.deleteById(id);         // Delete by ID
await collection.clear();                // Clear all documents
await collection.drop();                 // Drop collection

// Utility
collection.getName();                    // Get collection name
```

## 🔍 Query Operators

### Comparison

| Operator | Example |
|----------|---------|
| `$eq` | `{ age: { $eq: 25 } }` |
| `$ne` | `{ status: { $ne: 'deleted' } }` |
| `$gt` / `$gte` | `{ age: { $gte: 18 } }` |
| `$lt` / `$lte` | `{ price: { $lt: 100 } }` |
| `$in` / `$nin` | `{ role: { $in: ['admin', 'mod'] } }` |

### String

| Operator | Example |
|----------|---------|
| `$regex` | `{ email: { $regex: /@gmail\.com$/ } }` |
| `$startsWith` | `{ name: { $startsWith: 'John' } }` |
| `$endsWith` | `{ email: { $endsWith: '.com' } }` |

### Logical

```typescript
// AND (implicit)
{ active: true, age: { $gte: 18 } }

// OR
{ $or: [{ role: 'admin' }, { role: 'mod' }] }

// NOT
{ $not: { status: 'deleted' } }
```

### Existence

```typescript
{ email: { $exists: true } }   // Field exists
{ deletedAt: { $exists: false } }  // Field doesn't exist
```

## 📝 Update Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$set` | Set field | `{ $set: { name: 'New' } }` |
| `$unset` | Remove field | `{ $unset: { temp: true } }` |
| `$inc` | Increment | `{ $inc: { views: 1 } }` |
| `$push` | Add to array | `{ $push: { tags: 'new' } }` |
| `$pull` | Remove from array | `{ $pull: { tags: 'old' } }` |
| `$addToSet` | Add unique | `{ $addToSet: { tags: 'unique' } }` |

## ✅ Schema Validation (Zod)

```typescript
import { z } from 'zod';
import { SimpleDB, ValidationError } from 'simple-indexed-db';

const UserSchema = z.object({
  _id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

const db = new SimpleDB('my-app');
await db.connect();

const users = db.collection<User>('users', { schema: UserSchema });

// ✅ Valid - inserts successfully
await users.insert({ name: 'John', email: 'john@example.com' });

// ❌ Invalid - throws ValidationError
try {
  await users.insert({ name: '', email: 'not-an-email' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.issues);
  }
}
```

## 📁 Browser Storage

Data is stored in IndexedDB, which provides:
- **Persistent storage** - Data survives browser restarts
- **Large capacity** - Much larger than localStorage (typically 50MB+)
- **Structured data** - Native support for objects and arrays

## 🔧 Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Build
yarn build

# Lint
yarn lint
```

## 📄 License

MIT © [Rashed Iqbal](https://github.com/iqbal-rashed)
