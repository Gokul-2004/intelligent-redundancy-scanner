# Why Are We Using Supabase?

## What Supabase Does For Us

**Supabase = PostgreSQL Database (hosted in the cloud)**

That's it! We're basically just using it as a database to store our data.

---

## What Data Are We Storing?

### 1. **Files We Scan** (`files` table)
When we scan SharePoint/OneDrive, we store:
- File ID, name, path, size
- Content hash (SHA-256) - to find exact duplicates
- Extracted text - for near-duplicate detection
- Embeddings (vector) - for similarity search

**Why store this?**
- So we don't have to re-scan everything every time
- Can compare files across different scans
- Fast lookups for duplicate detection

### 2. **Duplicate Groups** (`duplicate_groups` table)
When we find duplicates, we store:
- Which files are duplicates
- Similarity scores
- Storage savings
- Approval status

**Why store this?**
- User can review and approve later
- Track what's been approved/rejected
- Calculate total storage savings

### 3. **Scan Jobs** (`scan_jobs` table)
Track scanning progress:
- How many files processed
- How many duplicates found
- Status (running/completed/failed)

**Why store this?**
- Show progress to user
- Resume if scan fails
- History of scans

### 4. **Audit Logs** (`audit_logs` table)
Record all actions:
- Who approved/rejected duplicates
- When files were deleted
- Why (reason)

**Why store this?**
- Compliance/legal requirements
- Accountability
- Undo capability

---

## Could We Use Something Else?

### Option 1: SQLite (Local File)
```python
# Just a file on disk
import sqlite3
conn = sqlite3.connect('database.db')
```
**Pros:**
- ✅ No setup needed
- ✅ Free
- ✅ Simple

**Cons:**
- ❌ Only works on one machine
- ❌ Can't access from web app easily
- ❌ No built-in backup

### Option 2: PostgreSQL (Self-hosted)
```python
# Your own PostgreSQL server
conn = psycopg2.connect("host=localhost dbname=scanner")
```
**Pros:**
- ✅ Full control
- ✅ No vendor lock-in

**Cons:**
- ❌ Need to set up server
- ❌ Need to manage backups
- ❌ More complex

### Option 3: Supabase (What We're Using)
```python
# Hosted PostgreSQL
supabase = create_client(url, key)
```
**Pros:**
- ✅ Free tier (500MB)
- ✅ No server setup
- ✅ Automatic backups
- ✅ Web dashboard
- ✅ Easy to use API
- ✅ Can access from anywhere

**Cons:**
- ❌ Vendor lock-in (but it's PostgreSQL, so easy to migrate)

---

## What Supabase Actually Does

### 1. **Hosts PostgreSQL Database**
- Stores all our tables
- Handles connections
- Manages storage

### 2. **Provides API**
- We can query database via Python
- No need to write raw SQL (though we can)
- Easy to use

### 3. **Web Dashboard**
- View data in browser
- Run SQL queries
- Monitor usage

### 4. **Automatic Features**
- Backups
- Connection pooling
- Security

---

## In Our Code

### Backend (Python)
```python
from app.database import get_supabase_client

supabase = get_supabase_client()

# Store a file we scanned
supabase.table("files").insert({
    "file_id": "abc123",
    "file_name": "report.docx",
    "content_hash": "sha256hash..."
}).execute()

# Find duplicates (same hash)
result = supabase.table("files").select("*").eq("content_hash", "sha256hash...").execute()
```

### What's Happening?
1. We scan a file from SharePoint
2. Calculate its hash
3. Store in Supabase
4. Query Supabase: "Do we have any files with this hash?"
5. If yes → duplicate found!

---

## Could We Skip Supabase?

**Technically yes, but...**

### Without Database:
- ❌ Have to re-scan everything every time
- ❌ Can't compare files across scans
- ❌ No way to track approvals
- ❌ No audit trail
- ❌ Can't show progress

### With Database (Supabase):
- ✅ Scan once, reuse data
- ✅ Fast duplicate detection (query by hash)
- ✅ Track approvals
- ✅ Full audit trail
- ✅ Show progress

---

## Real Example

### Scenario: User scans 1000 files

**Without Database:**
```
Scan → Hash all files → Compare in memory → Show results → Lose everything when app closes
Next scan: Start over from scratch
```

**With Supabase:**
```
First scan:
  - Scan 1000 files
  - Hash each file
  - Store in Supabase
  - Find duplicates
  - Store duplicate groups

Second scan (incremental):
  - Only scan NEW/changed files
  - Compare with existing files in Supabase
  - Much faster!
```

---

## Bottom Line

**Supabase = Just a database**

We're using it because:
1. **Easy setup** (no server management)
2. **Free tier** (enough for MVP)
3. **Simple API** (easy to use from Python)
4. **Web dashboard** (view data easily)

**We could replace it with:**
- SQLite (if single-user, local only)
- PostgreSQL (if you want to self-host)
- MongoDB (if you prefer NoSQL)
- Even JSON files (for very simple cases)

But Supabase is the easiest option for a web app!

---

## What We're NOT Using Supabase For

- ❌ Authentication (we removed that)
- ❌ File storage (we use Microsoft Graph API)
- ❌ Real-time features (not needed)
- ❌ Edge functions (not needed)

**Just the database!** That's it.

