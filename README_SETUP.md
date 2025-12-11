# Setup Guide - Web App with Supabase

## Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account (free tier)
- Azure AD app registration

---

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Go to Settings → API
4. Copy:
   - Project URL
   - `anon` key (public)
   - `service_role` key (secret, backend only)
5. Go to SQL Editor
6. Run the migration file: `supabase/migrations/001_initial_schema.sql`

---

## Step 2: Set Up Azure AD App

1. Go to [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations → New registration
3. Name: "Redundancy Scanner"
4. Supported account types: "Accounts in any organizational directory"
5. Redirect URI: `http://localhost:3000/auth/callback` (Web)
6. Register
7. Go to API permissions → Add permissions → Microsoft Graph → Delegated permissions
8. Add:
   - `Files.Read`
   - `Sites.Read.All`
   - `User.Read`
9. Go to Certificates & secrets → New client secret
10. Copy Client ID and Client Secret
11. Go to Overview → Copy Tenant ID

---

## Step 3: Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your values
```

Run backend:
```bash
uvicorn app.main:app --reload --port 8000
```

---

## Step 4: Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your values
```

Run frontend:
```bash
npm run dev
```

---

## Step 5: Test

1. Open `http://localhost:5173` (or your frontend URL)
2. Sign in with Microsoft
3. Start a scan
4. View duplicates

---

## Project Structure

```
TOOL/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── auth/
│   │   ├── scanner/
│   │   ├── ml/
│   │   └── api/
│   └── requirements.txt
├── frontend/          # React/Vue frontend
│   ├── src/
│   └── package.json
└── supabase/
    └── migrations/    # Database migrations
```

---

## Next Steps

1. Implement Microsoft OAuth flow in backend
2. Create Graph API client
3. Implement file scanning
4. Add content hashing
5. Integrate Sentence-BERT for near-duplicates
6. Build approval workflow UI

---

## Troubleshooting

### Supabase Connection Issues
- Check your `.env` file has correct URL and keys
- Verify RLS policies are set correctly
- Check Supabase project is active

### Microsoft Graph Auth Issues
- Verify redirect URI matches Azure AD app
- Check permissions are granted
- Ensure client secret is correct

### CORS Issues
- Add your frontend URL to `CORS_ORIGINS` in backend `.env`
- Check backend CORS middleware is configured

