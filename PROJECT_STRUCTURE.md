# Recommended Project Structure

```
TOOL/
├── README.md
├── requirements.txt
├── .env.example
├── docker-compose.yml
│
├── src/
│   ├── __init__.py
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── msal_auth.py          # Microsoft Graph authentication
│   │   └── permissions.py        # Permission management
│   │
│   ├── scanner/
│   │   ├── __init__.py
│   │   ├── content_hash.py       # SHA-256 hashing logic
│   │   ├── file_scanner.py       # Main scanning orchestration
│   │   ├── graph_client.py       # Microsoft Graph API client
│   │   └── incremental_scan.py   # Delta/incremental scanning
│   │
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── text_extractor.py     # Extract text from Office/PDF files
│   │   ├── embeddings.py          # Generate document embeddings
│   │   ├── similarity.py          # Calculate similarity scores
│   │   ├── clustering.py          # Group similar documents
│   │   └── models/                # ML model files (if using local models)
│   │
│   ├── duplicate_detection/
│   │   ├── __init__.py
│   │   ├── exact_duplicates.py   # Hash-based exact duplicate detection
│   │   ├── near_duplicates.py     # Semantic near-duplicate detection
│   │   ├── filename_analysis.py  # Filename similarity
│   │   └── scoring.py            # Hybrid scoring logic
│   │
│   ├── workflow/
│   │   ├── __init__.py
│   │   ├── report_generator.py   # Generate duplicate reports
│   │   ├── approval_engine.py    # Handle approval workflows
│   │   ├── notification.py       # Email/notification system
│   │   └── actions.py            # Execute delete/archive actions
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── models.py             # SQLAlchemy models
│   │   ├── repository.py         # Database access layer
│   │   └── migrations/           # Alembic migrations
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI/Flask app
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── scans.py         # Scan endpoints
│   │   │   ├── duplicates.py    # Duplicate query endpoints
│   │   │   ├── approvals.py     # Approval workflow endpoints
│   │   │   └── metrics.py       # ROI/metrics endpoints
│   │   └── middleware/
│   │       ├── auth.py          # Authentication middleware
│   │       └── error_handling.py
│   │
│   ├── metrics/
│   │   ├── __init__.py
│   │   ├── storage_calculator.py # Calculate storage savings
│   │   ├── roi_calculator.py     # Calculate ROI
│   │   └── reporting.py          # Generate reports
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logging.py           # Logging configuration
│       ├── config.py            # Configuration management
│       └── exceptions.py        # Custom exceptions
│
├── tests/
│   ├── __init__.py
│   ├── unit/
│   │   ├── test_content_hash.py
│   │   ├── test_similarity.py
│   │   └── test_scanner.py
│   ├── integration/
│   │   ├── test_graph_api.py
│   │   └── test_workflow.py
│   └── fixtures/
│       └── sample_files/
│
├── frontend/                    # Optional: if building web UI
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── public/
│
├── scripts/
│   ├── setup_azure_app.py      # Script to set up Azure AD app
│   ├── initial_scan.py         # One-time full scan script
│   └── cleanup_old_data.py     # Maintenance scripts
│
└── docs/
    ├── API.md                  # API documentation
    ├── DEPLOYMENT.md           # Deployment guide
    └── USER_GUIDE.md           # End-user documentation
```

## Key Files to Start With

### 1. `requirements.txt` (Initial)
```
# Core
fastapi==0.104.1
uvicorn==0.24.0
python-dotenv==1.0.0

# Database
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9

# Microsoft Graph
msal==1.24.1
httpx==0.25.1

# ML/AI
openai==1.3.0
sentence-transformers==2.2.2
scikit-learn==1.3.2

# Document Processing
python-docx==1.1.0
openpyxl==3.1.2
PyPDF2==3.0.1
python-pptx==0.6.23

# Utilities
pydantic==2.5.0
python-dateutil==2.8.2
```

### 2. `.env.example`
```env
# Azure AD / Microsoft Graph
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# OpenAI (optional, for embeddings)
OPENAI_API_KEY=your-openai-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/redundancy_scanner

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# Application
APP_ENV=development
LOG_LEVEL=INFO
```

### 3. `docker-compose.yml` (Development)
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: redundancy_scanner
      POSTGRES_USER: scanner
      POSTGRES_PASSWORD: scanner_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://scanner:scanner_pass@db:5432/redundancy_scanner
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src

volumes:
  postgres_data:
```

## Development Workflow

### Phase 1: Setup & Authentication
1. Create `src/auth/msal_auth.py` - Get Graph API token
2. Create `src/scanner/graph_client.py` - Basic API client
3. Test: List sites, list files

### Phase 2: Content Hashing
1. Create `src/scanner/content_hash.py` - SHA-256 hashing
2. Create `src/database/models.py` - File model
3. Test: Hash files, store in DB, find duplicates

### Phase 3: Near-Duplicate Detection
1. Create `src/ml/text_extractor.py` - Extract text
2. Create `src/ml/embeddings.py` - Generate embeddings
3. Create `src/ml/similarity.py` - Calculate similarity
4. Test: Find near-duplicates in sample set

### Phase 4: Workflow
1. Create `src/workflow/report_generator.py` - Generate reports
2. Create `src/api/routes/duplicates.py` - API endpoints
3. Create basic frontend (or use API directly)

### Phase 5: Polish
1. Add approval workflow
2. Add audit logging
3. Add metrics/ROI calculation
4. Add error handling & retries

