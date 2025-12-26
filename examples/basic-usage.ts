/**
 * Basic Usage Example for browser-indexeddb
 *
 * This example demonstrates fundamental CRUD operations
 * with the SimpleDB package.
 */
import 'fake-indexeddb/auto';
import { BrowserDB, Document } from '../src';

// Define your document type with index signature for Document compatibility
interface User extends Document {
  _id: string;
  name: string;
  email: string;
  age: number;
  role?: string;
  tags?: string[];
}

async function main() {
  // Create database instance - auto-connects!
  const db = new BrowserDB('my-app-db');

  // Wait for connection to be ready (optional, but recommended before operations)
  await db.connect();

  console.log('✅ Connected to database:', db.getName());

  // Get a typed collection
  const users = db.collection<User>('users');

  // ═══════════════════════════════════════════════════════════════
  // INSERT OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n📝 Inserting users...');

  // Insert a single document
  const john = await users.insert({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    role: 'admin',
    tags: ['developer', 'team-lead'],
  });
  console.log('Inserted:', john);

  // Insert multiple documents
  const newUsers = await users.insertMany([
    { name: 'Alice Smith', email: 'alice@example.com', age: 25, role: 'user' },
    { name: 'Bob Wilson', email: 'bob@example.com', age: 35, role: 'user' },
    { name: 'Charlie Brown', email: 'charlie@example.com', age: 28, role: 'moderator' },
  ]);
  console.log('Inserted', newUsers.length, 'users');

  // ═══════════════════════════════════════════════════════════════
  // FIND OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n🔍 Finding users...');

  // Find all users
  const allUsers = await users.getAll();
  console.log('Total users:', allUsers.length);

  // Find by ID
  const foundUser = await users.findById(john._id);
  console.log('Found by ID:', foundUser?.name);

  // Find one by query
  const admin = await users.findOne({ role: 'admin' });
  console.log('Admin:', admin?.name);

  // Find with query operators
  const youngUsers = await users.find({ age: { $lt: 30 } });
  console.log(
    'Users under 30:',
    youngUsers.map((u) => u.name)
  );

  // Find with multiple conditions
  const filtered = await users.find({
    age: { $gte: 25, $lte: 35 },
    role: { $in: ['user', 'moderator'] },
  });
  console.log(
    'Filtered users:',
    filtered.map((u) => u.name)
  );

  // Find with sorting and limit
  const topUsers = await users.find({}, { sort: { age: -1 }, limit: 2 });
  console.log(
    'Top 2 oldest:',
    topUsers.map((u) => `${u.name} (${u.age})`)
  );

  // Count users
  const count = await users.count({ role: 'user' });
  console.log('Number of regular users:', count);

  // ═══════════════════════════════════════════════════════════════
  // UPDATE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n✏️ Updating users...');

  // Update by ID
  const updated = await users.updateById(john._id, {
    $set: { age: 31 },
    $push: { tags: 'mentor' },
  });
  console.log('Updated John:', updated?.age, updated?.tags);

  // Update many
  const updateCount = await users.update({ role: 'user' }, { $set: { role: 'member' } });
  console.log('Updated', updateCount, 'users');

  // Increment
  await users.update({}, { $inc: { age: 1 } });
  console.log('Incremented all ages by 1');

  // ═══════════════════════════════════════════════════════════════
  // DELETE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n🗑️ Deleting users...');

  // Delete by ID
  const deleted = await users.deleteById(john._id);
  console.log('Deleted:', deleted?.name);

  // Delete by query
  const deleteCount = await users.delete({ role: 'member' });
  console.log('Deleted', deleteCount, 'members');

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════

  // Clear collection
  await users.clear();
  console.log('\n🧹 Collection cleared');

  // Drop collection
  await db.dropCollection('users');
  console.log('Collection dropped');

  // Close connection
  db.close();
  console.log('✅ Connection closed');
}

main().catch(console.error);
