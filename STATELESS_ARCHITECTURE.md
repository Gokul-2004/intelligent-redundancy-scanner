# Stateless Architecture - No Database Needed!

## New Approach

**User provides token → Scan → Show results → User approves → Done**

No persistence needed! Everything happens in memory, results shown immediately.

---

## How It Works

### Flow:
1. User opens website
2. User pastes Microsoft Graph API token
3. User clicks "Scan"
4. Backend scans files in real-time
5. Backend finds duplicates (in memory)
6. Results shown to user immediately
7. User reviews and approves deletions
8. Backend executes deletions via Graph API
9. User closes browser → Everything gone (no storage)

---

## What We DON'T Need

- ❌ **Supabase** (no database)
- ❌ **File storage** (scan on-demand)
- ❌ **User accounts** (stateless)
- ❌ **History** (one-time use)
- ❌ **Incremental scans** (always full scan)

---

## What We DO Need

- ✅ **Microsoft Graph API** (to scan files)
- ✅ **In-memory processing** (hash files, find duplicates)
- ✅ **Real-time results** (show as we find them)
- ✅ **Approval interface** (user reviews before delete)

---

## Architecture

```
User Browser → React Frontend
                    ↓
              FastAPI Backend
                    ↓
         Microsoft Graph API (scan files)
                    ↓
         In-Memory Processing:
         - Hash files
         - Find duplicates
         - Generate embeddings (Sentence-BERT)
         - Calculate similarity
                    ↓
         Return Results to Frontend
                    ↓
         User Approves → Delete via Graph API
```

**No database layer!**

---

## Implementation Changes

### Backend (Simplified)

```python
# No database imports needed!
# No Supabase client
# Just process and return

@router.post("/scan")
async def scan_files(microsoft_token: str):
    # 1. Get files from Graph API
    files = await get_files_from_graph(microsoft_token)
    
    # 2. Process in memory
    duplicates = find_duplicates(files)  # Hash + ML
    
    # 3. Return results immediately
    return {
        "duplicates": duplicates,
        "total_files": len(files),
        "storage_savings": calculate_savings(duplicates)
    }
```

### Frontend (Simplified)

```jsx
// No database, just show results
function App() {
  const [results, setResults] = useState(null);
  
  const scan = async (token) => {
    const response = await fetch('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    setResults(await response.json());
  };
  
  return <DuplicateList duplicates={results} />;
}
```

---

## Benefits

✅ **Much simpler** - No database setup
✅ **Faster to build** - Less code
✅ **Privacy-friendly** - Nothing stored
✅ **No costs** - No database hosting
✅ **One-time use** - Perfect for occasional scans

---

## Trade-offs

❌ **No history** - Can't see previous scans
❌ **Always full scan** - Can't do incremental
❌ **No progress persistence** - If browser closes, restart
❌ **Limited scale** - All in memory (fine for thousands of files)

**But for MVP, this is perfect!**

---

## Data Flow

### 1. Scan Request
```json
POST /api/scan
{
  "microsoft_token": "eyJ0eXAi..."
}
```

### 2. Processing (Backend)
```python
# Get all files
files = graph_api.list_files(token)

# Hash each file (in memory)
file_hashes = {}
for file in files:
    hash = compute_sha256(file.content)
    file_hashes[file.id] = hash

# Find exact duplicates
exact_duplicates = find_same_hash(file_hashes)

# Find near-duplicates (ML)
near_duplicates = find_similar_files(files)  # Sentence-BERT

# Return everything
return {
    "exact_duplicates": exact_duplicates,
    "near_duplicates": near_duplicates
}
```

### 3. Results (Frontend)
```json
{
  "exact_duplicates": [
    {
      "group_id": "abc123",
      "files": [
        {"id": "file1", "name": "report.docx", "size": 1024},
        {"id": "file2", "name": "report-copy.docx", "size": 1024}
      ],
      "storage_savings": 1024
    }
  ],
  "near_duplicates": [...],
  "total_files": 1000,
  "total_duplicates": 50
}
```

### 4. Approval
```json
POST /api/approve
{
  "group_id": "abc123",
  "action": "delete",
  "file_ids": ["file2"]  // Delete file2, keep file1
}
```

### 5. Execute Deletion
```python
# Backend deletes via Graph API
for file_id in file_ids:
    graph_api.delete_file(token, file_id)
```

---

## Updated Project Structure

```
TOOL/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI (no DB)
│   │   ├── scanner/
│   │   │   ├── graph_client.py    # Graph API
│   │   │   ├── hasher.py          # SHA-256
│   │   │   └── duplicate_finder.py # Find duplicates
│   │   └── ml/
│   │       ├── embeddings.py      # Sentence-BERT
│   │       └── similarity.py      # Similarity calc
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx           # Simple UI
    │   └── services/
    │       └── api.js        # API calls
    └── package.json
```

**No database folder!**

---

## Implementation Steps

1. **Remove Supabase** - Delete all DB code
2. **Graph API Client** - Get files from SharePoint
3. **In-Memory Processing** - Hash files, find duplicates
4. **Return Results** - Send to frontend immediately
5. **Approval UI** - Show duplicates, get approval
6. **Execute Deletion** - Delete via Graph API

---

## Performance Considerations

### For Thousands of Files:

**Memory Usage:**
- File metadata: ~1KB per file = 1MB for 1000 files ✅
- Hashes: 64 bytes each = 64KB for 1000 files ✅
- Embeddings: 1.5KB each = 1.5MB for 1000 files ✅
- **Total: ~3MB for 1000 files** ✅ Totally fine!

**Processing Time:**
- Graph API calls: ~5-10 minutes for 1000 files
- Hashing: ~1-2 minutes
- ML embeddings: ~5-10 minutes
- **Total: ~15-20 minutes** ✅ Acceptable for one-time scan

---

## Code Example

### Backend Endpoint
```python
from fastapi import APIRouter, Body
from app.scanner.graph_client import GraphClient
from app.scanner.hasher import compute_hash
from app.scanner.duplicate_finder import find_duplicates

router = APIRouter()

@router.post("/scan")
async def scan(microsoft_token: str = Body(...)):
    # Initialize Graph client
    graph = GraphClient(microsoft_token)
    
    # Get all files
    files = await graph.list_all_files()
    
    # Process in memory
    results = find_duplicates(files)
    
    # Return immediately
    return {
        "status": "completed",
        "total_files": len(files),
        "duplicates": results
    }
```

### Frontend
```jsx
const [scanning, setScanning] = useState(false);
const [results, setResults] = useState(null);

const handleScan = async () => {
  setScanning(true);
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({microsoft_token: token})
  });
  const data = await res.json();
  setResults(data);
  setScanning(false);
};

return (
  <div>
    {scanning && <p>Scanning files...</p>}
    {results && <DuplicateList duplicates={results.duplicates} />}
  </div>
);
```

---

## This is Much Simpler!

**Before (with database):**
- Set up Supabase
- Create tables
- Manage migrations
- Handle persistence
- Track users
- Complex!

**Now (stateless):**
- User provides token
- Scan → Process → Show → Approve → Delete
- Done!

**Perfect for MVP!** 🎉

