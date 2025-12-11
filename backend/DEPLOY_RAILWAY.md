# Deploy Backend to Railway (Easiest Option)

Railway is the easiest way to deploy FastAPI apps. Free tier available, auto-detects Python.

## Step 1: Create Railway Account (2 minutes)

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

## Step 2: Create New Project (1 minute)

1. Click "New Project"
2. Select "Deploy from GitHub repo" (if you have code on GitHub)
   - OR select "Empty Project" if you want to upload code manually

## Step 3: Connect Repository (if using GitHub)

1. Authorize Railway to access your GitHub
2. Select your repository: `TOOL` (or whatever you named it)
3. Railway will auto-detect it's a Python project

## Step 4: Configure Deployment (5 minutes)

### Option A: Auto-Detection (Easiest)

Railway should auto-detect:
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

If it doesn't auto-detect, manually set:

1. Click on your service
2. Go to "Settings"
3. Set **Root Directory**: `backend`
4. Go to "Variables" tab
5. Railway will auto-set `PORT` variable

### Option B: Manual Configuration

If auto-detection doesn't work:

1. Click on your service
2. Go to "Settings"
3. **Root Directory**: `backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Step 5: Deploy (2 minutes)

1. Railway will automatically start building
2. Watch the build logs
3. Wait for "Deploy successful"
4. Your app is live! 🎉

## Step 6: Get Your Backend URL (1 minute)

1. Click on your service
2. Go to "Settings" tab
3. Scroll to "Domains"
4. Click "Generate Domain"
5. **Copy the URL** (e.g., `https://your-app.railway.app`)
6. This is your `BACKEND_URL` - save it!

## Step 7: Test Your Backend (2 minutes)

1. Open the URL in browser
2. You should see: `{"message": "Intelligent Redundancy Scanner API", ...}`
3. Test health endpoint: `https://your-app.railway.app/health`
4. Should return: `{"status": "healthy"}`

## Step 8: Update CORS (if needed)

The CORS is already configured in `config.py` to allow Apps Script. But if you need to add your frontend URL:

1. Go to Railway dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add variable (if needed):
   - Name: `CORS_ORIGINS`
   - Value: `https://your-frontend.vercel.app,https://script.google.com`

Actually, you don't need this - the CORS is already set in code!

## Troubleshooting

### Build Fails
- Check build logs in Railway
- Common issue: Missing dependencies
- Fix: Ensure `requirements.txt` has all packages

### App Crashes
- Check logs in Railway
- Common issue: Port not set correctly
- Fix: Ensure start command uses `$PORT`

### CORS Errors
- Already configured in `config.py`
- If still issues, check Railway logs

## What You Have Now

✅ Backend deployed at: `https://your-app.railway.app`  
✅ HTTPS enabled automatically  
✅ Auto-scaling (Railway handles it)  
✅ Logs available in Railway dashboard  

## Next Step

Copy your backend URL and use it in Apps Script setup:
- `BACKEND_URL = 'https://your-app.railway.app'`

## Railway Free Tier

- **$5 free credit** per month
- Enough for development/testing
- Pay-as-you-go after that
- Very affordable (~$5-10/month for low traffic)

## That's It!

Your backend is now live and ready for the add-on to use! 🚀

