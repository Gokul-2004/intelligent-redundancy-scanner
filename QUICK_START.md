# Quick Start Checklist ✅

## Right Now - Do These Steps:

### 1. Backend Setup (5 min)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
✅ Backend running on http://localhost:8000

### 2. Frontend Setup (5 min)
**Open new terminal:**
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend running on http://localhost:5173

### 3. Get Microsoft Graph Token (2 min)
1. Go to https://developer.microsoft.com/en-us/graph/graph-explorer
2. Sign in
3. Click "Access token"
4. Copy token

### 4. Test It!
1. Open http://localhost:5173
2. Paste token
3. Click "Start Scan"

---

## What Happens Next?

The scan endpoint is **partially implemented**. It will:
- ✅ Connect to Graph API
- ✅ List files
- ⏭️ Need to: Download and hash files (might have errors)

**If you get errors**, that's normal! We need to:
1. Fix Graph API calls
2. Handle file downloads properly
3. Implement hashing correctly

---

## Common First Errors

### "Module not found"
```bash
# Make sure venv is activated
source venv/bin/activate
pip install -r requirements.txt
```

### "Connection refused"
- Make sure backend is running on port 8000
- Check terminal for errors

### "Graph API error"
- Token might be expired (get new one)
- Token might not have permissions
- We might need to fix the Graph API client code

---

## Next Steps After Setup

1. **Test Graph API** - Can we list files?
2. **Fix file downloading** - Handle large files, errors
3. **Implement hashing** - SHA-256 for exact duplicates
4. **Add near-duplicate detection** - Filename similarity first
5. **Polish UI** - Better error handling, progress bars

**Ready to start?** Run the commands above and let me know what happens!

