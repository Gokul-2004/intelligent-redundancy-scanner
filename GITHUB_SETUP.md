# Push Code to GitHub - Step by Step

We'll push your code to GitHub, then deploy from there. Simple!

## Step 1: Create GitHub Repository (2 minutes)

1. Go to https://github.com
2. Sign in (or create account if needed)
3. Click the **"+"** icon (top right) → **"New repository"**
4. Fill in:
   - **Repository name**: `intelligent-redundancy-scanner` (or any name)
   - **Description**: "Google Workspace Add-on for finding duplicate files in Google Drive"
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **DO NOT** check "Initialize with README" (we have code already)
5. Click **"Create repository"**

## Step 2: Initialize Git in Your Project (1 minute)

Open terminal in your project directory:

```bash
cd /home/gk-krishnan/Desktop/TOOL
git init
```

## Step 3: Create .gitignore (1 minute)

Create `.gitignore` file to exclude unnecessary files:

```bash
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
*.egg-info/
dist/
build/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Node (frontend)
node_modules/
dist/
EOF
```

Or manually create `.gitignore` with the content above.

## Step 4: Add All Files (1 minute)

```bash
git add .
```

This adds all files (except those in `.gitignore`).

## Step 5: Make First Commit (1 minute)

```bash
git commit -m "Initial commit: Intelligent Redundancy Scanner"
```

## Step 6: Connect to GitHub (1 minute)

Copy the repository URL from GitHub (it shows after creating repo, like `https://github.com/yourusername/intelligent-redundancy-scanner.git`)

Then run:

```bash
git remote add origin https://github.com/yourusername/intelligent-redundancy-scanner.git
```

Replace `yourusername` and `intelligent-redundancy-scanner` with your actual values.

## Step 7: Push to GitHub (1 minute)

```bash
git branch -M main
git push -u origin main
```

You'll be asked for GitHub username and password (use a Personal Access Token if 2FA is enabled).

## Step 8: Verify on GitHub (1 minute)

1. Go to your GitHub repository
2. You should see all your files
3. Verify `backend/` folder is there
4. Verify `addon/` folder is there

## Done! ✅

Your code is now on GitHub. Next step: Deploy to Railway!

## Quick Command Summary

```bash
cd /home/gk-krishnan/Desktop/TOOL
git init
git add .
git commit -m "Initial commit: Intelligent Redundancy Scanner"
git remote add origin https://github.com/yourusername/repo-name.git
git branch -M main
git push -u origin main
```

## Troubleshooting

### "Permission denied"
- Make sure you're logged into GitHub
- Use Personal Access Token instead of password (if 2FA enabled)

### "Repository not found"
- Check repository name is correct
- Make sure repository exists on GitHub

### "Large files"
- If you have large files, GitHub might reject
- Check `.gitignore` excludes `venv/` and `node_modules/`

## Next Step

Once code is on GitHub:
1. Go to Railway
2. Deploy from GitHub repo
3. Select your repository
4. Deploy!

See `backend/DEPLOY_RAILWAY.md` for deployment steps.

