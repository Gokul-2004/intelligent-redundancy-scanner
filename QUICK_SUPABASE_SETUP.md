# Quick Supabase Setup (5 Minutes)

## TL;DR - Just Do This:

1. **Create Supabase account** → https://supabase.com
2. **Create new project** → Name it, set password, wait 2 min
3. **Get credentials** → Settings → API → Copy URL + service_role key
4. **Run SQL** → SQL Editor → Paste migration → Run
5. **Set backend .env** → Add Supabase URL + service_role key

---

## Detailed Steps

### 1. Create Project (2 min)
- Go to https://supabase.com
- Sign up/Sign in
- Click "New Project"
- Name: `redundancy-scanner`
- Password: (save it!)
- Region: (closest to you)
- Click "Create" → Wait 2-3 minutes

### 2. Get Credentials (1 min)
- Click ⚙️ Settings → API
- Copy **Project URL**: `https://xxxxx.supabase.co`
- Copy **service_role** key (click "Reveal")
- Save these!

### 3. Run Migration (1 min)
- Click "SQL Editor" in sidebar
- Click "New query"
- Open `supabase/migrations/002_simplified_no_auth.sql`
- Copy ALL code
- Paste in SQL Editor
- Click "Run" (or Ctrl+Enter)
- ✅ Should see "Success"

### 4. Verify Tables (30 sec)
- Click "Database" → "Tables"
- Should see: `files`, `duplicate_groups`, `duplicate_group_members`, `audit_logs`, `scan_jobs`

### 5. Backend Config (1 min)
```bash
cd backend
cp .env.example .env
# Edit .env and add:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_SERVICE_KEY=your-service-role-key
```

---

## That's It! ✅

You're done. Next: Set up backend and start coding the scanner.

---

## Troubleshooting

**"Extension vector does not exist"**
- Go to Database → Extensions
- Enable "vector" extension
- Or Supabase might auto-enable it

**"Permission denied"**
- Make sure you're using `service_role` key (not `anon` key)

**Tables not showing**
- Refresh the page
- Check SQL Editor for errors

