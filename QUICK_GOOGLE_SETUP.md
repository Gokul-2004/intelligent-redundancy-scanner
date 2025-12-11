# Quick Google Drive Setup (5 Minutes)

## Step 1: Get Google Client ID

### Option A: Quick Test (Use Test Client ID)
For testing, you can use a placeholder, but you'll need a real one to actually work.

### Option B: Create Your Own (Recommended)

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create Project** (or select existing):
   - Click "Select a project" → "New Project"
   - Name: `Redundancy Scanner`
   - Click "Create"
3. **Enable Drive API**:
   - Go to "APIs & Services" → "Library"
   - Search "Google Drive API"
   - Click "Enable"
4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If first time, configure consent screen:
     - User Type: **External**
     - App name: `Redundancy Scanner`
     - Your email
     - Click through (Save and Continue)
     - Scopes: Add `.../auth/drive.readonly` and `.../auth/drive.file`
     - Test users: Add your email
   - Back to credentials:
     - Application type: **Web application**
     - Name: `Web Client`
     - Authorized JavaScript origins: `http://localhost:5173`
     - Authorized redirect URIs: `http://localhost:5173`
     - Click "Create"
   - **Copy the Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

---

## Step 2: Create .env File

Create `frontend/.env`:

```bash
cd frontend
nano .env
```

Add this (replace with your actual Client ID):
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_API_URL=http://localhost:8000
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## Step 3: Restart Frontend

```bash
# Stop current frontend (Ctrl+C in terminal)
npm run dev
```

---

## That's It!

Now the app should work. When you click "Sign in with Google", it will use your Client ID.

---

## Troubleshooting

### "Invalid client ID"
- Make sure Client ID is correct (no spaces, full string)
- Make sure you copied the entire Client ID

### "Redirect URI mismatch"
- Check Google Console → Credentials → Your OAuth client
- Make sure `http://localhost:5173` is in "Authorized redirect URIs"

### Still not working?
- Check browser console (F12) for errors
- Make sure `.env` file is in `frontend/` directory
- Make sure you restarted frontend after creating `.env`

