import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from './db.js';
import { readFileContent } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const db = new Database(process.env.DATABASE_PATH || './documents.db');
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));

// Initialize database
db.initialize();

// ============ AUTH ROUTES ============
// Mock auth with predefined users
const USERS = {
  'alice@example.com': { id: 1, name: 'Alice', email: 'alice@example.com' },
  'bob@example.com': { id: 2, name: 'Bob', email: 'bob@example.com' }
};

app.post('/api/auth/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = USERS[req.body.email];
  if (!user || req.body.password !== 'password') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    user: user,
    token: Buffer.from(`${user.email}:${Date.now()}`).toString('base64')
  });
});

app.get('/api/auth/validate', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const email = decoded.split(':')[0];
    const user = USERS[email];
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    res.json({ user });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ DOCUMENT ROUTES ============

// Get all documents for current user
app.get('/api/documents', async (req, res) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = USERS[email];
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const documents = await db.getUserDocuments(user.id);
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single document
app.get('/api/documents/:id', async (req, res) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = USERS[email];
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const doc = await db.getDocument(req.params.id, user.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new document
app.post('/api/documents', [
  body('title').trim().isLength({ min: 1 }).escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = USERS[email];
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const doc = await db.createDocument({
      title: req.body.title,
      content: req.body.content || '',
      ownerId: user.id
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update document
app.put('/api/documents/:id', [
  body('title').optional().trim().escape(),
  body('content').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = USERS[email];
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const doc = await db.getDocument(req.params.id, user.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const updated = await db.updateDocument(req.params.id, {
      title: req.body.title !== undefined ? req.body.title : doc.title,
      content: req.body.content !== undefined ? req.body.content : doc.content
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = USERS[email];
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const doc = await db.getDocument(req.params.id, user.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.ownerId !== user.id) return res.status(403).json({ error: 'Not owner' });

    await db.deleteDocument(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ FILE UPLOAD ============

app.post('/api/documents/upload/file', upload.single('file'), async (req, res) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const user = USERS[email];
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    // Support .txt and .md files
    const fileName = req.file.originalname;
    const ext = fileName.split('.').pop().toLowerCase();
    if (!['txt', 'md'].includes(ext)) {
      return res.status(400).json({ error: 'Only .txt and .md files supported' });
    }

    const content = req.file.buffer.toString('utf-8');
    const title = fileName.replace(/\.[^/.]+$/, ''); // Remove extension

    const doc = await db.createDocument({
      title: title || 'Imported Document',
      content: content,
      ownerId: user.id
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SHARING ROUTES ============

// Share document with another user
app.post('/api/documents/:id/share', [
  body('userEmail').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const owner = USERS[email];
    if (!owner) return res.status(401).json({ error: 'Invalid user' });

    const doc = await db.getDocument(req.params.id, owner.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.ownerId !== owner.id) return res.status(403).json({ error: 'Not owner' });

    const targetUser = USERS[req.body.userEmail];
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    await db.shareDocument(req.params.id, targetUser.id);
    res.json({ success: true, message: `Shared with ${targetUser.name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sharing info for document
app.get('/api/documents/:id/sharing', async (req, res) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = USERS[email];
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const doc = await db.getDocument(req.params.id, user.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const shares = await db.getShares(req.params.id);
    const owner = Object.values(USERS).find(u => u.id === doc.ownerId);

    res.json({
      documentId: doc.id,
      owner: owner,
      sharedWith: shares.map(share => USERS[Object.entries(USERS).find(([, u]) => u.id === share.userId)?.[0]] || { id: share.userId, name: 'Unknown' })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove sharing
app.delete('/api/documents/:id/share/:userId', async (req, res) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const owner = USERS[email];
    if (!owner) return res.status(401).json({ error: 'Invalid user' });

    const doc = await db.getDocument(req.params.id, owner.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.ownerId !== owner.id) return res.status(403).json({ error: 'Not owner' });

    await db.unshareDocument(req.params.id, req.params.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ UTILITIES ============

app.get('/api/users', (req, res) => {
  res.json(Object.values(USERS).map(u => ({ id: u.id, name: u.name, email: u.email })));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
