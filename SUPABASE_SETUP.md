# Supabase Setup Guide - Step by Step

## What You Need to Do

### Step 1: Create Supabase Account & Project (5 minutes)

1. **Go to Supabase**
   - Visit https://supabase.com
   - Click "Start your project" or "Sign in"

2. **Create Account** (if you don't have one)
   - Sign up with GitHub, Google, or email
   - Verify your email if needed

3. **Create New Project**
   - Click "New Project"
   - Fill in:
     - **Name**: `redundancy-scanner` (or any name)
     - **Database Password**: Create a strong password (save it!)
     - **Region**: Choose closest to you
     - **Pricing Plan**: Free (for MVP)
   - Click "Create new project"
   - Wait 2-3 minutes for project to initialize

---

### Step 2: Get Your Supabase Credentials (2 minutes)

1. **Go to Project Settings**
   - Click the gear icon (⚙️) in left sidebar
   - Or go to: Settings → API

2. **Copy These Values** (you'll need them for backend `.env`):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role key**: Click "Reveal" next to `service_role` key
     - ⚠️ **Keep this secret!** Don't commit to git
   - **anon key**: Public key (less sensitive, but still don't commit)

3. **Save them somewhere** (text file, password manager, etc.)

---

### Step 3: Run Database Migration (3 minutes)

1. **Open SQL Editor**
   - In Supabase dashboard, click "SQL Editor" in left sidebar
   - Or go to: Database → SQL Editor

2. **Create New Query**
   - Click "New query"

3. **Run the Migration**
   - Open the file: `supabase/migrations/002_simplified_no_auth.sql`
   - Copy ALL the SQL code
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Tables Created**
   - Go to: Database → Tables
   - You should see these tables:
     - ✅ `files`
     - ✅ `duplicate_groups`
     - ✅ `duplicate_group_members`
     - ✅ `audit_logs`
     - ✅ `scan_jobs`

---

### Step 4: Set Up Backend `.env` File (2 minutes)

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file** (use your Supabase credentials):
   ```env
   # Supabase
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key-here

   # Microsoft Graph (optional for now)
   AZURE_TENANT_ID=
   AZURE_CLIENT_ID=
   AZURE_CLIENT_SECRET=

   # App
   APP_URL=http://localhost:3000

   # CORS
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Replace**:
   - `xxxxx.supabase.co` with your Project URL
   - `your-service-role-key-here` with your service_role key

---

### Step 5: Test Connection (Optional, 2 minutes)

1. **Install Python dependencies** (if not done):
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Test Supabase connection**:
   Create a test file `test_supabase.py`:
   ```python
   from app.database import get_supabase_client
   
   supabase = get_supabase_client()
   
   # Test: Insert a test record
   result = supabase.table("scan_jobs").insert({
       "status": "running",
       "total_files": 0
   }).execute()
   
   print("✅ Supabase connection successful!")
   print(f"Created job: {result.data[0]['id']}")
   ```

3. **Run test**:
   ```bash
   python test_supabase.py
   ```

---

## Quick Checklist

- [ ] Created Supabase account
- [ ] Created new project
- [ ] Copied Project URL
- [ ] Copied service_role key
- [ ] Ran database migration (002_simplified_no_auth.sql)
- [ ] Verified tables exist
- [ ] Created backend `.env` file
- [ ] Added Supabase credentials to `.env`
- [ ] Tested connection (optional)

---

## Troubleshooting

### "Project URL not found"
- Make sure you copied the full URL: `https://xxxxx.supabase.co`
- Don't include `/rest/v1` or any path

### "Invalid API key"
- Make sure you're using `service_role` key, not `anon` key
- Check for extra spaces when copying
- Make sure you clicked "Reveal" to see the full key

### "Table already exists" error
- This is fine! Tables are already created
- You can skip the migration or drop tables first

### "Permission denied"
- Make sure you're using `service_role` key (not `anon` key)
- Service role key bypasses RLS (which we don't have anyway)

### Can't find SQL Editor
- Look in left sidebar for "SQL Editor"
- Or go to: Database → SQL Editor
- Make sure you're in the correct project

---

## What's Next?

After Supabase is set up:

1. ✅ **Supabase**: Done (you just did this!)
2. ⏭️ **Backend**: Set up FastAPI, test endpoints
3. ⏭️ **Frontend**: Set up React app
4. ⏭️ **Microsoft Graph**: Get token, implement scanning
5. ⏭️ **Core Logic**: File scanning, hashing, duplicate detection

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **SQL Editor Guide**: https://supabase.com/docs/guides/database/overview
- **API Keys**: https://supabase.com/docs/guides/api

---

## Security Note

⚠️ **Never commit your `.env` file to git!**

Make sure `.env` is in `.gitignore`:
```bash
# backend/.gitignore
.env
venv/
__pycache__/
*.pyc
```

You're all set! Once Supabase is configured, you can start building the scanning logic.

