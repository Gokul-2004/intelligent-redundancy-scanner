-- Simplified schema without authentication
-- For MVP: Single user, no auth needed

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- For embedding similarity search

-- Simplified Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id TEXT NOT NULL UNIQUE,  -- Graph API file ID
    site_id TEXT,
    drive_id TEXT,
    file_path TEXT,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    content_hash TEXT,  -- SHA-256
    last_modified TIMESTAMP,
    owner_email TEXT,
    text_content TEXT,  -- Extracted text
    embedding VECTOR(384),  -- Sentence-BERT embedding
    scan_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_name ON files(file_name);
CREATE INDEX IF NOT EXISTS idx_files_embedding ON files USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Simplified Duplicate groups
CREATE TABLE IF NOT EXISTS duplicate_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_type TEXT NOT NULL CHECK (group_type IN ('exact', 'near')),
    primary_file_id UUID REFERENCES files(id),
    similarity_score REAL,
    storage_savings_bytes BIGINT DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_status ON duplicate_groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_type ON duplicate_groups(group_type);

-- Group members
CREATE TABLE IF NOT EXISTS duplicate_group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES duplicate_groups(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    similarity_score REAL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_group_file UNIQUE(group_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_members_group ON duplicate_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_members_file ON duplicate_group_members(file_id);

-- Audit logs (simplified)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject', 'delete', 'archive', 'keep')),
    group_id UUID REFERENCES duplicate_groups(id),
    file_ids UUID[],
    timestamp TIMESTAMP DEFAULT NOW(),
    reason TEXT,
    storage_saved_bytes BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- Scan jobs (simplified)
CREATE TABLE IF NOT EXISTS scan_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    total_files INTEGER DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON scan_jobs(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_duplicate_groups_updated_at 
    BEFORE UPDATE ON duplicate_groups
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

