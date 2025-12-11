# Simplified Architecture - No Auth (MVP)

## Simplified Flow

```
User → Web App → FastAPI Backend → Microsoft Graph API
                      ↓
                 Supabase DB
```

**No authentication layer** - User provides Microsoft token directly (or we use a simple API key approach)

---

## Architecture Changes

### Backend
- **No Supabase Auth** - Just use Supabase as database
- **Direct Microsoft Token** - User provides token via API or config
- **Simpler API** - No user sessions, no RLS needed

### Database
- **Remove user_id** from tables (or make it optional)
- **No RLS policies** needed
- **Single user** - All data belongs to one "scan"

### Frontend
- **No login page** - Just input Microsoft token
- **Simple UI** - Scan button, results display

---

## Implementation Approach

### Option A: User Provides Token (Recommended for MVP)
- User gets token from Microsoft (Graph Explorer or manual)
- User pastes token in UI
- Backend uses token for all Graph API calls
- Token stored in memory (session) or config

### Option B: Direct API Key (If you have one)
- Store Microsoft Client ID + Secret in backend
- Use Client Credentials flow
- No user interaction needed

---

## Simplified Database Schema

Remove user_id dependencies, simplify:

```sql
-- Files table (no user_id)
CREATE TABLE files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id TEXT NOT NULL UNIQUE,  -- Graph API file ID
    site_id TEXT,
    drive_id TEXT,
    file_path TEXT,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    content_hash TEXT,
    last_modified TIMESTAMP,
    text_content TEXT,
    embedding VECTOR(384),
    scan_timestamp TIMESTAMP DEFAULT NOW()
);

-- Duplicate groups (no user_id)
CREATE TABLE duplicate_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_type TEXT NOT NULL,
    primary_file_id UUID REFERENCES files(id),
    similarity_score REAL,
    storage_savings_bytes BIGINT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Remove RLS (not needed)
-- Remove user_profiles table
-- Remove scan_jobs (or simplify)
```

---

## API Endpoints (Simplified)

```python
# No auth needed
POST /api/scan/start
Body: { "microsoft_token": "..." }
Returns: { "job_id": "...", "status": "running" }

GET /api/scan/{job_id}/status
Returns: { "status": "...", "processed": 100, "total": 1000 }

GET /api/duplicates
Returns: List of duplicate groups

POST /api/duplicates/{group_id}/approve
Body: { "action": "delete" }
```

---

## Backend Changes

### Config (Simplified)
```python
# backend/app/config.py
class Settings(BaseSettings):
    # Supabase (just database)
    supabase_url: str
    supabase_service_key: str  # Use service key, no RLS
    
    # Microsoft Graph (optional, if using client credentials)
    azure_client_id: Optional[str] = None
    azure_client_secret: Optional[str] = None
    
    # No auth settings needed
```

### API Routes (No Auth Middleware)
```python
# backend/app/api/routes/scan.py
from fastapi import APIRouter, Body

router = APIRouter()

@router.post("/start")
async def start_scan(microsoft_token: str = Body(...)):
    # Use token directly
    # Start scan
    pass
```

---

## Frontend Changes

### Simple Token Input
```jsx
// No auth UI, just token input
function App() {
  const [token, setToken] = useState('');
  const [scanning, setScanning] = useState(false);
  
  const startScan = async () => {
    const response = await fetch('/api/scan/start', {
      method: 'POST',
      body: JSON.stringify({ microsoft_token: token })
    });
    // Handle scan
  };
  
  return (
    <div>
      <input 
        type="text" 
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Microsoft Graph Token"
      />
      <button onClick={startScan}>Start Scan</button>
    </div>
  );
}
```

---

## Getting Microsoft Token (For User)

### Method 1: Graph Explorer
1. Go to https://developer.microsoft.com/en-us/graph/graph-explorer
2. Sign in
3. Click "Access token" 
4. Copy token
5. Paste in app

### Method 2: Manual OAuth (Simple)
- User clicks "Get Token" button
- Redirects to Microsoft login
- Returns token
- Store in frontend state

### Method 3: Client Credentials (If you have admin)
- Backend uses Client ID + Secret
- Gets token automatically
- No user interaction

---

## Benefits of No Auth (MVP)

✅ **Faster to build** - Skip complex auth flows
✅ **Easier testing** - Just need a token
✅ **Focus on core** - Duplicate detection logic
✅ **Can add auth later** - Easy to add Supabase Auth later

---

## Migration Path (Later)

When ready to add auth:
1. Add Supabase Auth back
2. Add user_id to tables
3. Add RLS policies
4. Update API to use user sessions
5. Frontend: Add login page

But for MVP, skip all of this!

