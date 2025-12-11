# Quick Start Guide - Decision Points & First Steps

## Critical Decisions to Make First

### 1. Authentication & Permissions Model
**Question**: Who will run scans?
- **Option A**: Tenant-wide admin scan (requires Application Permissions)
- **Option B**: Per-user delegated scans (requires Delegated Permissions)
- **Recommendation**: Start with Option A for proof of concept, add Option B later

**Action**: Register Azure AD app and request admin consent

---

### 2. ML Model Choice
**Question**: Which embedding model to use?
- **Option A**: OpenAI API (`text-embedding-3-small`)
  - ✅ Best quality, easiest to implement
  - ❌ Costs money (~$0.02 per 1M tokens)
  - ❌ Data sent to external service
- **Option B**: Local Sentence-BERT (`all-MiniLM-L6-v2`)
  - ✅ Free, runs locally, privacy-friendly
  - ✅ Good quality (slightly lower than OpenAI)
  - ❌ Requires more setup, model download (~80MB)
- **Option C**: Hybrid (OpenAI for high-value, local for bulk)
  - ✅ Best of both worlds
  - ❌ More complex implementation

**Recommendation**: Start with Option A (OpenAI) for MVP, migrate to Option B for scale

---

### 3. Database Choice
**Question**: Which database?
- **PostgreSQL**: Robust, JSON support, good for complex queries
- **SQLite**: Simple, no setup, good for MVP/testing
- **Azure SQL**: If fully Azure-native

**Recommendation**: Start with SQLite for MVP, migrate to PostgreSQL for production

---

### 4. Deployment Model
**Question**: Where will this run?
- **On-Premises**: Docker containers, full control
- **Azure**: Native integration, App Service/Container Instances
- **AWS**: If not Microsoft-focused
- **Hybrid**: Scanner on-prem, dashboard in cloud

**Recommendation**: Start local/Docker for development, decide on production later

---

## Step-by-Step: Building the MVP

### Step 1: Set Up Azure AD App (Day 1)
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Create new registration
3. Add API permissions:
   - `Sites.Read.All` (Application)
   - `Files.Read.All` (Application)
   - `User.Read.All` (Application)
4. Request admin consent
5. Create client secret
6. Save: Tenant ID, Client ID, Client Secret

**Deliverable**: Working authentication to Graph API

---

### Step 2: Build Basic Scanner (Days 2-3)
**Goal**: Scan one SharePoint site, list all files with metadata

**Files to Create**:
- `src/auth/msal_auth.py` - Get access token
- `src/scanner/graph_client.py` - Graph API wrapper
- `src/scanner/file_scanner.py` - Scan orchestration
- Simple script to test: `scripts/test_scan.py`

**Test**: Can you list files from a test SharePoint site?

---

### Step 3: Implement Content Hashing (Days 4-5)
**Goal**: Download files, compute SHA-256 hashes, find exact duplicates

**Files to Create**:
- `src/scanner/content_hash.py` - Hash computation
- `src/database/models.py` - File model (SQLAlchemy)
- `src/database/repository.py` - Database operations
- Update `file_scanner.py` to hash files

**Test**: Scan 100 files, identify duplicates by hash

---

### Step 4: Set Up Database (Day 6)
**Goal**: Store file metadata and hashes

**Files to Create**:
- Database schema (use Alembic migrations)
- Repository layer for CRUD operations
- Test data insertion and queries

**Test**: Can you query for duplicate hashes?

---

### Step 5: Text Extraction (Days 7-8)
**Goal**: Extract text from Office documents and PDFs

**Files to Create**:
- `src/ml/text_extractor.py` - Extract text from various formats
- Handle: .docx, .xlsx, .pptx, .pdf

**Test**: Extract text from sample documents

---

### Step 6: Embedding Generation (Days 9-10)
**Goal**: Generate embeddings for document text

**Files to Create**:
- `src/ml/embeddings.py` - Generate embeddings (OpenAI or local)
- Batch processing for efficiency

**Test**: Generate embeddings for 10 documents, verify similarity

---

### Step 7: Similarity Detection (Days 11-12)
**Goal**: Find near-duplicates using embeddings

**Files to Create**:
- `src/ml/similarity.py` - Calculate cosine similarity
- `src/duplicate_detection/near_duplicates.py` - Near-duplicate logic
- Clustering algorithm (DBSCAN or simple threshold)

**Test**: Identify near-duplicates in sample set

---

### Step 8: Basic Reporting (Days 13-14)
**Goal**: Generate simple duplicate reports

**Files to Create**:
- `src/workflow/report_generator.py` - Generate JSON/CSV reports
- `src/api/routes/duplicates.py` - API endpoint to get duplicates
- Simple CLI or web interface to view reports

**Test**: Generate report showing duplicate groups

---

### Step 9: Approval Workflow (Days 15-17)
**Goal**: Allow users to approve/reject duplicate suggestions

**Files to Create**:
- `src/workflow/approval_engine.py` - Approval logic
- `src/database/models.py` - Add approval tables
- `src/api/routes/approvals.py` - Approval endpoints
- Basic UI (or API-only for now)

**Test**: Approve duplicates, see status change

---

### Step 10: Audit Logging (Day 18)
**Goal**: Log all actions for compliance

**Files to Create**:
- `src/database/models.py` - Audit log table
- `src/workflow/actions.py` - Execute actions with logging
- Export functionality for audit logs

**Test**: Execute deletion, verify audit log entry

---

### Step 11: Metrics & ROI (Days 19-20)
**Goal**: Calculate storage savings and ROI

**Files to Create**:
- `src/metrics/storage_calculator.py` - Calculate savings
- `src/metrics/roi_calculator.py` - ROI calculations
- `src/api/routes/metrics.py` - Metrics endpoints
- Dashboard or report showing ROI

**Test**: Calculate and display ROI metrics

---

## MVP Scope (What to Include vs. Defer)

### ✅ Include in MVP
- Exact duplicate detection (content hashing)
- Basic near-duplicate detection (one embedding model)
- Simple approval workflow (approve/reject)
- Basic reporting (CSV/JSON export)
- Audit logging (simple database table)
- Storage savings calculation

### ⏸️ Defer to Later
- Advanced ML models (multiple embedding models)
- Filename pattern recognition (can add later)
- Email notifications (can add later)
- Web dashboard UI (start with API, add UI later)
- Incremental scanning (start with full scans)
- Multi-tenant support (start with single tenant)
- Advanced clustering algorithms
- File preview/comparison UI

---

## Testing Strategy

### Unit Tests (Write as You Go)
- Hash generation accuracy
- Similarity score calculations
- Text extraction from various formats

### Integration Tests (After Core Features)
- End-to-end scan workflow
- Approval workflow
- API endpoints

### Manual Testing
- Test on small SharePoint site (100-500 files)
- Verify duplicates are correctly identified
- Test approval workflow manually
- Verify audit logs

---

## Common Pitfalls to Avoid

### 1. Don't Download All Files at Once
- **Problem**: Memory issues, slow performance
- **Solution**: Stream files, hash in chunks, process one at a time

### 2. Don't Ignore Rate Limits
- **Problem**: API throttling, failed requests
- **Solution**: Implement exponential backoff, respect rate limits

### 3. Don't Store File Content
- **Problem**: Privacy issues, storage costs
- **Solution**: Only store hashes and metadata

### 4. Don't Auto-Delete Files
- **Problem**: Legal/compliance risk, user trust
- **Solution**: Always require approval, never auto-delete

### 5. Don't Skip Error Handling
- **Problem**: One bad file breaks entire scan
- **Solution**: Try/except around file processing, log errors, continue

---

## Getting Help & Resources

### Microsoft Graph API
- **Documentation**: https://learn.microsoft.com/en-us/graph/
- **Graph Explorer**: https://developer.microsoft.com/en-us/graph/graph-explorer
- **SDK**: https://github.com/microsoftgraph/msgraph-sdk-python

### Authentication
- **MSAL Python**: https://github.com/AzureAD/microsoft-authentication-library-for-python
- **Auth Flow Guide**: https://learn.microsoft.com/en-us/azure/active-directory/develop/scenario-daemon-overview

### ML/AI
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **Sentence-BERT**: https://www.sbert.net/
- **FAISS**: https://github.com/facebookresearch/faiss

### Document Processing
- **python-docx**: https://python-docx.readthedocs.io/
- **PyPDF2**: https://pypdf2.readthedocs.io/

---

## Success Criteria for MVP

### Functional Requirements
- ✅ Can authenticate to Microsoft Graph API
- ✅ Can scan SharePoint sites and OneDrive
- ✅ Can identify exact duplicates (same hash)
- ✅ Can identify near-duplicates (similarity > threshold)
- ✅ Can generate duplicate reports
- ✅ Can approve/reject duplicates
- ✅ Can log actions for audit

### Performance Requirements
- ✅ Can scan 1,000 files in < 30 minutes
- ✅ Can process files up to 100MB
- ✅ Handles API rate limits gracefully

### Quality Requirements
- ✅ No false positives in exact duplicates
- ✅ < 10% false positives in near-duplicates (acceptable for MVP)
- ✅ All actions logged for audit

---

## Next Steps After MVP

1. **Gather Feedback**: Test with real users, collect feedback
2. **Refine ML Model**: Adjust similarity thresholds based on feedback
3. **Add UI**: Build web dashboard for better UX
4. **Optimize Performance**: Parallel processing, caching, incremental scans
5. **Add Features**: Email notifications, advanced reporting, file previews
6. **Scale**: Handle larger tenants (10K+ files)

---

## Questions to Answer Before Starting

1. **Do you have Azure AD admin access?** (Required for app registration)
2. **What's your budget for OpenAI API?** (If using OpenAI embeddings)
3. **What's the target tenant size?** (Affects architecture decisions)
4. **Who are the end users?** (Admins only? Site owners? End users?)
5. **What's the compliance requirement?** (Affects audit logging needs)

Answer these, then start with Step 1!

