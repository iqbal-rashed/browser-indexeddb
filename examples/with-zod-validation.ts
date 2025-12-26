/**
 * Zod Schema Validation Example for browser-indexeddb
 *
 * This example demonstrates how to use Zod schemas for document validation.
 */
import 'fake-indexeddb/auto';
import { z } from 'zod';
import { BrowserDB, ValidationError, Document } from '../src';

// Define Zod schema - make all fields that are auto-generated optional
const UserSchema = z.object({
  _id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email format'),
  age: z.number().min(0, 'Age must be positive').max(150, 'Age must be realistic'),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
});

// Create Document-compatible type
interface User extends Document {
  _id: string;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
}

async function main() {
  const db = new BrowserDB('validation-example');
  await db.connect();

  console.log('✅ Connected to database');

  // Create collection with schema validation
  // Note: Schema is for runtime validation, type is for TypeScript
  const users = db.collection<User>('users', {
    schema: UserSchema,
  });

  console.log('\n📝 Testing schema validation...\n');

  // ═══════════════════════════════════════════════════════════════
  // VALID INSERT
  // ═══════════════════════════════════════════════════════════════

  try {
    const validUser = await users.insert({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      role: 'admin',
    });
    console.log('✅ Valid user inserted:', validUser.name, validUser.email);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  // ═══════════════════════════════════════════════════════════════
  // INVALID INSERTS - These will throw ValidationError at runtime
  // ═══════════════════════════════════════════════════════════════

  // Test: Invalid email
  console.log('\n🧪 Testing invalid email...');
  try {
    await users.insert({
      name: 'Jane Doe',
      email: 'not-an-email',
      age: 25,
      role: 'user',
    });
    console.log('❌ Should have thrown validation error');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✅ Caught ValidationError:');
      error.issues.forEach((issue) => {
        console.log(`   - ${issue.path.join('.')}: ${issue.message}`);
      });
    }
  }

  // Test: Name too short
  console.log('\n🧪 Testing name too short...');
  try {
    await users.insert({
      name: 'J',
      email: 'j@example.com',
      age: 25,
      role: 'user',
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✅ Caught ValidationError:');
      error.issues.forEach((issue) => {
        console.log(`   - ${issue.path.join('.')}: ${issue.message}`);
      });
    }
  }

  // Test: Invalid age
  console.log('\n🧪 Testing invalid age...');
  try {
    await users.insert({
      name: 'Bob',
      email: 'bob@example.com',
      age: -5,
      role: 'user',
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✅ Caught ValidationError:');
      error.issues.forEach((issue) => {
        console.log(`   - ${issue.path.join('.')}: ${issue.message}`);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════

  await db.drop();
  console.log('\n🧹 Database cleaned up');
}

main().catch(console.error);
