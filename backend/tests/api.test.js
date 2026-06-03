import assert from 'assert';
import Database from '../db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDbPath = join(__dirname, 'test.db');

// Clean up test database before running
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const db = new Database(testDbPath);
db.initialize();

// Wait a bit for initialization
await new Promise(resolve => setTimeout(resolve, 100));

console.log('Running API tests...\n');

// Test 1: Create document
console.log('Test 1: Create document');
const doc1 = await db.createDocument({
  title: 'Test Document',
  content: 'Hello world',
  ownerId: 1
});
assert(doc1.id, 'Document should have an ID');
assert.strictEqual(doc1.title, 'Test Document');
assert.strictEqual(doc1.ownerId, 1);
console.log('✓ Document created successfully\n');

// Test 2: Get document
console.log('Test 2: Get document');
const retrieved = await db.getDocument(doc1.id, 1);
assert(retrieved);
assert.strictEqual(retrieved.id, doc1.id);
assert.strictEqual(retrieved.content, 'Hello world');
console.log('✓ Document retrieved successfully\n');

// Test 3: Update document
console.log('Test 3: Update document');
const updated = await db.updateDocument(doc1.id, {
  title: 'Updated Title',
  content: 'Updated content'
});
assert.strictEqual(updated.title, 'Updated Title');
const checked = await db.getDocument(doc1.id, 1);
assert.strictEqual(checked.content, 'Updated content');
console.log('✓ Document updated successfully\n');

// Test 4: Share document
console.log('Test 4: Share document');
await db.shareDocument(doc1.id, 2);
const retrieved2 = await db.getDocument(doc1.id, 2);
assert(retrieved2, 'User 2 should be able to see shared document');
assert.strictEqual(retrieved2.id, doc1.id);
console.log('✓ Document shared successfully\n');

// Test 5: Get user documents
console.log('Test 5: Get user documents');
const doc2 = await db.createDocument({
  title: 'Second Document',
  content: 'Content 2',
  ownerId: 2
});
const userDocs = await db.getUserDocuments(2);
assert(userDocs.length >= 2, 'User 2 should have at least 2 documents (owned + shared)');
console.log('✓ User documents retrieved successfully\n');

// Test 6: Get shares
console.log('Test 6: Get shares');
const shares = await db.getShares(doc1.id);
assert(shares.some(s => s.userId === 2), 'Document should be shared with user 2');
console.log('✓ Shares retrieved successfully\n');

// Test 7: Delete document
console.log('Test 7: Delete document');
await db.deleteDocument(doc2.id);
const deletedCheck = await db.getDocument(doc2.id, 2);
assert(!deletedCheck, 'Deleted document should not be retrievable');
console.log('✓ Document deleted successfully\n');

console.log('✅ All tests passed!');
process.exit(0);
