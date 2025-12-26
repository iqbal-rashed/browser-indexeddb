/**
 * Query Operators Example for browser-indexeddb
 *
 * This example demonstrates all available query operators.
 */
import 'fake-indexeddb/auto';
import { BrowserDB, Document } from '../src';

interface Product extends Document {
  _id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  tags: string[];
  rating?: number;
}

async function main() {
  const db = new BrowserDB('query-example');
  await db.connect();

  console.log('✅ Connected to database\n');

  const products = db.collection<Product>('products');

  // Insert sample data
  await products.insertMany([
    {
      name: 'Laptop',
      price: 1200,
      category: 'electronics',
      inStock: true,
      tags: ['computer', 'work'],
      rating: 4.5,
    },
    {
      name: 'Phone',
      price: 800,
      category: 'electronics',
      inStock: true,
      tags: ['mobile', 'communication'],
      rating: 4.2,
    },
    {
      name: 'Headphones',
      price: 150,
      category: 'electronics',
      inStock: false,
      tags: ['audio', 'music'],
    },
    {
      name: 'Desk',
      price: 300,
      category: 'furniture',
      inStock: true,
      tags: ['office', 'work'],
      rating: 4.0,
    },
    {
      name: 'Chair',
      price: 200,
      category: 'furniture',
      inStock: true,
      tags: ['office', 'comfort'],
      rating: 4.8,
    },
    { name: 'Book', price: 25, category: 'books', inStock: true, tags: ['reading', 'education'] },
  ]);

  console.log('📦 Inserted 6 products\n');

  // ═══════════════════════════════════════════════════════════════
  // COMPARISON OPERATORS
  // ═══════════════════════════════════════════════════════════════

  console.log('🔍 Comparison Operators:\n');

  // $eq - Equal
  const laptops = await products.find({ name: { $eq: 'Laptop' } });
  console.log(
    '$eq (name = Laptop):',
    laptops.map((p) => p.name)
  );

  // $ne - Not equal
  const notElectronics = await products.find({ category: { $ne: 'electronics' } });
  console.log(
    '$ne (category != electronics):',
    notElectronics.map((p) => p.name)
  );

  // $gt - Greater than
  const expensive = await products.find({ price: { $gt: 500 } });
  console.log(
    '$gt (price > 500):',
    expensive.map((p) => `${p.name}: $${p.price}`)
  );

  // $gte - Greater than or equal
  const over200 = await products.find({ price: { $gte: 200 } });
  console.log(
    '$gte (price >= 200):',
    over200.map((p) => p.name)
  );

  // $lt - Less than
  const cheap = await products.find({ price: { $lt: 200 } });
  console.log(
    '$lt (price < 200):',
    cheap.map((p) => `${p.name}: $${p.price}`)
  );

  // $lte - Less than or equal
  const upTo300 = await products.find({ price: { $lte: 300 } });
  console.log(
    '$lte (price <= 300):',
    upTo300.map((p) => p.name)
  );

  // $in - In array
  const selectedCategories = await products.find({ category: { $in: ['electronics', 'books'] } });
  console.log(
    '$in (category in [electronics, books]):',
    selectedCategories.map((p) => p.name)
  );

  // $nin - Not in array
  const notSelected = await products.find({ category: { $nin: ['electronics', 'books'] } });
  console.log(
    '$nin (category not in [electronics, books]):',
    notSelected.map((p) => p.name)
  );

  // ═══════════════════════════════════════════════════════════════
  // STRING OPERATORS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n📝 String Operators:\n');

  // $regex - Regular expression
  const withO = await products.find({ name: { $regex: /o/i } });
  console.log(
    '$regex (name contains "o"):',
    withO.map((p) => p.name)
  );

  // $startsWith
  const startsWithC = await products.find({ name: { $startsWith: 'C' } });
  console.log(
    '$startsWith (name starts with "C"):',
    startsWithC.map((p) => p.name)
  );

  // $endsWith
  const endsWithS = await products.find({ name: { $endsWith: 's' } });
  console.log(
    '$endsWith (name ends with "s"):',
    endsWithS.map((p) => p.name)
  );

  // ═══════════════════════════════════════════════════════════════
  // LOGICAL OPERATORS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n🔀 Logical Operators:\n');

  // $and - All conditions must match
  const inStockElectronics = await products.find({
    $and: [{ category: 'electronics' }, { inStock: true }],
  });
  console.log(
    '$and (electronics AND inStock):',
    inStockElectronics.map((p) => p.name)
  );

  // $or - Any condition can match
  const cheapOrFurniture = await products.find({
    $or: [{ price: { $lt: 100 } }, { category: 'furniture' }],
  });
  console.log(
    '$or (price < 100 OR furniture):',
    cheapOrFurniture.map((p) => p.name)
  );

  // $not - Negate condition
  const notInStock = await products.find({
    $not: { inStock: true },
  });
  console.log(
    '$not (NOT inStock):',
    notInStock.map((p) => p.name)
  );

  // ═══════════════════════════════════════════════════════════════
  // EXISTENCE OPERATORS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n❓ Existence Operators:\n');

  // $exists - Field exists
  const hasRating = await products.find({ rating: { $exists: true } });
  console.log(
    '$exists (has rating):',
    hasRating.map((p) => `${p.name}: ${p.rating}`)
  );

  const noRating = await products.find({ rating: { $exists: false } });
  console.log(
    '$exists false (no rating):',
    noRating.map((p) => p.name)
  );

  // ═══════════════════════════════════════════════════════════════
  // ARRAY OPERATORS
  // ═══════════════════════════════════════════════════════════════

  console.log('\n📚 Array Operators:\n');

  // $contains - Array contains value
  const workItems = await products.find({ tags: { $contains: 'work' } });
  console.log(
    '$contains (tags contains "work"):',
    workItems.map((p) => p.name)
  );

  // ═══════════════════════════════════════════════════════════════
  // COMBINED QUERIES
  // ═══════════════════════════════════════════════════════════════

  console.log('\n🎯 Combined Queries:\n');

  // Multiple conditions (implicit AND)
  const midPriceInStock = await products.find({
    price: { $gte: 100, $lte: 500 },
    inStock: true,
  });
  console.log(
    'price 100-500 AND inStock:',
    midPriceInStock.map((p) => `${p.name}: $${p.price}`)
  );

  // Complex query
  const complex = await products.find({
    $or: [
      { $and: [{ category: 'electronics' }, { price: { $lt: 1000 } }] },
      { rating: { $gte: 4.5 } },
    ],
  });
  console.log(
    '(electronics AND price<1000) OR rating>=4.5:',
    complex.map((p) => p.name)
  );

  // Cleanup
  await db.drop();
  console.log('\n🧹 Database cleaned up');
}

main().catch(console.error);
