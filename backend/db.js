import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath || join(__dirname, 'documents.db');
    this.db = null;
  }

  initialize() {
    const db = new sqlite3.Database(this.dbPath);
    
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          email TEXT UNIQUE,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.log('Users table exists');
      });

      // Documents table
      db.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT DEFAULT '',
          ownerId INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(ownerId) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.log('Documents table exists');
      });

      // Sharing table
      db.run(`
        CREATE TABLE IF NOT EXISTS document_shares (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          documentId INTEGER NOT NULL,
          userId INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(documentId, userId),
          FOREIGN KEY(documentId) REFERENCES documents(id),
          FOREIGN KEY(userId) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.log('Shares table exists');
      });

      // Seed default users
      db.run(
        `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)`,
        [1, 'alice@example.com', 'Alice'],
        (err) => { if (err) console.log('Alice exists'); }
      );

      db.run(
        `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)`,
        [2, 'bob@example.com', 'Bob'],
        (err) => { if (err) console.log('Bob exists'); }
      );
    });

    db.close();
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      db.all(sql, params, (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      db.run(sql, params, function(err) {
        db.close();
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  getUserDocuments(userId) {
    const db = new sqlite3.Database(this.dbPath);
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT d.*, u.name as ownerName, u.email as ownerEmail
         FROM documents d
         LEFT JOIN users u ON d.ownerId = u.id
         WHERE d.ownerId = ? OR d.id IN (
           SELECT documentId FROM document_shares WHERE userId = ?
         )
         ORDER BY d.updated_at DESC`,
        [userId, userId],
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else {
            resolve((rows || []).map(row => ({
              id: row.id,
              title: row.title,
              content: row.content,
              ownerId: row.ownerId,
              ownerName: row.ownerName,
              ownerEmail: row.ownerEmail,
              isOwned: parseInt(row.ownerId) === parseInt(userId),
              created_at: row.created_at,
              updated_at: row.updated_at
            })));
          }
        }
      );
    });
  }

  getDocument(documentId, userId) {
    const db = new sqlite3.Database(this.dbPath);
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT d.*, u.name as ownerName, u.email as ownerEmail
         FROM documents d
         LEFT JOIN users u ON d.ownerId = u.id
         WHERE d.id = ? AND (d.ownerId = ? OR d.id IN (
           SELECT documentId FROM document_shares WHERE userId = ?
         ))`,
        [documentId, userId, userId],
        (err, row) => {
          db.close();
          if (err) reject(err);
          else if (row) {
            resolve({
              id: row.id,
              title: row.title,
              content: row.content,
              ownerId: row.ownerId,
              ownerName: row.ownerName,
              ownerEmail: row.ownerEmail,
              isOwned: parseInt(row.ownerId) === parseInt(userId),
              created_at: row.created_at,
              updated_at: row.updated_at
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  createDocument(doc) {
    const db = new sqlite3.Database(this.dbPath);
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO documents (title, content, ownerId) VALUES (?, ?, ?)`,
        [doc.title, doc.content, doc.ownerId],
        function(err) {
          if (err) {
            db.close();
            reject(err);
          } else {
            db.get(
              `SELECT d.*, u.name as ownerName, u.email as ownerEmail
               FROM documents d
               LEFT JOIN users u ON d.ownerId = u.id
               WHERE d.id = ?`,
              [this.lastID],
              (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve({
                  id: row.id,
                  title: row.title,
                  content: row.content,
                  ownerId: row.ownerId,
                  ownerName: row.ownerName,
                  isOwned: true,
                  created_at: row.created_at,
                  updated_at: row.updated_at
                });
              }
            );
          }
        }
      );
    });
  }

  updateDocument(documentId, updates) {
    const db = new sqlite3.Database(this.dbPath);
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE documents SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [updates.title, updates.content, documentId],
        function(err) {
          if (err) {
            db.close();
            reject(err);
          } else {
            db.get(
              `SELECT d.*, u.name as ownerName FROM documents d LEFT JOIN users u ON d.ownerId = u.id WHERE d.id = ?`,
              [documentId],
              (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve({
                  id: row.id,
                  title: row.title,
                  content: row.content,
                  ownerId: row.ownerId,
                  ownerName: row.ownerName,
                  updated_at: row.updated_at
                });
              }
            );
          }
        }
      );
    });
  }

  deleteDocument(documentId) {
    const db = new sqlite3.Database(this.dbPath);
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM document_shares WHERE documentId = ?`, [documentId], (err) => {
        if (err) {
          db.close();
          reject(err);
        } else {
          db.run(`DELETE FROM documents WHERE id = ?`, [documentId], (err) => {
            db.close();
            if (err) reject(err);
            else resolve({ success: true });
          });
        }
      });
    });
  }

  shareDocument(documentId, userId) {
    const db = new sqlite3.Database(this.dbPath);
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO document_shares (documentId, userId) VALUES (?, ?)`,
        [documentId, userId],
        function(err) {
          db.close();
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  getShares(documentId) {
    const db = new sqlite3.Database(this.dbPath);
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ds.*, u.name, u.email FROM document_shares ds
         LEFT JOIN users u ON ds.userId = u.id
         WHERE documentId = ?`,
        [documentId],
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  unshareDocument(documentId, userId) {
    const db = new sqlite3.Database(this.dbPath);
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM document_shares WHERE documentId = ? AND userId = ?`,
        [documentId, userId],
        function(err) {
          db.close();
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }
}

export default Database;
