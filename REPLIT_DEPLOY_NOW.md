# Deploy to Replit (FREE & EASY) 🚀

## Why Replit?
- ✅ **100% Free** (with reasonable limits)
- ✅ **Super Easy** - Just connect GitHub
- ✅ **Auto HTTPS** - Gets URL automatically
- ✅ **No Credit Card** needed
- ✅ **Instant Deploy** - Works in minutes

## Step-by-Step:

### 1. Go to Replit
Visit: https://replit.com
- Sign up/login (free account)

### 2. Create New Repl
- Click **"Create Repl"** (top right)
- Choose **"Import from GitHub"**
- Paste your repo URL: `https://github.com/Gokul-2004/intelligent-redundancy-scanner`
- Name it: `intelligent-redundancy-scanner`
- Language: **Python**
- Click **"Import"**

### 3. Configure for Backend
Replit will open your code. Now:

**A. Set Working Directory:**
- In the left sidebar, you'll see files
- Replit needs to know this is a Python project in `backend/` folder

**B. Create `.replit` file** (I'll create this for you):
```toml
run = "cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000"
entrypoint = "backend/app/main.py"
```

**C. Create `replit.nix`** (for dependencies):
```nix
{ pkgs }: {
  deps = [
    pkgs.python312
    pkgs.python312Packages.pip
  ];
}
```

### 4. Install Dependencies
In Replit's **Shell** (bottom panel):
```bash
cd backend
pip install -r requirements.txt
```

### 5. Run the Server
- Click the **"Run"** button (top center)
- Or in Shell: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`

### 6. Get Your URL
- Replit gives you a URL like: `https://your-repl-name.your-username.repl.co`
- This is your **BACKEND_URL** for the Apps Script add-on!

### 7. Make it Always On (Optional)
- Free tier: Repl sleeps after inactivity
- Upgrade to "Always On" (paid) OR use a free "keep-alive" service
- Or just use it - it wakes up when you call it (takes ~30 seconds first time)

## That's It! 🎉

Your backend is now live at: `https://your-repl-name.your-username.repl.co`

**Test it:**
- Visit: `https://your-repl-name.your-username.repl.co/health`
- Should see: `{"status": "healthy"}`

## Next Step:
Once you have the URL, we'll update the Apps Script add-on to use it!

