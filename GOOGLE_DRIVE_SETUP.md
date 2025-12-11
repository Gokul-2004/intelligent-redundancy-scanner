# Google Drive Setup - Much Easier! 🎉

## Why Google Drive?

✅ **No Azure AD tenant needed** - Just a Google account
✅ **5-minute setup** - Much faster than Microsoft
✅ **Simple OAuth** - Google Sign-In is straightforward
✅ **Same functionality** - All duplicate detection features work

---

## Step 1: Create Google Cloud Project (2 minutes)

1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Name: `Redundancy Scanner` (or any name)
5. Click "Create"
6. Wait ~30 seconds for project to be created

---

## Step 2: Enable Google Drive API (1 minute)

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it → Click "Enable"
4. Wait a few seconds

---

## Step 3: Create OAuth Credentials (2 minutes)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: **External** (for personal accounts)
   - App name: `Redundancy Scanner`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes"
     - Add: `.../auth/drive.readonly`
     - Add: `.../auth/drive.file`
   - Click "Save and Continue"
   - Test users: Add your email (for testing)
   - Click "Save and Continue"
4. Back to Credentials:
   - Application type: **Web application**
   - Name: `Redundancy Scanner Web`
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
   - Click "Create"
5. **Copy the Client ID** (you'll need this!)

---

## Step 4: Update Frontend Config

Create/update `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_API_URL=http://localhost:8000
```

---

## Step 5: Restart Frontend

```bash
cd frontend
npm run dev
```

---

## That's It! 🎉

Now users can:
1. Click "Sign in with Google"
2. Sign in with their Google account
3. Grant permissions
4. Start scanning automatically!

**Much simpler than Microsoft!** No tenant, no complex setup, just works!

---

## Troubleshooting

### "Error initializing Google API"
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Make sure you restarted the frontend after adding `.env`

### "Access blocked: This app's request is invalid"
- Check that redirect URI in Google Console matches: `http://localhost:5173`
- Make sure OAuth consent screen is configured

### "Token expired"
- Google tokens expire after 1 hour
- The app will automatically refresh, or user can sign in again

---

## Production Deployment

For production, update:
- Authorized JavaScript origins: `https://yourdomain.com`
- Authorized redirect URIs: `https://yourdomain.com`
- Update `VITE_GOOGLE_CLIENT_ID` in production `.env`

