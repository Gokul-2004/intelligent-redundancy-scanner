# Technical Approach - Quick Reference

## 1. Content Hashing Strategy

### Algorithm Selection
- **Primary**: SHA-256 (cryptographically secure, widely supported)
- **Why**: Detects exact duplicates reliably, even if filenames/locations differ
- **Optimization**: Only hash files of identical size (quick pre-filter)

### Implementation Pattern
```python
# Pseudocode
1. Scan files → Group by size
2. For each size group:
   - Stream file content in chunks
   - Compute SHA-256 hash incrementally
   - Store hash in database
3. Query database for duplicate hashes
4. Group files with same hash as duplicates
```

### Key Libraries
- `hashlib` (Python standard library)
- `aiofiles` (async file I/O)
- `asyncio` (parallel processing)

---

## 2. Near-Duplicate Detection

### Three-Pronged Approach

#### A. Filename Analysis
- **Levenshtein Distance**: Character-level similarity
- **Jaro-Winkler**: Better for names with common prefixes
- **Pattern Matching**: Regex for version numbers (v1, v2, Final, Draft)
- **Normalization**: Remove dates, common words, extensions

#### B. Content Semantic Analysis
- **Text Extraction**: 
  - Office docs: `python-docx`, `openpyxl`, `python-pptx`
  - PDFs: `PyPDF2` or `pdfplumber`
- **Embedding Generation**:
  - Option 1: OpenAI `text-embedding-3-small` (best quality, costs $)
  - Option 2: Sentence-BERT `all-MiniLM-L6-v2` (free, local, good quality)
- **Similarity**: Cosine similarity between embeddings (0-1 scale)

#### C. Metadata Comparison
- Creation date proximity
- Author matching
- File type consistency
- Size ratio (within 10-20% = potential duplicate)

### Hybrid Scoring Formula
```
Final Score = (0.3 × Filename Similarity) + 
              (0.5 × Content Similarity) + 
              (0.2 × Metadata Similarity)

Threshold: > 0.85 = Near-duplicate
```

### Clustering Approach
- **DBSCAN**: Groups similar documents automatically
- **Hierarchical Clustering**: For smaller, more controlled groups
- **Manual Threshold**: Simple distance-based grouping

---

## 3. Microsoft Graph API Integration

### Authentication Flow
```
1. Register Azure AD App
2. Request Admin Consent for:
   - Sites.Read.All (read SharePoint sites)
   - Files.Read.All (read files)
   - User.Read.All (read user info)
3. Use Client Credentials Flow (service principal)
4. Get access token
5. Make API calls with token
```

### Key Endpoints
```
GET /sites?$select=id,name,webUrl
GET /sites/{site-id}/drives
GET /drives/{drive-id}/items?$expand=children
GET /drives/{drive-id}/items/{item-id}/content
GET /drives/{drive-id}/items/{item-id}?$select=name,size,lastModifiedDateTime,createdBy
```

### Rate Limiting Strategy
- Graph API: 10,000 requests per 10 minutes per app
- Implement exponential backoff
- Use batch requests (`$batch`) when possible
- Cache responses where appropriate

### Libraries
- `msal` (Microsoft Authentication Library)
- `requests` or `httpx` (HTTP client)
- `msgraph-sdk-python` (optional, wrapper library)

---

## 4. Workflow & Approval System

### Data Flow
```
Scan → Identify Duplicates → Generate Report → 
Notify Custodian → Review → Approve/Reject → 
Execute Action → Log Audit Trail
```

### Report Structure
```json
{
  "duplicate_group_id": "abc123",
  "primary_file": {
    "id": "file1",
    "name": "Q4 Report Final.docx",
    "path": "/Documents/Reports/",
    "size_bytes": 1024000,
    "owner": "john@company.com"
  },
  "duplicate_files": [
    {
      "id": "file2",
      "name": "Q4 Report v1.docx",
      "similarity_score": 0.92,
      "storage_savings_bytes": 1024000
    }
  ],
  "total_storage_savings": 2048000,
  "confidence": "high"
}
```

### Approval States
- `pending`: Awaiting review
- `approved`: Ready for deletion/archival
- `rejected`: Not duplicates (update ML model)
- `deferred`: Needs manual review
- `completed`: Action executed

### UI Components Needed
- File preview/comparison viewer
- Bulk selection interface
- Approval workflow forms
- Dashboard with metrics

---

## 5. Storage & ROI Calculation

### Metrics to Calculate

#### Storage Savings
```python
total_duplicate_storage = sum(file.size for file in duplicate_files)
storage_cost_per_gb = 0.02  # Example: $0.02/GB/month
monthly_savings = (total_duplicate_storage / (1024**3)) * storage_cost_per_gb
annual_savings = monthly_savings * 12
```

#### E-Discovery Cost Reduction
```python
# Typical e-discovery costs: $0.50 - $2.00 per document
documents_removed = len(duplicate_files)
ediscovery_cost_per_doc = 1.00  # $1/document
potential_ediscovery_savings = documents_removed * ediscovery_cost_per_doc
```

#### Operational Benefits
- Backup storage reduction
- Sync time improvement
- Search index size reduction

### Dashboard Metrics
- **Total Scanned**: Count of files, sites, users
- **Duplicates Found**: Exact + near-duplicates
- **Storage Recoverable**: GB/TB with breakdown
- **Approval Rate**: % approved vs. rejected
- **ROI Projection**: Estimated annual savings

---

## 6. Database Schema (Key Tables)

### Files Table
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY,
    file_id VARCHAR(255) UNIQUE,  -- Graph API file ID
    site_id VARCHAR(255),
    drive_id VARCHAR(255),
    file_path TEXT,
    file_name VARCHAR(500),
    file_size BIGINT,
    content_hash VARCHAR(64),  -- SHA-256 hex
    last_modified TIMESTAMP,
    owner_email VARCHAR(255),
    scan_timestamp TIMESTAMP,
    INDEX idx_hash (content_hash),
    INDEX idx_site (site_id)
);
```

### Duplicate Groups Table
```sql
CREATE TABLE duplicate_groups (
    id UUID PRIMARY KEY,
    group_type VARCHAR(20),  -- 'exact' or 'near'
    primary_file_id UUID REFERENCES files(id),
    similarity_score FLOAT,
    storage_savings_bytes BIGINT,
    status VARCHAR(20),  -- 'pending', 'approved', etc.
    created_at TIMESTAMP
);
```

### Group Members Table
```sql
CREATE TABLE duplicate_group_members (
    group_id UUID REFERENCES duplicate_groups(id),
    file_id UUID REFERENCES files(id),
    is_primary BOOLEAN,
    similarity_score FLOAT,
    PRIMARY KEY (group_id, file_id)
);
```

### Audit Log Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    action_type VARCHAR(50),  -- 'approve', 'reject', 'delete', etc.
    user_email VARCHAR(255),
    group_id UUID REFERENCES duplicate_groups(id),
    file_ids JSONB,  -- Array of affected file IDs
    action_timestamp TIMESTAMP,
    reason TEXT,
    storage_saved_bytes BIGINT
);
```

---

## 7. Performance Optimization Strategies

### Scanning Optimization
- **Incremental Scans**: Only scan new/changed files
- **Parallel Processing**: Scan multiple sites/drives concurrently
- **Chunked Hashing**: For large files, hash in 1MB chunks
- **Caching**: Cache file hashes, only re-hash if modified

### ML Optimization
- **Batch Embedding**: Process multiple documents in one API call
- **Approximate Nearest Neighbor**: Use FAISS for fast similarity search
- **Sampling**: For very large datasets, sample before full comparison
- **Model Caching**: Cache embeddings, only regenerate if content changed

### API Optimization
- **Batch Requests**: Use Graph API `$batch` endpoint
- **Delta Queries**: Use delta sync for incremental updates
- **Connection Pooling**: Reuse HTTP connections
- **Retry Logic**: Exponential backoff for rate limits

---

## 8. Error Handling & Edge Cases

### Common Issues
- **Large Files**: Stream processing, don't load into memory
- **API Rate Limits**: Implement backoff, queue requests
- **Permission Errors**: Log and skip, notify admin
- **Corrupted Files**: Skip, log error, continue scan
- **Network Timeouts**: Retry with exponential backoff
- **Storage Quota**: Handle when tenant storage is full

### Data Quality
- **False Positives**: Allow users to mark "not duplicate" (feedback loop)
- **False Negatives**: Periodic re-scan with adjusted thresholds
- **Version Control**: Track which files are versions vs. duplicates

---

## 9. Security Considerations

### Data Protection
- **Encryption**: Encrypt database at rest (AES-256)
- **Transit**: Use HTTPS for all API calls
- **Secrets Management**: Store API keys in Azure Key Vault / AWS Secrets Manager
- **Access Control**: Role-based permissions (admin, site admin, user)

### Privacy
- **Minimal Storage**: Only store hashes/metadata, not file content
- **User Consent**: Clear opt-in/opt-out mechanism
- **Data Retention**: Auto-delete old scan data per policy
- **GDPR Compliance**: Right to deletion, data portability

---

## 10. Scalability Considerations

### Horizontal Scaling
- **Microservices**: Separate scanner, ML, and API services
- **Queue System**: Use message queue (RabbitMQ, Azure Service Bus) for jobs
- **Load Balancing**: Distribute API requests across instances

### Vertical Scaling
- **Database Indexing**: Proper indexes on hash, site_id, file_id
- **Connection Pooling**: Efficient database connection management
- **Memory Management**: Stream large files, don't load entirely

### Caching Strategy
- **Redis**: Cache file hashes, API responses, user sessions
- **CDN**: Serve static dashboard assets
- **Database Query Cache**: Cache frequent queries

---

## Recommended Tech Stack Summary

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI (async, auto-docs) or Flask
- **Database**: PostgreSQL 14+
- **Cache**: Redis
- **Task Queue**: Celery + Redis (or Azure Service Bus)

### ML/AI
- **Embeddings**: OpenAI API (start) → Sentence-BERT (scale)
- **Text Processing**: `python-docx`, `openpyxl`, `PyPDF2`
- **Similarity**: `scikit-learn`, `faiss` (for large scale)

### Frontend
- **Framework**: React or Vue.js
- **Charts**: Chart.js or D3.js
- **UI Library**: Material-UI or Ant Design

### Infrastructure
- **Cloud**: Azure (native integration) or AWS
- **Containers**: Docker
- **Orchestration**: Kubernetes (optional, for scale)

### APIs
- **Microsoft Graph**: `msal` + `requests`/`httpx`
- **Authentication**: Azure AD / Microsoft Identity Platform

