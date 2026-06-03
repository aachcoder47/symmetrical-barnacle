# DEPLOYMENT.md - Live Deployment Guide

## Quick Overview

This guide walks through deploying the Collaborative Document Editor to production using:
- **Frontend:** Vercel (free tier works great)
- **Backend:** Railway or Render (5 minutes to deploy)

Both services offer free tiers and auto-deploy from GitHub.

---

## Step 1: Create GitHub Repository

### 1.1 Initialize Git
```bash
cd collaborative-editor
git init
git add .
git commit -m "Initial commit: Collaborative Document Editor"
```

### 1.2 Create GitHub Repo
1. Go to https://github.com/new
2. Name: `collaborative-editor`
3. Make it **Public** (free tier requires public for Vercel)
4. Click "Create repository"

### 1.3 Push Code
```bash
git remote add origin https://github.com/YOUR_USERNAME/collaborative-editor.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Frontend (Vercel)

### 2.1 Create Vercel Account
1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel

### 2.2 Create Project
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Select your `collaborative-editor` repository
4. Choose **Framework:** Vite
5. Choose **Root Directory:** `frontend`
6. Click "Deploy"

Vercel will automatically detect the Vite configuration and build.

### 2.3 Add Environment Variable

After deployment:

1. Click on the project in Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url/api` (we'll set this after deploying backend)
   - **Environments:** Production, Preview, Development

4. Click **Save**

5. **Redeploy** (to apply env var):
   - Go to **Deployments**
   - Click the latest deployment
   - Click **Redeploy**

### 2.4 Your Frontend URL
```
https://collaborative-editor.vercel.app/
```

(Actual URL will include your username or custom domain)

---

## Step 3: Deploy Backend (Railway)

Railway is simpler than Render for this project.

### 3.1 Create Railway Account
1. Go to https://railway.app/
2. Click "Start a New Project"
3. Select "Deploy from GitHub"

### 3.2 Connect GitHub
1. Authorize Railway with GitHub
2. Select your `collaborative-editor` repository
3. Select **Root Directory:** `backend`

### 3.3 Configure Environment

Railway auto-detects Node.js and installs dependencies.

Add environment variables:

1. Click on the project
2. Go to **Variables**
3. Add:
   ```
   PORT = 5000
   NODE_ENV = production
   DATABASE_PATH = ./documents.db
   ```

### 3.4 Enable Persistent Storage (IMPORTANT)

For SQLite to persist data:

1. Go to **Storage** tab
2. Click **Create Database** → **SQLite**
3. Set **Mount Path:** `/app`

This persists the `documents.db` file across deployments.

### 3.5 Deploy

1. Click **Deploy** in Railway dashboard
2. Wait for build to complete (should see "✅ Deployment successful")

### 3.6 Your Backend URL

1. Click the project
2. Go to **Settings**
3. Copy the **Railway Domain**

Example: `https://collaborative-editor-production.up.railway.app`

---

## Step 4: Update Frontend with Backend URL

Now that backend is deployed, update the frontend environment variable.

### 4.1 Update Vercel

1. Go to Vercel dashboard
2. Select your `collaborative-editor` project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL`
5. Change value to your backend URL:
   ```
   https://collaborative-editor-production.up.railway.app/api
   ```
6. Click **Save**

### 4.2 Redeploy Frontend

1. Go to **Deployments** tab
2. Click the latest deployment
3. Click **Redeploy**

This rebuilds with the updated backend URL.

---

## Step 5: Test Live Deployment

### 5.1 Test Frontend
```
https://your-frontend-url/
```

Should see login page.

### 5.2 Test Login
1. Email: `alice@example.com`
2. Password: `password`
3. Click "Sign In"

### 5.3 Test Core Features
- ✅ Create a new document
- ✅ Type some text (should auto-save)
- ✅ Upload a .txt or .md file
- ✅ Share with bob@example.com
- ✅ Logout
- ✅ Login as bob@example.com
- ✅ See shared document (read-only)

---

## Alternate: Deploy Backend to Render

If you prefer Render over Railway:

### Steps
1. Go to https://render.com/
2. Click "New"
3. Select "Web Service"
4. Connect GitHub repo
5. Set:
   - **Name:** `collaborative-editor-api`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
6. Add environment variables (same as Railway)
7. Create persistent disk at `/app` for SQLite
8. Click "Create Web Service"

Render will deploy and give you a URL like:
```
https://collaborative-editor-api.onrender.com
```

---

## Troubleshooting

### "CORS error" in browser console
**Solution:** 
- Verify `VITE_API_URL` in Vercel is correct
- Verify backend URL is accessible (test in browser)
- Redeploy frontend

### "Cannot connect to database"
**Solution (Railway):**
- Check that persistent storage is mounted at `/app`
- Go to **Storage** → verify SQLite is mounted
- Redeploy backend

**Solution (Render):**
- Check that persistent disk is at `/app`
- In **Disk** settings, verify mount point

### Login fails with "Invalid credentials"
**Solution:**
- Make sure you're using exact credentials:
  - Email: `alice@example.com` (lowercase)
  - Password: `password` (exactly)
- Check backend logs for errors

### Documents don't save
**Solution:**
- Check browser console for API errors
- Check backend logs (in Vercel/Railway dashboard)
- Verify environment variable `DATABASE_PATH=./documents.db`

---

## Enable Auto-Deploy

Both Vercel and Railway auto-deploy on push to GitHub.

To update production:
```bash
git add .
git commit -m "Feature: add document comments"
git push origin main
```

Both services will automatically rebuild and deploy within 1-2 minutes.

---

## Monitor Deployments

### Vercel
- Dashboard shows deployment history
- Click a deployment to see logs
- "Promote to Production" button to rollback

### Railway
- Project page shows build logs
- Deployments tab shows history
- Can rollback to previous deployments

---

## Cost Estimate

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Vercel Frontend** | 3 deployments/day | Free |
| **Railway Backend** | $5/month credit | Free (under limit) |
| **Total** | — | **FREE** |

Both services are completely free for this project's usage.

---

## Production Improvements (Future)

1. **Add error tracking** (Sentry)
   ```bash
   npm install @sentry/node
   ```

2. **Add database backups** (Railway auto-backups SQLite)

3. **Add monitoring** (Uptime monitoring)

4. **Add rate limiting** (Prevent spam)
   ```bash
   npm install express-rate-limit
   ```

5. **Upgrade to PostgreSQL** (Better than SQLite for production)

---

## Security Notes

⚠️ This deployment uses mock authentication. For production:

1. **Add real auth:**
   ```bash
   npm install jsonwebtoken bcryptjs
   ```

2. **Add HTTPS:** Both Vercel and Railway provide free HTTPS

3. **Add CORS restrictions:** In `backend/server.js`
   ```javascript
   app.use(cors({
     origin: 'https://your-frontend-url.vercel.app'
   }))
   ```

4. **Add rate limiting:**
   ```bash
   npm install express-rate-limit
   ```

---

## Deployment Checklist

- [ ] GitHub repository created and pushed
- [ ] Vercel account created and project deployed
- [ ] Railway account created and project deployed
- [ ] Backend URL added to Vercel environment variables
- [ ] Vercel redeployed with backend URL
- [ ] Frontend accessible at Vercel URL
- [ ] Can login as alice@example.com
- [ ] Can create and edit documents
- [ ] Documents persist after refresh
- [ ] Can upload .txt/.md files
- [ ] Can share documents
- [ ] Shared documents visible to other user
- [ ] Backend URL working in production

---

## Quick Links

- **Frontend:** https://your-project.vercel.app
- **Backend:** https://your-backend.up.railway.app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard
- **GitHub Repository:** https://github.com/YOUR_USERNAME/collaborative-editor

---

**Deployment Time:** 10-15 minutes total  
**Ongoing Maintenance:** Auto-deployed on push to GitHub
