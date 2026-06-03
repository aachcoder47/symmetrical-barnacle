# Collaborative Document Editor

A lightweight, full-stack collaborative document editor inspired by Google Docs. Built with React, Express, SQLite, and Quill.js for rich text editing.

## Features

✅ **Document Management**
- Create, edit, and delete documents
- Rename documents
- Rich text editing with bold, italic, underline, headings, lists
- Auto-save (saves every second of inactivity)

✅ **File Upload**
- Import `.txt` and `.md` files as new documents
- Automatic content extraction

✅ **Sharing & Collaboration**
- Share documents with other users
- Clear distinction between owned and shared documents
- Read-only access for shared documents
- Simple user management with demo accounts

✅ **Persistence**
- SQLite database with automatic persistence
- Document content and metadata retained across sessions
- Sharing relationships preserved

## Tech Stack

- **Frontend:** React 18 + Vite + Quill.js
- **Backend:** Node.js + Express
- **Database:** SQLite
- **Styling:** Pure CSS (no frameworks)

## Demo Accounts

```
alice@example.com / password
bob@example.com / password
```

## Setup & Running Locally

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
```bash
cd collaborative-editor
```

2. **Setup Backend:**
```bash
cd backend
npm install
```

3. **Setup Frontend:**
```bash
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```

Backend runs on `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

### Running Tests

```bash
cd backend
npm test
```

Tests verify:
- Document creation and retrieval
- Document updates
- Document deletion
- Sharing functionality
- User document queries

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend (Railway or Similar)
```bash
cd backend
npm install
# Set PORT environment variable
npm start
```

**Environment Variables (Backend):**
```
PORT=5000
NODE_ENV=production
DATABASE_PATH=./documents.db
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/validate` - Validate token

### Documents
- `GET /api/documents` - List user's documents (owned + shared)
- `GET /api/documents/:id` - Get single document
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document (owner only)

### File Upload
- `POST /api/documents/upload/file` - Upload .txt/.md file

### Sharing
- `POST /api/documents/:id/share` - Share with user
- `GET /api/documents/:id/sharing` - Get sharing info
- `DELETE /api/documents/:id/share/:userId` - Remove share

## Key Decisions

### Architecture Choices
1. **SQLite over Cloud DB** - No external service required, simpler local testing
2. **Mock Auth** - Predefined test accounts avoid complex auth; seeding is enough for demo
3. **Quill.js Editor** - Mature, reliable, good rich-text feature set without bloat
4. **React + Vite** - Fast dev experience, modern tooling
5. **Shared read-only** - Simplifies collaboration model without real-time sync

### Scope Trade-offs
✅ Built: Document CRUD, basic formatting, file upload, simple sharing
⏩ Deprioritized: Real-time collab, version history, advanced permissions, comments
🚀 Future: Real-time sync via WebSockets, version history, export to PDF

## Directory Structure

```
collaborative-editor/
├── backend/
│   ├── package.json
│   ├── server.js              # Main API server
│   ├── db.js                  # SQLite database layer
│   ├── utils.js               # Utility functions
│   ├── tests/
│   │   └── api.test.js        # Database tests
│   └── documents.db           # SQLite database (auto-created)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── main.jsx
    ├── App.jsx
    ├── index.css              # Global styles
    ├── pages/
    │   ├── LoginPage.jsx      # Authentication UI
    │   └── EditorPage.jsx     # Main editor UI
    └── components/
        ├── DocumentEditor.jsx # Quill.js wrapper
        ├── DocumentList.jsx   # Sidebar documents
        └── SharingPanel.jsx   # Share controls
```

## Development Notes

### Authentication Flow
- Simple mocked auth with predefined users (alice, bob)
- Token stored in localStorage as base64 string
- User email passed in `x-user-email` header for all requests

### Sharing Model
- Owner can see their documents + all shared documents
- Other users can see shared documents (read-only)
- Sharing data stored in `document_shares` table
- Cascade delete: removing document removes shares

### Data Persistence
- All changes auto-saved to SQLite
- Rich text content stored as Quill delta JSON
- Plain text fallback for .txt/.md imports

## Known Limitations

1. **No Real-time Sync** - Changes don't sync between tabs/users live
2. **No Conflict Resolution** - Last write wins
3. **No Version History** - Can't see previous edits
4. **No Export** - No PDF/Markdown export
5. **Single-Device Auth** - No multi-device session management

## Future Enhancements

- [ ] WebSocket real-time collaboration
- [ ] Version history with rollback
- [ ] Comments and mentions
- [ ] Export to PDF/Markdown
- [ ] Role-based sharing (view, comment, edit)
- [ ] Search/full-text indexing
- [ ] Document templates
- [ ] Collaborative cursors (real-time)

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in backend/.env
# Change port in frontend/vite.config.js
```

**Database locked:**
```bash
# Close other processes or delete documents.db and restart
```

**CORS errors:**
- Ensure backend is running on port 5000
- Frontend proxy configured in vite.config.js

## Support

For issues or questions, check:
- Backend logs in terminal
- Browser DevTools console
- Database file permissions
"# New-folder" 
"# New-folder" 
"# symmetrical-barnacle" 
"# symmetrical-barnacle" 
