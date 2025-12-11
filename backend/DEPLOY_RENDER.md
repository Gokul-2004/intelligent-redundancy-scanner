# Deploy Backend to Render (Alternative Option)

Render is another great option with a free tier. Good for Python/FastAPI apps.

## Step 1: Create Render Account (2 minutes)

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email
4. Verify your email

## Step 2: Create New Web Service (2 minutes)

1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository
   - OR use "Public Git repository" if repo is public

## Step 3: Configure Service (5 minutes)

Fill in the form:

- **Name**: `intelligent-redundancy-scanner` (or any name)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Step 4: Deploy (3 minutes)

1. Click "Create Web Service"
2. Render will start building
3. Watch build logs
4. Wait for "Your service is live"

## Step 5: Get Your Backend URL (1 minute)

1. Your service URL is shown at the top
2. Format: `https://your-app-name.onrender.com`
3. **Copy this URL** - this is your `BACKEND_URL`

## Step 6: Test Your Backend (2 minutes)

1. Open the URL in browser
2. Should see: `{"message": "Intelligent Redundancy Scanner API", ...}`
3. Test: `https://your-app.onrender.com/health`
4. Should return: `{"status": "healthy"}`

## Step 7: Enable Auto-Deploy (Optional)

1. Go to "Settings"
2. Enable "Auto-Deploy"
3. Now every push to GitHub auto-deploys

## Troubleshooting

### Build Timeout
- Render free tier has 10-minute build limit
- If timeout, upgrade to paid or optimize build

### Cold Starts
- Free tier services sleep after 15 min inactivity
- First request after sleep takes ~30 seconds
- Paid tier eliminates this

### Port Issues
- Ensure start command uses `$PORT`
- Render sets this automatically

## Render Free Tier

- **Free tier available**
- Services sleep after 15 min inactivity
- 750 hours/month free
- Good for development/testing

## Next Step

Copy your backend URL:
- `BACKEND_URL = 'https://your-app.onrender.com'`

Use this in Apps Script setup!

