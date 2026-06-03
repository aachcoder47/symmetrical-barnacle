# Architecture & Design Notes

## Overview

This is a lightweight collaborative document editor built for rapid development and deployment within the 4-6 hour constraint. The architecture prioritizes:
1. **Simplicity** - No complex distributed systems
2. **Speed** - Fast to build and test
3. **Functionality** - Core features work well
4. **Maintainability** - Clear code and structure

## Technology Choices

### Backend: Node.js + Express + SQLite

**Why?**
- Express is minimal but powerful for REST APIs
- SQLite requires no separate server setup (runs locally)
- Node.js enables rapid iteration with JavaScript across stack
- SQLite3 npm package has solid sync support for testing

**Tradeoffs:**
- SQLite isn't designed for high concurrency (acceptable for <100 concurrent users)
- Would migrate to Postgres for production scale
- Sync database calls keep code simple (async complexity not needed at this scale)

### Frontend: React + Vite + Quill.js

**Why?**
- React provides component composition for UI
- Vite offers instant HMR during development
- Quill.js is battle-tested for rich text (avoids ContentEditable bugs)
- CSS-in-CSS keeps styling straightforward

**Tradeoffs:**
- Quill Delta format adds complexity to content storage
- React Context could be used; opted for props + localStorage for simplicity
- No state management library (Redux unnecessary at this scope)

### Authentication: Mock Auth

**Why?**
- Real auth (OAuth, JWT) adds 30+ min setup
- Mock auth with localStorage demonstrates the flow
- Easy to swap for real auth later

**How It Works:**
```
Client → POST /auth/login → Server returns token
Client → stores token in localStorage
Client → sends token + email in headers for all requests
Server → validates token on each request
```

## Database Schema

```sql
users
├── id (PK)
├── email (UNIQUE)
├── name
└── created_at

documents
├── id (PK, AUTOINCREMENT)
├── title
├── content (JSON delta from Quill)
├── ownerId (FK → users.id)
├── created_at
└── updated_at

document_shares
├── id (PK)
├── documentId (FK → documents.id)
├── userId (FK → users.id)
├── created_at
└── UNIQUE(documentId, userId)
```

**Why this design?**
- Minimal schema (3 tables) reduces complexity
- Sharing is explicit (document_shares table)
- Timestamps track changes
- UNIQUE constraint prevents duplicate shares

## API Design

### REST Endpoints (Not WebSocket-based)

**Documents:**
```
GET    /api/documents           → List user's docs (owned + shared)
GET    /api/documents/:id       → Get single doc
POST   /api/documents           → Create
PUT    /api/documents/:id       → Update
DELETE /api/documents/:id       → Delete (owner only)
```

**Sharing:**
```
POST   /api/documents/:id/share          → Share with user
GET    /api/documents/:id/sharing        → Get shares info
DELETE /api/documents/:id/share/:userId  → Remove share
```

**Why REST instead of real-time?**
- Simpler to implement and test
- No WebSocket complexity
- Sufficient for document editor (users save explicitly or auto-save every 1s)
- Easy upgrade path to WebSocket later

### Request Headers

```javascript
// All requests include:
'x-user-email': 'alice@example.com'        // User identity
'Authorization': `Bearer ${token}`          // Session token
```

**Why headers instead of JWT payload?**
- Simpler mock implementation
- Email as user identity avoids extra lookup
- Headers are stateless (easy to debug)

## Frontend Architecture

### State Management

Uses React hooks + localStorage (no Redux needed):

```javascript
// Login state persisted
const [currentUser, setCurrentUser] = useState(() => {
  return JSON.parse(localStorage.getItem('currentUser')) || null
})

// Token stored for API calls
localStorage.setItem('authToken', token)
```

**Why minimal state?**
- App is single-user (one user per tab)
- Document list fetched on page load, updated after changes
- No cross-component state complexity

### Component Structure

```
App (route logic)
├── LoginPage (auth form)
└── EditorPage (main app)
    ├── Sidebar
    │   ├── DocumentList
    │   └── Upload/New buttons
    ├── DocumentEditor (Quill wrapper)
    └── SharingPanel (share controls)
```

**Why this structure?**
- Clear separation of concerns
- Sidebar/Editor/Sharing are independent
- Easy to test individual components
- Quill isolated in DocumentEditor component (complex third-party)

### Rich Text Handling

**Quill Delta Format:**
```json
{
  "ops": [
    { "insert": "Hello " },
    { "insert": "world", "attributes": { "bold": true } },
    { "insert": "\n" }
  ]
}
```

**Why Delta?**
- Preserves formatting (bold, italic, lists, etc.)
- OT-friendly for future real-time collab
- Quill's native format (no conversion overhead)

**Import handling for plain text:**
- .txt/.md files stored as plain text (no formatting)
- When loaded, converted to Delta: `{ ops: [{ insert: content }] }`
- Quill preserves this format on edit

## Sharing Model

### Who can access what?

**Owner:**
- See and edit own documents
- See all shared-with-them documents (read-only)
- Can share/unshare own documents

**Shared user:**
- See shared document (read-only)
- Cannot edit or share further
- Cannot delete

### Why read-only shares?

Simple model with clear permissions:
- Owner maintains control
- No accidental edits from multiple users
- No conflict resolution needed
- Clear mental model for users

**Future:** Could add "can edit" permission by adding `access_level` column to `document_shares`

## File Upload

### Supported Formats

- `.txt` - Plain text files
- `.md` - Markdown files

**Why only .txt/.md?**
- Simplest implementation (no parsing library needed)
- DOCX would require additional library (docx)
- Focus on core functionality

**How it works:**
1. File uploaded to `/api/documents/upload/file`
2. Server reads file buffer as UTF-8
3. Creates new document with file content
4. Frontend redirects to new document

## Testing Strategy

### Test Suite (Backend)

```javascript
// tests/api.test.js covers:
1. Document creation
2. Document retrieval
3. Document update
4. Document deletion
5. Sharing (add)
6. Sharing (retrieve)
```

**Why database-level tests?**
- Verify persistence works
- No mock DB complexity
- Run against actual SQLite
- Fast to execute

**What's not tested:**
- HTTP status codes (would need full server test)
- API validation (done manually in browser)
- Frontend components (would need Vitest/RTL setup - out of scope)

**To run:**
```bash
cd backend && npm test
```

## Deployment Architecture

### Frontend Deployment (Vercel)

```
GitHub → Vercel → Built dist/ → Edge CDN
```

- Auto-rebuilds on push to main
- Instant preview URLs
- No cost for static site

### Backend Deployment (Railway or Render)

```
GitHub → Railway → Runs Node process → Database (SQLite file-based)
```

- Node.js app runs in container
- SQLite database stored in container
- On restart, data persists if mounted correctly
- Auto-deploys on GitHub push

**SQLite in production:**
- Works fine for <1000 concurrent users
- File-based so no separate DB instance
- Would migrate to Postgres for scaling

### Environment

Frontend `.env`:
```
VITE_API_URL=https://api.example.com/api
```

Backend `.env`:
```
PORT=5000
NODE_ENV=production
DATABASE_PATH=./documents.db
```

## Performance Considerations

### Auto-save Debouncing

```javascript
const [saveStatus, setSaveStatus] = useState('')
saveTimeoutRef.current = setTimeout(() => {
  onSave(content)
  setSaveStatus('Saved ✓')
}, 1000) // Save 1 second after last keystroke
```

**Why 1 second?**
- Feels responsive to user
- Reduces server load
- Avoids race conditions (old write before new)

### Query Optimization

```sql
-- Get all docs user can access
SELECT d.* FROM documents d
WHERE d.ownerId = ?                  -- Owned docs
   OR d.id IN (                      -- Shared docs
     SELECT documentId FROM document_shares 
     WHERE userId = ?
   )
```

**Could optimize with:**
- Materialized view (owned + shared)
- Index on document_shares (documentId, userId)
- But unnecessary at <1000 documents

## Security Notes

⚠️ **This is a demo implementation. NOT production-secure:**

- Mock auth allows anyone to login with known emails
- No password hashing
- No HTTPS requirement
- No CSRF protection
- SQL injection would require dynamic queries (we use parameters)

**For production:**
- Real OAuth/JWT
- Bcrypt password hashing
- HTTPS everywhere
- CSRF tokens
- Rate limiting
- Input sanitization (we validate but don't sanitize)

## Future Improvements (Priority Order)

### High Priority
1. **Real-time collaboration** - WebSocket sync (2-3 hrs)
2. **Version history** - Store snapshots, allow rollback (1 hr)
3. **Better sharing** - Multiple permission levels (30 min)

### Medium Priority
4. **PDF export** - Use pdfkit or similar (1 hr)
5. **Search** - Full-text search across documents (1.5 hrs)
6. **Comments** - Threaded feedback (2 hrs)

### Low Priority
7. **Templates** - Pre-made document templates (1 hr)
8. **Markdown export** - Delta → MD conversion (30 min)
9. **Mobile app** - React Native version (4+ hrs)

## Lessons Learned

1. **SQLite for rapid prototyping is great** - No DB setup, persists everywhere
2. **Quill.js handles 90% of editor complexity** - Use battle-tested libs
3. **Mock auth works surprisingly well for demos** - Don't over-engineer early
4. **Auto-save reduces user anxiety** - Silent saves are better than manual
5. **Read-only shares keep logic simple** - Don't solve conflict resolution yet
