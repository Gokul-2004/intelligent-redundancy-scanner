# Web App Architecture with Supabase

## Tech Stack
- **Frontend**: Web app (React/Vue or simple HTML/JS)
- **Backend**: Python FastAPI (or Supabase Edge Functions)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Microsoft OAuth (or MSAL)
- **File Source**: Microsoft Graph API

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│      User's Browser (Web App)      │
│    React/Vue or HTML/JS Frontend   │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│      FastAPI Backend (Python)      │
│  - Graph API integration           │
│  - File scanning & hashing         │
│  - ML processing (Sentence-BERT)   │
│  - Business logic                  │
└──────┬──────────────┬───────────────┘
       │              │
┌──────▼──────┐  ┌───▼────────────┐
│  Supabase   │  │  Microsoft     │
│  PostgreSQL │  │  Graph API     │
│  Database   │  │                │
└─────────────┘  └────────────────┘
```

---

## Why Supabase?

### Advantages
- ✅ **Free tier** (500MB database, 2GB bandwidth)
- ✅ **PostgreSQL** (robust, scalable)
- ✅ **Built-in auth** (can integrate with Microsoft OAuth)
- ✅ **Real-time** (optional, for live updates)
- ✅ **Storage** (can store embeddings/cache if needed)
- ✅ **API auto-generated** (REST API from database schema)
- ✅ **Easy deployment** (hosted, no server management)

### Free Tier Limits
- 500MB database (plenty for thousands of files)
- 2GB bandwidth/month
- 50,000 monthly active users
- 2GB file storage

**For your use case**: Free tier should be sufficient!

---

## Authentication Strategy

### Option A: Supabase Auth + Microsoft OAuth (Recommended)
**Flow**:
1. User clicks "Sign in with Microsoft"
2. Redirects to Microsoft OAuth
3. User grants permissions
4. Supabase handles token exchange
5. User authenticated in Supabase
6. Backend uses Supabase session to get Microsoft token

**Pros**:
- ✅ Supabase handles session management
- ✅ Can use Supabase RLS (Row Level Security)
- ✅ Simpler auth flow

### Option B: MSAL in Frontend + Supabase Anon Key
**Flow**:
1. Frontend uses MSAL to get Microsoft token
2. Frontend sends token to backend
3. Backend validates token, creates Supabase session
4. Backend stores Microsoft token securely

**Pros**:
- ✅ More control over Microsoft auth
- ✅ Can use Microsoft token directly

**Recommendation**: Option A (simpler, Supabase handles more)

---

## Database Schema (Supabase/PostgreSQL)

### Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    microsoft_token TEXT,  -- Encrypted Microsoft access token
    microsoft_refresh_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    file_id TEXT NOT NULL,  -- Graph API file ID
    site_id TEXT,
    drive_id TEXT,
    file_path TEXT,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    content_hash TEXT,  -- SHA-256
    last_modified TIMESTAMP,
    owner_email TEXT,
    text_content TEXT,  -- Extracted text
    embedding VECTOR(384),  -- Sentence-BERT embedding (384 dimensions)
    scan_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, file_id),
    INDEX idx_user_hash (user_id, content_hash),
    INDEX idx_user_name (user_id, file_name)
);

-- Duplicate groups
CREATE TABLE duplicate_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    group_type TEXT NOT NULL,  -- 'exact' or 'near'
    primary_file_id UUID REFERENCES files(id),
    similarity_score REAL,
    storage_savings_bytes BIGINT,
    status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Group members (many-to-many)
CREATE TABLE duplicate_group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES duplicate_groups(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    similarity_score REAL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, file_id)
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL,  -- 'approve', 'reject', 'delete', 'archive'
    group_id UUID REFERENCES duplicate_groups(id),
    file_ids UUID[],  -- Array of affected file IDs
    timestamp TIMESTAMP DEFAULT NOW(),
    reason TEXT,
    storage_saved_bytes BIGINT
);

-- Scan jobs (track scanning progress)
CREATE TABLE scan_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'running',  -- 'running', 'completed', 'failed'
    total_files INTEGER,
    processed_files INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own files"
    ON files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own duplicate groups"
    ON duplicate_groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own duplicate groups"
    ON duplicate_groups FOR UPDATE
    USING (auth.uid() = user_id);
```

### Vector Extension (for embeddings)

```sql
-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- This allows efficient similarity search on embeddings
-- Example query:
-- SELECT * FROM files 
-- WHERE user_id = $1 
-- ORDER BY embedding <=> $2 
-- LIMIT 10;
```

---

## Project Structure

```
TOOL/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScanProgress.jsx
│   │   │   ├── DuplicateList.jsx
│   │   │   └── ApprovalModal.jsx
│   │   ├── services/
│   │   │   ├── supabase.js      # Supabase client
│   │   │   └── api.js           # Backend API calls
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── vite.config.js           # or webpack, etc.
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Config (Supabase URL, keys)
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── msal_auth.py     # Microsoft Graph auth
│   │   │   └── supabase_auth.py # Supabase auth integration
│   │   ├── scanner/
│   │   │   ├── __init__.py
│   │   │   ├── graph_client.py  # Graph API client
│   │   │   ├── file_scanner.py  # Scan orchestration
│   │   │   └── content_hash.py  # SHA-256 hashing
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── text_extractor.py
│   │   │   ├── embeddings.py   # Sentence-BERT
│   │   │   └── similarity.py   # Similarity calculation
│   │   ├── duplicate_detection/
│   │   │   ├── __init__.py
│   │   │   ├── exact_duplicates.py
│   │   │   └── near_duplicates.py
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── supabase_client.py
│   │   │   └── models.py        # SQLAlchemy models (optional)
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── routes/
│   │       │   ├── auth.py
│   │       │   ├── scan.py
│   │       │   ├── duplicates.py
│   │       │   └── approvals.py
│   │       └── dependencies.py  # Auth dependencies
│   ├── requirements.txt
│   └── .env.example
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
└── README.md
```

---

## Backend API Endpoints (FastAPI)

### Authentication
```python
POST /api/auth/microsoft
# Exchange Microsoft token for Supabase session

GET /api/auth/me
# Get current user info
```

### Scanning
```python
POST /api/scan/start
# Start a new scan job
# Returns: { job_id, status }

GET /api/scan/{job_id}/status
# Get scan progress
# Returns: { status, processed_files, total_files, duplicates_found }

GET /api/scan/{job_id}/results
# Get scan results (duplicates found)
```

### Duplicates
```python
GET /api/duplicates
# Get all duplicate groups for user
# Query params: ?status=pending&type=exact

GET /api/duplicates/{group_id}
# Get details of a duplicate group

POST /api/duplicates/{group_id}/approve
# Approve deletion of duplicates
# Body: { action: "delete" | "archive", reason?: string }

POST /api/duplicates/{group_id}/reject
# Mark as not duplicates
```

### Metrics
```python
GET /api/metrics
# Get storage savings, ROI metrics
```

---

## Frontend Flow

### 1. Login Page
```jsx
// User clicks "Sign in with Microsoft"
// Redirects to Microsoft OAuth
// After auth, redirects back with token
// Backend exchanges token for Supabase session
// User is logged in
```

### 2. Dashboard
```jsx
// Shows:
// - Scan button
// - Previous scan results
// - Storage savings
// - Pending approvals
```

### 3. Scan Progress
```jsx
// When scan starts:
// - Show progress bar
// - Poll /api/scan/{job_id}/status
// - Update in real-time
// - Show duplicates found count
```

### 4. Duplicate List
```jsx
// List all duplicate groups
// Filter by: status, type (exact/near)
// Show: file names, similarity scores, storage savings
// Click to see details
```

### 5. Approval Modal
```jsx
// Show duplicate group details
// - Primary file (recommended keeper)
// - Duplicate files
// - Side-by-side preview (optional)
// - Actions: Approve Delete, Archive, Reject
```

---

## Implementation Steps

### Step 1: Set Up Supabase
1. Create account at supabase.com
2. Create new project
3. Get project URL and anon key
4. Run migrations (create tables)

### Step 2: Set Up Azure AD App
1. Register app in Azure Portal
2. Add redirect URI: `https://your-app.com/auth/callback`
3. Get Client ID and Client Secret
4. Request permissions: `Files.Read`, `Sites.Read.All`

### Step 3: Backend Setup
1. Create FastAPI app
2. Set up Supabase client
3. Set up MSAL authentication
4. Create database models/queries

### Step 4: Frontend Setup
1. Create React/Vue app
2. Set up Supabase client
3. Implement Microsoft OAuth flow
4. Create UI components

### Step 5: Core Features
1. File scanning (Graph API)
2. Content hashing
3. Exact duplicate detection
4. ML embeddings (Sentence-BERT)
5. Near-duplicate detection
6. Approval workflow

---

## Environment Variables

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key  # For backend operations
SUPABASE_ANON_KEY=your-anon-key        # For RLS

# Microsoft Graph
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_REDIRECT_URI=https://your-app.com/auth/callback

# App
APP_URL=https://your-app.com
SECRET_KEY=your-secret-key  # For JWT signing
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AZURE_CLIENT_ID=your-client-id
VITE_APP_URL=https://your-app.com
```

---

## Key Implementation Details

### 1. Microsoft Token Storage
**Option A**: Store encrypted in Supabase `user_profiles` table
**Option B**: Store in backend session (Redis/memory)
**Option C**: Refresh token flow (get new token when needed)

**Recommendation**: Option A (encrypted in database, refresh when expired)

### 2. Scanning Process
```python
# Backend endpoint
async def start_scan(user_id: str):
    # 1. Create scan job in Supabase
    job_id = create_scan_job(user_id)
    
    # 2. Get user's Microsoft token
    token = get_microsoft_token(user_id)
    
    # 3. Start async scan task
    asyncio.create_task(scan_files(user_id, token, job_id))
    
    # 4. Return job_id immediately
    return {"job_id": job_id}

# Background task
async def scan_files(user_id, token, job_id):
    # Scan files, hash, detect duplicates
    # Update scan_job progress in Supabase
    # Frontend polls for updates
```

### 3. Real-time Updates (Optional)
```python
# Use Supabase real-time subscriptions
# Frontend subscribes to scan_jobs table
# Updates automatically when status changes
```

### 4. Embedding Storage
- **Store in database**: `embedding VECTOR(384)` column
- **Or**: Store in Supabase Storage (if too large)
- **Or**: Regenerate on-demand (slower but saves space)

**Recommendation**: Store in database (384 floats = ~1.5KB per file, manageable)

---

## Deployment

### Backend
- **Railway**: Easy Python deployment
- **Render**: Free tier available
- **Fly.io**: Good for Python apps
- **Heroku**: Classic choice

### Frontend
- **Vercel**: Free, great for React/Vue
- **Netlify**: Free tier
- **Supabase Hosting**: (if available)

### Database
- **Supabase**: Already hosted!

---

## Cost Estimate

| Service | Cost |
|---------|------|
| Supabase | $0 (free tier) |
| Backend hosting | $0-7/mo (free tier) |
| Frontend hosting | $0 (Vercel/Netlify free) |
| Microsoft Graph API | $0 (free) |
| Sentence-BERT | $0 (local) |
| **Total** | **$0-7/month** |

---

## Next Steps

1. **Create Supabase project** and run migrations
2. **Set up Azure AD app** with redirect URI
3. **Create FastAPI backend** with Supabase client
4. **Create frontend** (React/Vue) with Supabase client
5. **Implement auth flow** (Microsoft OAuth → Supabase session)
6. **Build scanning endpoint** (Graph API integration)
7. **Add duplicate detection** (hashing + ML)

Want me to start with any specific part? I can create:
- Supabase migration SQL
- FastAPI backend structure
- Frontend setup
- Auth integration code

