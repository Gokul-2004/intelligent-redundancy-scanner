# Getting Started - Step by Step

## What You Need

1. **Python 3.11+** (for backend)
2. **Node.js 18+** (for frontend)
3. **Microsoft account** (to get Graph API token)

---

## Step 1: Set Up Backend (5 minutes)

### 1.1 Install Python Dependencies

```bash
cd backend
python -m venv venv

# On Mac/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

### 1.2 Create `.env` File (Optional)

```bash
# Create .env file (or skip - we don't need it for MVP)
cp .env.example .env
```

Actually, you can skip this! The `.env` file is optional since we're not using a database.

### 1.3 Test Backend

```bash
# Make sure you're in backend/ directory with venv activated
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Open http://localhost:8000 in browser - you should see:
```json
{
  "message": "Intelligent Redundancy Scanner API",
  "mode": "stateless"
}
```

✅ **Backend is working!**

---

## Step 2: Set Up Frontend (5 minutes)

### 2.1 Install Node Dependencies

Open a **new terminal** (keep backend running):

```bash
cd frontend
npm install
```

### 2.2 Start Frontend

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in browser.

✅ **Frontend is working!**

---

## Step 3: Get Microsoft Graph Token (2 minutes)

### Option A: Graph Explorer (Easiest)

1. Go to https://developer.microsoft.com/en-us/graph/graph-explorer
2. Click **"Sign in"** (top right)
3. Sign in with your Microsoft account
4. Click **"Access token"** button
5. Copy the token (long string starting with `eyJ0eXAi...`)

### Option B: Manual OAuth (If needed)

We can implement this later if you want users to sign in directly.

---

## Step 4: Test the App

1. **Open frontend**: http://localhost:5173
2. **Paste your Microsoft Graph token** in the textarea
3. **Click "Start Scan"**
4. Wait for results!

**Note**: The scan endpoint might not be fully implemented yet. Let's test what we have first.

---

## Step 5: Implement Core Features (Next Steps)

### Current Status:
- ✅ Backend structure
- ✅ Frontend UI
- ✅ Graph API client (skeleton)
- ⏭️ **Need to implement**: Actual file scanning

### What to Build Next:

1. **Test Graph API Connection**
   - Make sure we can list files from SharePoint
   - Test with a real token

2. **Implement File Scanning**
   - List all files from user's SharePoint/OneDrive
   - Download file content
   - Compute hashes

3. **Find Duplicates**
   - Group files by hash (exact duplicates)
   - Find similar filenames (near duplicates)

4. **Show Results**
   - Display duplicate groups
   - Show storage savings

5. **Add Approval Flow**
   - User selects files to delete
   - Execute deletion via Graph API

---

## Troubleshooting

### Backend won't start
```bash
# Make sure venv is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

### CORS errors
- Make sure backend is running on port 8000
- Make sure frontend is running on port 5173
- Check `backend/app/config.py` has correct CORS origins

### Graph API errors
- Token might be expired (get a new one)
- Token might not have correct permissions
- Check token in Graph Explorer first

---

## Quick Test Commands

### Test Backend Health
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Test Backend Root
```bash
curl http://localhost:8000/
# Should return JSON with message
```

### Test Scan Endpoint (with token)
```bash
curl -X POST http://localhost:8000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"microsoft_token":"YOUR_TOKEN_HERE"}'
```

---

## File Structure

```
TOOL/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Config (minimal)
│   │   ├── scanner/
│   │   │   ├── graph_client.py  # Graph API client
│   │   │   ├── hasher.py        # SHA-256 hashing
│   │   │   └── duplicate_finder.py  # Find duplicates
│   │   └── api/
│   │       └── routes/
│   │           └── scan.py      # Scan endpoint
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main UI
    │   └── services/
    │       └── api.js           # API calls
    └── package.json
```

---

## Next: Implement File Scanning

Once backend and frontend are running, we need to:

1. **Test Graph API** - Can we list files?
2. **Implement scanning** - Download and hash files
3. **Find duplicates** - Group by hash
4. **Show results** - Display in UI

Want me to help implement the file scanning logic next?

