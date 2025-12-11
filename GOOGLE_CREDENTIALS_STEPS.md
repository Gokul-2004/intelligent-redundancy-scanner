# Google Credentials Setup - Step by Step

## Current Step: Select Data Type

**Select: "User data"** ✅

This is correct because:
- We're accessing the user's Google Drive files
- User needs to consent (OAuth)
- This creates an OAuth client ID (what we need)

**Do NOT select "Application data"** - that's for service accounts, not user files.

---

## Next Steps After Selecting "User data"

### Step 1: OAuth Consent Screen (if first time)
You'll be asked to configure OAuth consent screen:
- **User Type**: Select **"External"** (for personal accounts)
- Click "Create"
- Fill in:
  - App name: `Redundancy Scanner`
  - User support email: Your email
  - Developer contact: Your email
- Click "Save and Continue"
- **Scopes**: Click "Add or Remove Scopes"
  - Search: `drive.readonly` → Add it
  - Search: `drive.file` → Add it
  - Click "Update" → "Save and Continue"
- **Test users**: Click "Add Users" → Add your email
- Click "Save and Continue" → "Back to Dashboard"

### Step 2: Create OAuth Client
- Application type: **Web application**
- Name: `Web Client` (or any name)
- **Authorized JavaScript origins**:
  - Click "Add URI"
  - Enter: `http://localhost:5173`
- **Authorized redirect URIs**:
  - Click "Add URI"
  - Enter: `http://localhost:5173`
- Click "Create"

### Step 3: Copy Client ID
- You'll see a popup with your Client ID
- It looks like: `123456789-abc.apps.googleusercontent.com`
- **Copy this entire string**

### Step 4: Update .env
Edit `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=paste-your-client-id-here
VITE_API_URL=http://localhost:8000
```

### Step 5: Restart Frontend
The frontend should auto-reload, but if needed:
```bash
# Stop (Ctrl+C) and restart
cd frontend
npm run dev
```

---

## Quick Reference

- ✅ **User data** = OAuth client (what we need)
- ❌ **Application data** = Service account (not for user files)

Keep going with "User data"!

