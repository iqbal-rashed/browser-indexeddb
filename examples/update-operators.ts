/**
 * Update Operators Example for browser-indexeddb
 *
 * This example demonstrates all available update operators.
 */
import 'fake-indexeddb/auto';
import { BrowserDB, Document } from '../src';

interface Task extends Document {
  _id: string;
  title: string;
  completed: boolean;
  priority: number;
  tags: string[];
  assignees: string[];
  metadata?: Record<string, unknown>;
}

async function main() {
  const db = new BrowserDB('update-example');
  await db.connect();

  console.log('✅ Connected to database\n');

  const tasks = db.collection<Task>('tasks');

  // Insert a sample task
  const task = await tasks.insert({
    title: 'Build feature',
    completed: false,
    priority: 1,
    tags: ['backend', 'api'],
    assignees: ['alice'],
    metadata: { created: new Date().toISOString() },
  });

  console.log('📋 Initial task:', task);

  // ═══════════════════════════════════════════════════════════════
  // $set - Set field values
  // ═══════════════════════════════════════════════════════════════

  console.log('\n📝 $set operator:\n');

  await tasks.updateById(task._id, {
    $set: { title: 'Build awesome feature', completed: true },
  });
  let updated = await tasks.findById(task._id);
  console.log('After $set:', { title: updated?.title, completed: updated?.completed });

  // ═══════════════════════════════════════════════════════════════
  // $unset - Remove fields
  // ═══════════════════════════════════════════════════════════════

  console.log('\n🗑️ $unset operator:\n');

  await tasks.updateById(task._id, {
    $unset: { metadata: true },
  });
  updated = await tasks.findById(task._id);
  console.log('After $unset metadata:', { hasMetadata: 'metadata' in (updated || {}) });

  // ═══════════════════════════════════════════════════════════════
  // $inc - Increment numeric values
  // ═══════════════════════════════════════════════════════════════

  console.log('\n🔢 $inc operator:\n');

  await tasks.updateById(task._id, { $inc: { priority: 2 } });
  updated = await tasks.findById(task._id);
  console.log('After $inc priority +2:', { priority: updated?.priority });

  await tasks.updateById(task._id, { $inc: { priority: -1 } });
  updated = await tasks.findById(task._id);
  console.log('After $inc priority -1:', { priority: updated?.priority });

  // ═══════════════════════════════════════════════════════════════
  // $push - Add to array
  // ═══════════════════════════════════════════════════════════════

  console.log('\n➕ $push operator:\n');

  await tasks.updateById(task._id, { $push: { tags: 'urgent' } });
  updated = await tasks.findById(task._id);
  console.log('After $push "urgent" to tags:', updated?.tags);

  await tasks.updateById(task._id, { $push: { assignees: 'bob' } });
  updated = await tasks.findById(task._id);
  console.log('After $push "bob" to assignees:', updated?.assignees);

  // ═══════════════════════════════════════════════════════════════
  // $pull - Remove from array
  // ═══════════════════════════════════════════════════════════════

  console.log('\n➖ $pull operator:\n');

  await tasks.updateById(task._id, { $pull: { tags: 'api' } });
  updated = await tasks.findById(task._id);
  console.log('After $pull "api" from tags:', updated?.tags);

  // ═══════════════════════════════════════════════════════════════
  // $addToSet - Add unique to array
  // ═══════════════════════════════════════════════════════════════

  console.log('\n🎯 $addToSet operator:\n');

  await tasks.updateById(task._id, { $addToSet: { assignees: 'charlie' } });
  updated = await tasks.findById(task._id);
  console.log('After $addToSet "charlie":', updated?.assignees);

  // Try to add duplicate
  await tasks.updateById(task._id, { $addToSet: { assignees: 'alice' } });
  updated = await tasks.findById(task._id);
  console.log('After $addToSet "alice" (duplicate):', updated?.assignees);

  // ═══════════════════════════════════════════════════════════════
  // COMBINED UPDATES
  // ═══════════════════════════════════════════════════════════════

  console.log('\n🔀 Combined operators:\n');

  await tasks.updateById(task._id, {
    $set: { title: 'Final feature' },
    $inc: { priority: 1 },
    $push: { tags: 'reviewed' },
  });
  updated = await tasks.findById(task._id);
  console.log('After combined update:', {
    title: updated?.title,
    priority: updated?.priority,
    tags: updated?.tags,
  });

  // ═══════════════════════════════════════════════════════════════
  // BULK UPDATES
  // ═══════════════════════════════════════════════════════════════

  console.log('\n📦 Bulk updates:\n');

  // Insert more tasks
  await tasks.insertMany([
    { title: 'Task A', completed: false, priority: 1, tags: [], assignees: [] },
    { title: 'Task B', completed: false, priority: 1, tags: [], assignees: [] },
    { title: 'Task C', completed: false, priority: 1, tags: [], assignees: [] },
  ]);

  // Update all uncompleted tasks
  const updateCount = await tasks.update({ completed: false }, { $set: { priority: 5 } });
  console.log(`Updated ${updateCount} tasks to priority 5`);

  const allTasks = await tasks.getAll();
  console.log(
    'All tasks:',
    allTasks.map((t) => ({ title: t.title, priority: t.priority }))
  );

  // Cleanup
  await db.drop();
  console.log('\n🧹 Database cleaned up');
}

main().catch(console.error);
