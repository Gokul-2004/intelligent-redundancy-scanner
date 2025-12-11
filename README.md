# Intelligent Redundancy Scanner

A tool to identify and manage duplicate/near-duplicate files across SharePoint sites and OneDrive accounts, with custodian-assisted cleanup workflows and compliance tracking.

## 📋 Overview

This tool helps organizations:
- **Identify exact duplicates** using content hashing (SHA-256)
- **Detect near-duplicates** using AI-powered semantic analysis
- **Provide actionable reports** for document owners to review
- **Track approvals** with full audit trails for compliance
- **Calculate ROI** through storage savings and e-discovery cost reduction

## 🎯 Key Features

### 1. Content Hashing (Exact Duplicates)
- Scans documents across SharePoint and OneDrive
- Computes SHA-256 hashes to identify identical content
- Groups files with same hash regardless of name/location

### 2. Near-Duplicate Detection
- Uses AI embeddings (OpenAI or Sentence-BERT) for semantic analysis
- Identifies similar documents (e.g., "Report v1", "Report Final", "Report Final Draft 2")
- Combines filename similarity, content similarity, and metadata analysis

### 3. Custodian-Assisted Clean-Up
- Generates actionable reports (not auto-deletion)
- Provides approval workflow for document owners
- Maintains audit trail for compliance

### 4. Storage & Compliance Value
- Calculates storage space savings (GB/TB)
- Estimates e-discovery cost reduction
- Tracks ROI metrics

## 📚 Documentation

This repository contains comprehensive planning and architecture documentation:

1. **[ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)** - High-level architecture, system design, and component breakdown
2. **[TECHNICAL_APPROACH.md](./TECHNICAL_APPROACH.md)** - Detailed technical strategies for each component
3. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Recommended project structure and development workflow
4. **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Step-by-step guide with decision points and MVP roadmap

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Azure AD admin access (for app registration)
- Microsoft Graph API permissions
- (Optional) OpenAI API key for embeddings

### Getting Started

1. **Read the Quick Start Guide**: Start with [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)
2. **Review Architecture**: Understand the system design in [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)
3. **Set Up Azure AD App**: Register app and get API permissions
4. **Build MVP**: Follow the step-by-step guide in QUICK_START_GUIDE.md

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Web Dashboard (Frontend)              │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         API Server (Backend)                    │
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
    └──────────────────────────────────┘
              │
    ┌─────────▼──────────────┐
    │   Microsoft Graph API  │
    │   SharePoint/OneDrive  │
    └────────────────────────┘
```

## 🔧 Technology Stack

### Backend
- **Python 3.11+** - Core language
- **FastAPI** - API framework
- **PostgreSQL** - Database
- **Microsoft Graph API** - SharePoint/OneDrive integration
- **MSAL** - Microsoft authentication

### ML/AI
- **OpenAI API** or **Sentence-BERT** - Document embeddings
- **scikit-learn** - Similarity calculations
- **python-docx, openpyxl, PyPDF2** - Document processing

### Frontend (Future)
- **React/Vue.js** - Web dashboard
- **Chart.js/D3.js** - Data visualization

## 📊 Key Metrics

The tool tracks:
- **Total Scanned**: Files, sites, users
- **Duplicates Found**: Exact + near-duplicates
- **Storage Recoverable**: GB/TB
- **Approval Rate**: % of duplicates approved for deletion
- **ROI**: Estimated annual savings

## 🔒 Security & Compliance

- **Minimal Data Storage**: Only stores hashes and metadata, not file content
- **Encryption**: Database encryption at rest
- **Access Control**: Role-based permissions
- **Audit Logs**: Immutable logs for compliance reviews
- **GDPR Compliant**: Right to deletion, data portability

## 📝 Development Status

This is a planning/architecture repository. Implementation phases:

- [ ] Phase 1: Foundation (Authentication, Basic Scanning)
- [ ] Phase 2: Exact Duplicate Detection
- [ ] Phase 3: Near-Duplicate Detection
- [ ] Phase 4: Workflow & UI
- [ ] Phase 5: Optimization & Scale

## 🤝 Contributing

This is currently a planning phase. See [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) for development roadmap.

## 📄 License

TBD

## 🙋 Questions?

Review the documentation files:
- **Architecture questions**: See [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)
- **Technical details**: See [TECHNICAL_APPROACH.md](./TECHNICAL_APPROACH.md)
- **Getting started**: See [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)

---

**Note**: This repository contains planning and architecture documentation. Code implementation will follow based on these plans.

