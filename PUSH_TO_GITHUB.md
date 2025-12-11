# Quick Guide: Push to GitHub

## Step 1: Create GitHub Repository

1. Go to https://github.com
2. Click **"+"** (top right) → **"New repository"**
3. Name: `intelligent-redundancy-scanner`
4. Choose **Private** (or Public)
5. **DO NOT** check "Initialize with README"
6. Click **"Create repository"**

## Step 2: Copy Repository URL

After creating, GitHub shows you commands. Copy the repository URL:
```
https://github.com/yourusername/intelligent-redundancy-scanner.git
```

## Step 3: Run These Commands

In your terminal (in `/home/gk-krishnan/Desktop/TOOL`):

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: Intelligent Redundancy Scanner"

# Rename branch to main
git branch -M main

# Connect to GitHub (replace with YOUR repository URL)
git remote add origin https://github.com/yourusername/intelligent-redundancy-scanner.git

# Push to GitHub
git push -u origin main
```

## Step 4: Authenticate

If asked for credentials:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your password)
  - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token
  - Check "repo" scope
  - Copy token and use as password

## Done! ✅

Your code is now on GitHub. Next: Deploy to Railway!

