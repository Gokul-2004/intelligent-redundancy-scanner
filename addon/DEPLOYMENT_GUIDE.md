# Deployment Guide for Google Workspace Add-on

This guide walks you through deploying the Intelligent Redundancy Scanner as a Google Workspace Add-on.

## Prerequisites

- Google Cloud Project with OAuth configured
- FastAPI backend deployed and accessible via HTTPS
- Apps Script project created
- All required APIs enabled

## Step 1: Deploy Backend

### Option A: Railway (Recommended)

1. Go to https://railway.app
2. Sign up/login
3. Click "New Project"
4. Select "Deploy from GitHub" (or upload code)
5. Connect your repository
6. Set environment variables:
   - No special variables needed (stateless)
7. Railway auto-detects FastAPI and deploys
8. Copy the deployment URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. Go to https://render.com
2. Create new "Web Service"
3. Connect GitHub repository
4. Settings:
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Deploy
6. Copy URL

### Option C: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create app: `fly launch`
4. Deploy: `fly deploy`
5. Copy URL

### Update CORS

After deployment, update `backend/app/config.py` to include your production frontend URL and Apps Script origins.

## Step 2: Create Apps Script Project

1. Go to https://script.google.com
2. Click "New Project"
3. Name: "Intelligent Redundancy Scanner Add-on"
4. Delete default `Code.gs` content
5. Copy `Code.gs` from this directory
6. Update `BACKEND_URL` in `Code.gs` with your deployed backend URL
7. Update `CLIENT_ID` with your Google Cloud OAuth client ID

## Step 3: Configure Manifest

1. In Apps Script editor, click project settings (gear icon)
2. Check "Show 'appsscript.json' manifest file in editor"
3. Copy contents from `appsscript.json` in this directory
4. Replace the manifest in Apps Script
5. Verify OAuth scopes are correct:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/script.external_request`

## Step 4: Test Locally

1. In Apps Script, click "Run" → Select `onHomepage`
2. Authorize the script (first time only)
3. Test the add-on functions
4. Check logs: View → Logs

## Step 5: Deploy as Add-on

1. Click "Deploy" → "New deployment"
2. Select type: "Add-on"
3. Fill in:
   - Description: "Find duplicate files in Google Drive using AI-powered content analysis"
   - Version: "1"
4. Click "Deploy"
5. **Copy the Deployment ID** (you'll need this)

## Step 6: Configure OAuth Consent Screen

1. Go to Google Cloud Console
2. APIs & Services → OAuth consent screen
3. Ensure:
   - User Type: External (or Internal for Workspace)
   - App name: "Intelligent Redundancy Scanner"
   - Support email: Your email
   - Scopes added:
     - `.../auth/drive.readonly`
     - `.../auth/drive.file`
     - `.../auth/script.external_request`
4. Test users: Add your email
5. Save

## Step 7: Test Add-on in Drive

1. Open Google Drive
2. Click "Add-ons" → "Get add-ons"
3. Search for your add-on (if published) OR
4. Use test deployment:
   - Go to Apps Script
   - Deploy → Test deployments
   - Copy test URL
   - Install from test URL

## Step 8: Prepare Marketplace Submission

### Create Privacy Policy

1. Use `PRIVACY_POLICY.md` template
2. Fill in:
   - [DATE] → Current date
   - [YOUR_SUPPORT_EMAIL] → Your email
   - [YOUR_WEBSITE_URL] → Your website (or GitHub)
   - [YOUR HOSTING PROVIDER] → Railway/Render/etc.
3. Host on:
   - GitHub Pages (free)
   - Your website
   - Google Sites
4. Copy the public URL

### Create Terms of Service

1. Use `TERMS_OF_SERVICE.md` template
2. Fill in:
   - [DATE] → Current date
   - [YOUR_SUPPORT_EMAIL] → Your email
   - [YOUR_WEBSITE_URL] → Your website
   - [YOUR JURISDICTION] → Your country/state
3. Host on same platform
4. Copy the public URL

### Record OAuth Video

1. Use `OAUTH_VIDEO_SCRIPT.md` as guide
2. Record 3-5 minute demo
3. Upload to YouTube (unlisted)
4. Copy video URL

## Step 9: Submit OAuth Verification

1. Go to Google Cloud Console
2. APIs & Services → OAuth consent screen
3. Click "Publish App" (or "Submit for Verification")
4. Fill in:
   - Privacy Policy URL
   - Terms of Service URL
   - OAuth video URL (YouTube)
   - Support email
5. Submit
6. Wait 2-4 weeks for review
7. Address any feedback

## Step 10: Create Marketplace Listing

1. Go to Google Cloud Console
2. APIs & Services → Google Workspace Marketplace SDK
3. Enable the API (if not already)
4. Click "Store Listing"
5. Fill in:
   - App name: "Intelligent Redundancy Scanner"
   - Short description (80 chars)
   - Long description (4000 chars)
   - Category: Productivity
   - App icon (512x512px)
   - Screenshots (5+ images, 1280x800px)
   - Privacy Policy URL
   - Terms of Service URL
   - Support email
6. Set pricing: Free (recommended for initial launch)
7. Save draft

## Step 11: Submit to Marketplace

1. Review all information
2. Ensure OAuth verification is approved
3. Click "Submit for Review"
4. Wait 2-6 weeks for approval
5. Monitor for feedback
6. Address any issues quickly

## Step 12: Post-Launch

### Monitor
- User reviews
- Error logs
- Usage metrics
- Support requests

### Update
- Fix bugs quickly
- Add features based on feedback
- Improve documentation
- Respond to reviews

## Troubleshooting

### Add-on Not Appearing
- Check deployment is active
- Verify OAuth scopes
- Check Apps Script execution logs

### Backend Errors
- Verify CORS settings
- Check backend logs
- Test API endpoints directly
- Verify BACKEND_URL in Apps Script

### OAuth Errors
- Check consent screen configuration
- Verify scopes match manifest
- Check test users are added
- Review OAuth verification status

### Marketplace Rejection
- Read feedback carefully
- Address all issues
- Resubmit with improvements
- Be patient (process takes time)

## Checklist

Before submission:
- [ ] Backend deployed and tested
- [ ] Apps Script add-on working
- [ ] OAuth consent screen configured
- [ ] Privacy policy hosted
- [ ] Terms of service hosted
- [ ] OAuth video recorded and uploaded
- [ ] OAuth verification submitted
- [ ] Marketplace listing created
- [ ] Screenshots prepared
- [ ] App icon created
- [ ] All documentation complete

## Timeline

- **Backend Deployment**: 1 day
- **Apps Script Setup**: 1 day
- **OAuth Verification**: 2-4 weeks
- **Marketplace Submission**: 1 day
- **Marketplace Review**: 2-6 weeks
- **Total**: 5-11 weeks

## Success Tips

1. **Test thoroughly** before submission
2. **Document everything** clearly
3. **Be patient** with review process
4. **Respond quickly** to feedback
5. **Keep it simple** - focus on core functionality

## Next Steps

After approval:
- Monitor user feedback
- Fix bugs quickly
- Add requested features
- Build user base
- Consider monetization (if desired)

