# Backend Deployment Guide - Choose Your Platform

Your FastAPI backend needs to be deployed to a public URL so the Apps Script add-on can call it.

## Quick Comparison

| Platform | Difficulty | Free Tier | Best For |
|----------|------------|-----------|----------|
| **Railway** | ⭐ Easiest | $5 credit/month | Quick deployment |
| **Render** | ⭐⭐ Easy | 750 hrs/month | Free tier users |
| **Fly.io** | ⭐⭐⭐ Medium | 3 VMs free | Production apps |

## Recommendation: Start with Railway

**Why Railway?**
- ✅ Easiest setup (auto-detects Python)
- ✅ No configuration needed
- ✅ Free $5 credit/month
- ✅ Auto HTTPS
- ✅ Great for FastAPI

## Step-by-Step: Railway (Recommended)

### 1. Sign Up (2 min)
- Go to https://railway.app
- Sign up with GitHub (easiest)

### 2. Create Project (1 min)
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your `TOOL` repository

### 3. Configure (Auto-detected!)
Railway should auto-detect:
- Root Directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

If not, manually set in Settings.

### 4. Deploy (2 min)
- Railway builds automatically
- Wait for "Deploy successful"
- Done! 🎉

### 5. Get URL (1 min)
- Click service → Settings → Domains
- Click "Generate Domain"
- Copy URL: `https://your-app.railway.app`
- **This is your BACKEND_URL!**

### 6. Test (1 min)
- Open URL in browser
- Should see: `{"message": "Intelligent Redundancy Scanner API"}`
- Test: `https://your-app.railway.app/health`

**Total time: ~7 minutes**

## Detailed Guides

- **Railway**: See `DEPLOY_RAILWAY.md` (detailed steps)
- **Render**: See `DEPLOY_RENDER.md` (alternative)
- **Fly.io**: See `DEPLOY_FLYIO.md` (advanced)

## What You Need

### Before Deployment
- ✅ Backend code ready (`/backend` folder)
- ✅ `requirements.txt` exists
- ✅ GitHub repo (recommended) or code ready to upload

### After Deployment
- ✅ Backend URL (e.g., `https://your-app.railway.app`)
- ✅ HTTPS enabled (automatic)
- ✅ Health endpoint working

## Important Notes

### CORS Already Configured
Your `backend/app/config.py` already includes:
- Apps Script origins (`script.google.com`)
- Local development origins
- No changes needed!

### Environment Variables
Your app is stateless - **no environment variables needed!**
- No database
- No API keys (OAuth tokens come from users)
- Just deploy and go!

### Port Configuration
- Railway/Render/Fly.io set `$PORT` automatically
- Your start command uses `$PORT`
- No manual configuration needed

## Troubleshooting

### Build Fails
**Error**: `ModuleNotFoundError` or similar
**Fix**: Check `requirements.txt` has all packages

### App Crashes
**Error**: Port binding issues
**Fix**: Ensure start command uses `$PORT`, not hardcoded port

### CORS Errors
**Error**: Apps Script can't connect
**Fix**: Already configured in `config.py` - check backend URL is correct

## Next Steps After Deployment

1. ✅ Copy your backend URL
2. ✅ Test it works (`/health` endpoint)
3. ✅ Save URL for Apps Script setup
4. ✅ Move to Apps Script setup next!

## Quick Checklist

- [ ] Choose platform (Railway recommended)
- [ ] Sign up and create project
- [ ] Configure deployment
- [ ] Deploy backend
- [ ] Get backend URL
- [ ] Test backend works
- [ ] Save URL for next step

## Ready?

**Start with Railway** - it's the fastest path to a deployed backend!

See `DEPLOY_RAILWAY.md` for detailed steps.

