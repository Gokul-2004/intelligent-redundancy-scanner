# How to Get Google Client ID (3 Minutes)

## Quick Steps

### 1. Go to Google Cloud Console
https://console.cloud.google.com

### 2. Create/Select Project
- Click "Select a project" (top bar)
- Click "New Project"
- Name: `Redundancy Scanner`
- Click "Create"
- Wait ~30 seconds, then select the project

### 3. Enable Drive API
- Left sidebar: "APIs & Services" → "Library"
- Search: "Google Drive API"
- Click it → Click "Enable"
- Wait a few seconds

### 4. Configure OAuth Consent Screen (First Time Only)
- Left sidebar: "APIs & Services" → "OAuth consent screen"
- User Type: **External** → Click "Create"
- Fill in:
  - App name: `Redundancy Scanner`
  - User support email: Your email
  - Developer contact: Your email
- Click "Save and Continue"
- Scopes: Click "Add or Remove Scopes"
  - Search and add: `.../auth/drive.readonly`
  - Search and add: `.../auth/drive.file`
  - Click "Update" → "Save and Continue"
- Test users: Click "Add Users" → Add your email
- Click "Save and Continue" → "Back to Dashboard"

### 5. Create OAuth Client ID
- Left sidebar: "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth client ID"
- Application type: **Web application**
- Name: `Web Client`
- Authorized JavaScript origins: 
  - Click "Add URI"
  - Enter: `http://localhost:5173`
- Authorized redirect URIs:
  - Click "Add URI"
  - Enter: `http://localhost:5173`
- Click "Create"
- **Copy the Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

### 6. Update .env File
Edit `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=paste-your-client-id-here.apps.googleusercontent.com
VITE_API_URL=http://localhost:8000
```

### 7. Restart Frontend
```bash
# Stop frontend (Ctrl+C)
cd frontend
npm run dev
```

## Done! ✅

Now click "Sign in with Google" in the app!

