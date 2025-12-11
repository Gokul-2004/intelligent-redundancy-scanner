# Intelligent Redundancy Scanner - Architecture & Implementation Plan

## Overview
A tool to identify and manage duplicate/near-duplicate files across SharePoint sites and OneDrive accounts, with custodian-assisted cleanup workflows and compliance tracking.

---

## 1. Content Hashing (Exact Duplicate Detection)

### Approach
**Multi-Level Hashing Strategy:**

1. **Quick Filter (File Size + Name Hash)**
   - First pass: Group files by size
   - Only compare files of identical size
   - Reduces computational overhead

2. **Content Hashing Algorithms**
   - **SHA-256**: Primary hash for file content
   - **MD5**: Optional secondary hash for quick comparison
   - **Block-level hashing**: For large files, hash in chunks to detect partial duplicates

3. **Implementation Strategy**
   - **Streaming Hash**: Don't download entire files; hash in chunks as you read
   - **Parallel Processing**: Hash multiple files concurrently
   - **Caching**: Store hashes in database to avoid re-hashing unchanged files
   - **Incremental Scanning**: Track last modified dates, only re-hash changed files

### Technical Stack Options
- **Python**: `hashlib` for SHA-256, `asyncio` for parallel processing
- **Database**: SQLite/PostgreSQL to store file metadata + hashes
- **Caching**: Redis for hash lookups during scan

### Data Model
```
FileRecord:
  - file_id (unique)
  - site_id / drive_id
  - file_path
  - file_name
  - file_size
  - content_hash (SHA-256)
  - last_modified
  - owner_email
  - scan_timestamp
```

---

## 2. Near-Duplicate Detection (Semantic Analysis)

### Approach
**Multi-Modal Similarity Detection:**

1. **Filename Similarity**
   - **String Distance Metrics**: Levenshtein, Jaro-Winkler, Fuzzy matching
   - **Pattern Recognition**: Detect version patterns (v1, v2, Final, Draft, etc.)
   - **Normalization**: Remove common suffixes, dates, version numbers for comparison

2. **Content-Based Semantic Similarity**
   - **Text Extraction**: Extract text from Office docs (Word, Excel, PowerPoint, PDF)
   - **Embedding Generation**: Use AI models to create semantic embeddings
     - **Options**: OpenAI embeddings, Sentence-BERT, Universal Sentence Encoder
   - **Similarity Scoring**: Cosine similarity between embeddings
   - **Threshold**: Configurable similarity threshold (e.g., 85%+ = near-duplicate)

3. **Metadata Similarity**
   - Compare creation dates, modification dates, author
   - File type, size ranges
   - Folder structure patterns

4. **Hybrid Scoring**
   - Combine filename similarity + content similarity + metadata similarity
   - Weighted scoring system (configurable)

### Technical Stack Options
- **Text Extraction**: 
  - Python: `python-docx`, `openpyxl`, `PyPDF2`, `python-pptx`
  - Microsoft Graph API: Native text extraction endpoints
- **AI/ML Models**:
  - **OpenAI API**: `text-embedding-ada-002` or `text-embedding-3-small`
  - **Local Models**: Sentence-BERT (`sentence-transformers` library)
  - **Azure Cognitive Services**: Document Intelligence API
- **Similarity Calculation**:
  - `scikit-learn` for cosine similarity
  - `faiss` (Facebook AI Similarity Search) for efficient similarity search at scale

### Implementation Flow
```
1. Extract text from documents
2. Generate embeddings (batch processing)
3. Build similarity matrix (or use approximate nearest neighbor search)
4. Cluster similar documents (DBSCAN, hierarchical clustering)
5. Rank clusters by confidence score
```

---

## 3. SharePoint & OneDrive Integration

### Authentication & Permissions
- **Microsoft Graph API**: Primary interface
- **Application Permissions**: Requires admin consent for tenant-wide scanning
- **Delegated Permissions**: For user-specific OneDrive scanning
- **Service Principal**: For automated scanning without user interaction

### API Endpoints Needed
- **Sites**: `GET /sites` - List all SharePoint sites
- **Drives**: `GET /sites/{site-id}/drives` - List document libraries
- **Files**: `GET /sites/{site-id}/drives/{drive-id}/items/{item-id}/content` - Download file content
- **Metadata**: `GET /sites/{site-id}/drives/{drive-id}/items` - Get file metadata
- **Permissions**: `GET /sites/{site-id}/drives/{drive-id}/items/{item-id}/permissions` - Get file owners

### Implementation Strategy
- **Rate Limiting**: Respect Graph API throttling (use exponential backoff)
- **Batch Requests**: Use `$batch` endpoint for multiple operations
- **Delta Queries**: Use delta sync for incremental updates
- **Pagination**: Handle large result sets efficiently

### Technical Stack
- **Python**: `msal` (Microsoft Authentication Library) for auth
- **SDK**: `msgraph-sdk-python` or direct REST API calls
- **Async Processing**: `aiohttp` for concurrent API calls

---

## 4. Custodian-Assisted Clean-Up Workflow

### Report Generation
**Structured Report Format:**

1. **Duplicate Groups**
   - Group ID
   - Primary file (recommended keeper)
   - Duplicate files (recommended for deletion)
   - Similarity scores
   - Storage savings per group

2. **Report Types**
   - **Per-Site Reports**: Site administrators see duplicates within their site
   - **Per-User Reports**: OneDrive owners see their duplicates
   - **Tenant-Wide Summary**: Admin dashboard with aggregated stats

3. **Report Format**
   - **Web Dashboard**: Interactive UI (React/Vue)
   - **Email Reports**: PDF/HTML summaries
   - **CSV/JSON Export**: For bulk operations

### Approval Workflow
**Multi-Stage Approval:**

1. **Review Interface**
   - Side-by-side file comparison
   - Preview documents
   - Show metadata differences
   - Highlight text differences (for near-duplicates)

2. **Action Options**
   - **Approve Deletion**: Mark files for deletion
   - **Archive**: Move to archive location
   - **Keep All**: Mark as "not duplicates" (update ML model)
   - **Merge**: Combine content if needed

3. **Bulk Actions**
   - Select multiple groups
   - Apply same action to all
   - Filter by file type, size, date range

### Audit Trail
**Compliance Logging:**

```
AuditLog:
  - action_id (unique)
  - timestamp
  - user_email (who approved)
  - file_ids (affected files)
  - action_type (delete/archive/keep)
  - reason (optional)
  - storage_saved
  - compliance_tags
```

**Storage**: Store in database + exportable logs (CSV, JSON, or compliance system integration)

---

## 5. Storage & Compliance Value Metrics

### ROI Calculation
**Metrics to Track:**

1. **Storage Savings**
   - Total duplicate storage identified (GB/TB)
   - Storage cost per GB (from tenant admin)
   - Projected annual savings

2. **E-Discovery Benefits**
   - Reduced document count in e-discovery scope
   - Estimated cost reduction (fewer documents = lower processing costs)
   - Faster search/indexing times

3. **Operational Benefits**
   - Reduced backup storage requirements
   - Faster sync times
   - Improved search relevance (less noise)

### Dashboard Metrics
- **Total Scanned**: Files, sites, users
- **Duplicates Found**: Exact + near-duplicates
- **Storage Recoverable**: GB/TB
- **Approval Rate**: % of duplicates approved for deletion
- **Time Saved**: Estimated hours saved in manual cleanup

### Reporting
- **Executive Dashboard**: High-level metrics
- **Detailed Reports**: Per-site, per-user breakdowns
- **Trend Analysis**: Track improvements over time
- **Compliance Reports**: Audit-ready documentation

---

## 6. System Architecture

### Component Breakdown

```
┌─────────────────────────────────────────────────┐
│           Web Dashboard (Frontend)              │
│         React/Vue + Chart.js/D3.js             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         API Server (Backend)                    │
│    FastAPI/Flask + Authentication              │
└──────┬──────────────┬──────────────┬────────────┘
       │              │              │
┌──────▼──────┐  ┌───▼──────┐  ┌───▼──────────┐
│   Scanner   │  │  ML      │  │  Workflow    │
│  Service    │  │  Service │  │  Engine      │
└──────┬──────┘  └───┬──────┘  └───┬──────────┘
       │              │              │
       └──────┬───────┴──────┬───────┘
              │              │
    ┌─────────▼──────────────▼─────────┐
    │      Database (PostgreSQL)       │
    │  - File metadata & hashes        │
    │  - Duplicate groups              │
    │  - Audit logs                    │
    │  - User approvals                │
    └──────────────────────────────────┘
              │
    ┌─────────▼──────────────┐
    │   Microsoft Graph API  │
    │   SharePoint/OneDrive  │
    └────────────────────────┘
```

### Deployment Options
- **On-Premises**: Docker containers, Kubernetes
- **Cloud**: Azure App Service, AWS ECS/Lambda
- **Hybrid**: Scanner on-premises, dashboard in cloud

---

## 7. Implementation Phases (Conceptual)

### Phase 1: Foundation
- Set up Microsoft Graph API authentication
- Build basic file scanning (metadata only)
- Implement content hashing (SHA-256)
- Store results in database

### Phase 2: Exact Duplicate Detection
- Complete hash-based duplicate detection
- Build reporting interface (basic)
- Test on small dataset

### Phase 3: Near-Duplicate Detection
- Integrate text extraction
- Implement embedding generation
- Build similarity scoring
- Create clustering algorithm

### Phase 4: Workflow & UI
- Build approval interface
- Implement audit logging
- Create email notifications
- Dashboard with metrics

### Phase 5: Optimization & Scale
- Performance tuning
- Batch processing optimization
- Caching strategies
- Handle large tenants (100K+ files)

---

## 8. Key Technical Decisions

### Programming Language
- **Python**: Best ecosystem for ML/AI, document processing, API integration
- **Alternative**: C#/.NET if deep Microsoft stack integration needed

### Database Choice
- **PostgreSQL**: Robust, good for complex queries, JSON support
- **Alternative**: Azure SQL if fully Azure-native

### ML Model Choice
- **Start**: OpenAI embeddings (easiest, best quality)
- **Scale**: Move to local Sentence-BERT (cost-effective, privacy)
- **Hybrid**: Use OpenAI for high-value documents, local model for bulk

### File Processing
- **Streaming**: Process files in chunks, don't load entire file into memory
- **Parallel**: Use async/await or multiprocessing for concurrent operations
- **Resumable**: Track progress, allow pause/resume of scans

---

## 9. Security & Compliance Considerations

### Data Privacy
- **Minimal Data Storage**: Only store hashes and metadata, not file content
- **Encryption**: Encrypt database at rest
- **Access Control**: Role-based access (admin, site admin, user)

### Compliance
- **GDPR**: Right to deletion, data portability
- **Retention Policies**: Respect organizational retention rules
- **Audit Logs**: Immutable logs for compliance reviews

### Permissions
- **Principle of Least Privilege**: Only request necessary Graph API permissions
- **User Consent**: Clear communication about what's being scanned
- **Opt-Out**: Allow users/sites to opt out of scanning

---

## 10. Testing Strategy

### Unit Tests
- Hash generation accuracy
- Similarity scoring algorithms
- API integration mocks

### Integration Tests
- End-to-end scan workflow
- Approval workflow
- Audit log generation

### Performance Tests
- Large file handling (10GB+ files)
- Bulk operations (10K+ files)
- Concurrent user scenarios

### User Acceptance
- Pilot with small group
- Gather feedback on UI/UX
- Refine similarity thresholds

---

## Next Steps

1. **Proof of Concept**: Build minimal viable scanner (exact duplicates only)
2. **API Integration**: Test Microsoft Graph API access and permissions
3. **ML Model Selection**: Test embedding models on sample documents
4. **UI Mockup**: Design approval workflow interface
5. **Database Schema**: Finalize data model

