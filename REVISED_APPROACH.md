# Revised Architecture - Single User, Free ML Model

## Key Constraints
- **Single SharePoint account** (one user, not tenant-wide)
- **Thousands of files** (manageable scale)
- **Mostly small docs** (good for processing)
- **End users run scans** (delegated permissions, user signs in)
- **No budget for OpenAI** (must use free/local ML models)

---

## Major Architecture Changes

### 1. Authentication Model - Delegated Permissions (Not Application)

**Old Approach**: Service Principal with Application Permissions (tenant-wide)
**New Approach**: User signs in with Delegated Permissions (their own files only)

#### Authentication Flow
```
1. User opens app (web or desktop)
2. User signs in with Microsoft account (OAuth 2.0)
3. App requests delegated permissions:
   - Files.Read (read user's files)
   - Sites.Read.All (read SharePoint sites user has access to)
   - User.Read (read user profile)
4. User grants consent (one-time)
5. App uses user's token to access their files
```

#### Key Differences
- **No admin consent needed** (user grants their own permissions)
- **User must be signed in** (can't run automated scans)
- **Only sees files user has access to** (security boundary)
- **Simpler setup** (no Azure AD app registration complexity)

#### Implementation
```python
# Using MSAL with delegated permissions
from msal import PublicClientApplication

app = PublicClientApplication(
    client_id="your-client-id",
    authority="https://login.microsoftonline.com/common"
)

# Interactive login (user signs in)
result = app.acquire_token_interactive(scopes=[
    "Files.Read",
    "Sites.Read.All",
    "User.Read"
])

access_token = result['access_token']
```

---

### 2. ML Model - Free/Local Only

**Must Use**: Sentence-BERT (free, runs locally, no API costs)

#### Model Choice: `all-MiniLM-L6-v2`
- **Size**: ~80MB download
- **Quality**: Good (slightly lower than OpenAI, but free)
- **Speed**: Fast (runs on CPU, GPU optional)
- **Privacy**: All processing local, no data leaves machine
- **Cost**: $0 (one-time download)

#### Implementation
```python
from sentence_transformers import SentenceTransformer

# Download model once (first run)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings
text = "Document content here..."
embedding = model.encode(text)

# Compare documents
similarity = cosine_similarity(embedding1, embedding2)
```

#### Performance Considerations
- **Model Loading**: Takes ~2-3 seconds on first load (cache after)
- **Embedding Speed**: ~100-200 docs/second on CPU
- **Memory**: ~500MB RAM for model
- **For thousands of files**: Totally fine, will take minutes not hours

---

### 3. Simplified Architecture (Single User)

```
┌─────────────────────────────────────┐
│      User's Browser/Desktop        │
│         (Signs in with OAuth)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Python App (Local or Web)     │
│  - FastAPI backend (if web)        │
│  - Or desktop app (Electron/Tkinter)│
└──────┬──────────────┬───────────────┘
       │              │
┌──────▼──────┐  ┌───▼────────────┐
│  Scanner    │  │  ML Service    │
│  (Graph API)│  │  (Sentence-BERT)│
└──────┬──────┘  └───┬────────────┘
       │             │
       └──────┬───────┘
              │
    ┌─────────▼──────────┐
    │  SQLite Database   │
    │  (Local file)      │
    └────────────────────┘
              │
    ┌─────────▼──────────┐
    │  Microsoft Graph   │
    │  (User's files)    │
    └────────────────────┘
```

**Key Simplifications**:
- **SQLite instead of PostgreSQL** (single user, no need for server DB)
- **Local database file** (stored on user's machine)
- **No Redis needed** (thousands of files, simple caching is fine)
- **Can be desktop app** (Electron + Python, or pure Python with Tkinter)

---

### 4. Near-Duplicate Detection - Free Model Strategy

#### Approach: Filename-First, Then Content

Since we're using free models, we can be smarter about when to use expensive operations:

**Step 1: Quick Filename Filter**
```python
# Fast, no ML needed
- Group files by similar names (Levenshtein distance)
- If filename similarity > 0.8, likely duplicate
- Skip ML for obviously different files
```

**Step 2: Content Analysis (Only for Similar Names)**
```python
# Only run ML on files with similar names
- Extract text from documents
- Generate embeddings (Sentence-BERT)
- Calculate similarity
- Combine with filename similarity
```

**Step 3: Metadata Check**
```python
# Final validation
- Check file sizes (within 20% = potential duplicate)
- Check dates (created/modified close together)
- Check authors (same author = more likely duplicate)
```

#### Optimized Scoring
```
If filename_similarity > 0.8:
    # High confidence from filename alone
    final_score = filename_similarity * 0.7 + content_similarity * 0.3
Else:
    # Need strong content match
    final_score = filename_similarity * 0.3 + content_similarity * 0.7

Threshold: > 0.85 = Near-duplicate
```

**Why This Works**:
- Most duplicates have similar names ("Report v1", "Report Final")
- Filename comparison is instant (no ML)
- Only run expensive ML on files that might be duplicates
- Reduces ML processing by 80-90%

---

### 5. Database - SQLite (Perfect for Single User)

**Why SQLite**:
- ✅ No server setup needed
- ✅ Single file database (easy backup)
- ✅ Handles thousands of files easily
- ✅ Zero configuration
- ✅ Can migrate to PostgreSQL later if needed

**Schema** (simplified):
```sql
-- Files table
CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    file_id TEXT UNIQUE,  -- Graph API ID
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    content_hash TEXT,  -- SHA-256
    last_modified TEXT,
    owner_email TEXT,
    scan_timestamp TEXT,
    text_content TEXT,  -- Extracted text (for embeddings)
    embedding BLOB,     -- Serialized embedding (optional cache)
    INDEX idx_hash (content_hash),
    INDEX idx_name (file_name)
);

-- Duplicate groups
CREATE TABLE duplicate_groups (
    id INTEGER PRIMARY KEY,
    group_type TEXT,  -- 'exact' or 'near'
    primary_file_id INTEGER,
    similarity_score REAL,
    storage_savings INTEGER,
    status TEXT,  -- 'pending', 'approved', 'rejected'
    created_at TEXT
);

-- Group members
CREATE TABLE duplicate_group_members (
    group_id INTEGER,
    file_id INTEGER,
    is_primary INTEGER,  -- 0 or 1
    similarity_score REAL,
    PRIMARY KEY (group_id, file_id)
);

-- Audit log
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    action_type TEXT,
    user_email TEXT,
    group_id INTEGER,
    file_ids TEXT,  -- JSON array
    timestamp TEXT,
    reason TEXT,
    storage_saved INTEGER
);
```

---

### 6. User Experience - Desktop App or Simple Web App

#### Option A: Desktop App (Recommended for MVP)
**Tech Stack**: 
- Python backend (FastAPI or Flask)
- Electron frontend (or Tkinter for pure Python)
- SQLite database

**Pros**:
- ✅ No server needed
- ✅ Database stays local (privacy)
- ✅ Can run offline (after initial scan)
- ✅ Simpler deployment

**User Flow**:
1. User downloads app
2. User signs in with Microsoft account
3. App scans their SharePoint/OneDrive
4. Shows duplicate report
5. User approves/rejects
6. App executes actions

#### Option B: Simple Web App
**Tech Stack**:
- Python FastAPI backend
- Simple HTML/JS frontend (no React needed for MVP)
- SQLite database (on server)

**Pros**:
- ✅ Accessible from anywhere
- ✅ Easier to update
- ✅ Can add features later

**Cons**:
- ❌ Needs server/hosting
- ❌ Database on server (privacy consideration)

---

### 7. Performance Optimizations (For Thousands of Files)

#### Scanning Strategy
```python
# Incremental scanning
1. First scan: Hash all files, store in DB
2. Subsequent scans:
   - Check last_modified date
   - Only re-hash changed files
   - Much faster!

# Parallel processing
- Use asyncio for concurrent API calls
- Process 5-10 files at a time (respect rate limits)
- Hash files in parallel (CPU-bound, use multiprocessing)
```

#### ML Optimization
```python
# Batch embeddings
- Process multiple documents at once
- Sentence-BERT handles batches efficiently
- ~100-200 docs/second

# Cache embeddings
- Store embeddings in database
- Only regenerate if file changed
- Saves significant time on re-scans
```

#### Expected Performance
- **Initial scan (1000 files)**: 10-20 minutes
  - API calls: ~5 minutes
  - Hashing: ~3 minutes
  - ML embeddings: ~5-10 minutes
- **Incremental scan**: 1-2 minutes (only changed files)

---

### 8. Cost Breakdown (All Free!)

| Component | Cost | Notes |
|-----------|------|-------|
| Microsoft Graph API | $0 | Free for personal/org use |
| Sentence-BERT | $0 | Open source, runs locally |
| SQLite | $0 | Built into Python |
| Python libraries | $0 | All open source |
| Hosting (if web) | $0-5/mo | Can use free tier (Heroku, Railway, etc.) |
| **Total** | **$0-5/mo** | Only cost is optional hosting |

---

### 9. Implementation Priority (Revised)

#### MVP (Week 1-2)
1. ✅ User authentication (MSAL delegated permissions)
2. ✅ List files from SharePoint/OneDrive
3. ✅ Content hashing (SHA-256)
4. ✅ Exact duplicate detection
5. ✅ Simple report (CSV/JSON)

#### Phase 2 (Week 3-4)
6. ✅ Text extraction (Office docs, PDFs)
7. ✅ Sentence-BERT integration
8. ✅ Filename similarity
9. ✅ Near-duplicate detection
10. ✅ Basic UI (desktop or simple web)

#### Phase 3 (Week 5-6)
11. ✅ Approval workflow
12. ✅ Audit logging
13. ✅ Storage savings calculation
14. ✅ Execute delete/archive actions

#### Phase 4 (Future)
15. Incremental scanning
16. Better UI/UX
17. Email notifications
18. Advanced reporting

---

### 10. Key Technical Decisions (Revised)

#### Authentication
- **MSAL PublicClientApplication** (for desktop) or **ConfidentialClientApplication** (for web)
- **Delegated Permissions**: `Files.Read`, `Sites.Read.All`, `User.Read`
- **No admin consent needed** (user grants their own permissions)

#### ML Model
- **Sentence-BERT `all-MiniLM-L6-v2`** (free, local)
- **Download on first run** (~80MB)
- **Cache model in memory** (reuse across requests)

#### Database
- **SQLite** (perfect for single user)
- **Single file** (easy backup, portable)
- **Can upgrade to PostgreSQL later** if needed

#### Deployment
- **Desktop app** (Electron + Python, or pure Python)
- **Or simple web app** (FastAPI + HTML/JS)
- **SQLite database** (local file or server file)

---

### 11. Code Structure (Simplified)

```
TOOL/
├── app.py                    # Main application
├── auth.py                   # MSAL authentication
├── scanner.py                # File scanning
├── hasher.py                 # Content hashing
├── ml_service.py             # Sentence-BERT embeddings
├── duplicate_detector.py     # Duplicate detection logic
├── database.py               # SQLite operations
├── workflow.py               # Approval workflow
├── ui/                       # Frontend (if web app)
│   ├── index.html
│   └── app.js
├── database.db               # SQLite database (created on first run)
└── requirements.txt
```

**Much simpler than original plan!**

---

## Next Steps

1. **Set up Azure AD app** (simpler - just need client ID, no admin consent)
2. **Test authentication** (user sign-in flow)
3. **Build basic scanner** (list files, get metadata)
4. **Implement hashing** (exact duplicates)
5. **Add Sentence-BERT** (near-duplicates)
6. **Build simple UI** (desktop or web)

Want to start with authentication setup, or discuss any of these changes?

