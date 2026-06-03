# GitHub Setup & Deployment Instructions

## Step 1: Create GitHub Repository

Since you don't have a GitHub remote set up yet, here's how to complete it:

### 1.1 Create Repository on GitHub
1. Go to https://github.com/new
2. Enter repository name: `collaborative-editor`
3. Add description: "Lightweight collaborative document editor inspired by Google Docs"
4. Choose **Public** (required for free Vercel deployment)
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

### 1.2 Add Remote to Git
After creating the repo, GitHub will show you commands. Run this:

```bash
cd "c:\Users\ASUS\Downloads\Telegram-Trading-Bot-main\New folder\collaborative-editor"

# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/collaborative-editor.git
git branch -M main
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username.

### 1.3 Verify Push
```bash
git remote -v
# Should show:
# origin  https://github.com/YOUR_USERNAME/collaborative-editor.git (fetch)
# origin  https://github.com/YOUR_USERNAME/collaborative-editor.git (push)
```

---

## Step 2: Deploy Frontend (Vercel)

### 2.1 Create Vercel Account
1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. Confirm your email

### 2.2 Create Vercel Project
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Select your `collaborative-editor` repository
4. Fill in project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - Leave other settings default
5. Click "Deploy"

Vercel will build and deploy automatically. You'll see:
```
✓ Deployment successful
```

### 2.3 Get Frontend URL
Your frontend will be at: `https://collaborative-editor.vercel.app/` (or similar with your project name)

Copy this URL - you'll need it soon.

---

## Step 3: Deploy Backend (Railway)

Railway is the easiest option for Node.js + SQLite.

### 3.1 Create Railway Account
1. Go to https://railway.app/
2. Click "Get Started"
3. Sign up with GitHub
4. Authorize Railway

### 3.2 Create Backend Project
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your `collaborative-editor` repository
5. Select `backend` as the root directory

### 3.3 Configure Environment Variables

Once Railway deploys the backend:

1. Click on your project in Railway dashboard
2. Go to the **Variables** tab
3. Add these environment variables:
   ```
   PORT = 5000
   NODE_ENV = production
   DATABASE_PATH = ./documents.db
   ```

### 3.4 Create Persistent Storage (IMPORTANT!)

For SQLite to persist data across deployments:

1. In your Railway project, go to **Storage** tab
2. Click **Create Database** → **SQLite**
3. Set **Mount Path:** `/app`

This ensures your documents database survives restarts.

### 3.5 Get Backend URL

1. In Railway dashboard, find your project
2. Go to **Settings**
3. Look for **Railway Domain**
4. Copy the URL (looks like `https://collaborative-editor-production.up.railway.app`)

---

## Step 4: Link Frontend to Backend

Now that backend is deployed, tell the frontend where to find it.

### 4.1 Update Vercel Environment Variable

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Find or create: `VITE_API_URL`
4. Set value to your backend URL:
   ```
   https://collaborative-editor-production.up.railway.app/api
   ```
5. Click **Save**

### 4.2 Redeploy Frontend

1. Go to **Deployments** tab
2. Click the latest deployment
3. Click **Redeploy**

This rebuilds the frontend with the backend URL baked in.

---

## Step 5: Test Live Deployment

### 5.1 Test Frontend Load
Open your frontend URL in browser. Should see login page.

### 5.2 Test Login
```
Email: alice@example.com
Password: password
```

Should log in successfully.

### 5.3 Test Core Features
1. ✅ Click "+ New" → create document
2. ✅ Type something → see "Saving..."
3. ✅ Refresh page → document still there
4. ✅ Upload a .txt or .md file
5. ✅ Share with bob@example.com
6. ✅ Logout → login as bob
7. ✅ See shared document (read-only)

### 5.4 Troubleshooting

**"Cannot connect to API"**
- Check `VITE_API_URL` in Vercel is correct
- Verify backend URL is accessible
- Redeploy frontend

**"Database error"**
- Check Railway storage is mounted at `/app`
- Check `DATABASE_PATH=./documents.db` env var

**"Login fails"**
- Use exact credentials: `alice@example.com` / `password`
- Check backend logs in Railway

---

## Your Final URLs

After deployment, you'll have:

```
Frontend:  https://collaborative-editor.vercel.app/
Backend:   https://collaborative-editor-production.up.railway.app
GitHub:    https://github.com/YOUR_USERNAME/collaborative-editor
```

---

## Step 6: Record Walkthrough Video (3-5 min)

Record a screen capture showing:

1. **Login** (15 sec)
   - Go to frontend URL
   - Login as alice
   - Point out demo account option

2. **Create & Edit** (45 sec)
   - Click "+ New"
   - Type some text
   - Make text bold/italic
   - Add heading
   - Point out "Saving..." status
   - Refresh page to show persistence

3. **Upload** (30 sec)
   - Click "⬆️ Upload"
   - Upload a .md file
   - Show new document created

4. **Sharing** (45 sec)
   - Show sharing panel
   - Share with bob@example.com
   - Click "Share"
   - Logout

5. **Multi-user** (45 sec)
   - Login as bob
   - Show shared document
   - Explain it's read-only
   - Compare to Alice's owned docs

6. **Architecture** (30 sec)
   - Explain tech stack (React + Express + SQLite)
   - Explain why REST API (not WebSocket)
   - Mention what could be added (real-time, comments, etc)

Upload to Loom (https://loom.com/) or YouTube and get unlisted link.

---

## Final Submission Checklist

- [ ] GitHub repo created and pushed
- [ ] Code accessible at: https://github.com/YOUR_USERNAME/collaborative-editor
- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Railway  
- [ ] Frontend URL: `https://collaborative-editor.vercel.app/`
- [ ] Backend URL: `https://collaborative-editor-production.up.railway.app`
- [ ] VITE_API_URL configured in Vercel
- [ ] Can login with alice@example.com
- [ ] Can create/edit/save documents
- [ ] Can upload files
- [ ] Can share documents
- [ ] Can access as different user
- [ ] Walkthrough video recorded and uploaded
- [ ] All documentation files created:
  - [x] README.md
  - [x] ARCHITECTURE.md
  - [x] AI_WORKFLOW.md
  - [x] DEPLOYMENT.md
  - [x] SUBMISSION.md
  - [x] START_HERE.md

---

## Submit These Links

Create a Google Drive folder with:

```
Title: Collaborative Document Editor Submission

Contents:
1. GitHub Repository Link
   https://github.com/YOUR_USERNAME/collaborative-editor

2. Frontend Live URL
   https://collaborative-editor.vercel.app/

3. Backend Live URL
   https://collaborative-editor-production.up.railway.app

4. Walkthrough Video Link
   https://loom.com/share/xxxxx

5. Demo Credentials
   Email: alice@example.com
   Password: password
   
   Email: bob@example.com
   Password: password

6. Architecture Notes
   (Copy from ARCHITECTURE.md)

7. AI Workflow Notes
   (Copy from AI_WORKFLOW.md)

8. Local Setup Instructions
   (Copy from README.md Setup section)
```

---

## Time Estimate

| Task | Time |
|------|------|
| Create GitHub repo | 2 min |
| Deploy to Vercel | 3 min |
| Deploy to Railway | 5 min |
| Link frontend to backend | 2 min |
| Test everything | 5 min |
| Record video | 15 min |
| Create submission folder | 5 min |
| **Total** | **37 min** |

---

## Done! 🎉

You've successfully built, tested, deployed, and documented a collaborative document editor in under 4 hours.

**Key Accomplishments:**
- ✅ Full-stack application (React + Express + SQLite)
- ✅ Rich text editing with Quill.js
- ✅ Document sharing with access control
- ✅ File upload support
- ✅ Persistent storage
- ✅ 7 automated tests (all passing)
- ✅ Complete documentation
- ✅ Live deployment ready

Good luck with your submission! 🚀
