-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    microsoft_token TEXT,  -- Encrypted Microsoft access token
    microsoft_refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    file_id TEXT NOT NULL,  -- Graph API file ID
    site_id TEXT,
    drive_id TEXT,
    file_path TEXT,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    content_hash TEXT,  -- SHA-256
    last_modified TIMESTAMP,
    owner_email TEXT,
    text_content TEXT,  -- Extracted text
    embedding VECTOR(384),  -- Sentence-BERT embedding (384 dimensions)
    scan_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_file UNIQUE(user_id, file_id)
);

-- Indexes for files
CREATE INDEX idx_files_user_hash ON files(user_id, content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX idx_files_user_name ON files(user_id, file_name);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_embedding ON files USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Duplicate groups
CREATE TABLE duplicate_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    group_type TEXT NOT NULL CHECK (group_type IN ('exact', 'near')),
    primary_file_id UUID REFERENCES files(id),
    similarity_score REAL,
    storage_savings_bytes BIGINT DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for duplicate_groups
CREATE INDEX idx_groups_user_status ON duplicate_groups(user_id, status);
CREATE INDEX idx_groups_user_type ON duplicate_groups(user_id, group_type);

-- Group members (many-to-many)
CREATE TABLE duplicate_group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES duplicate_groups(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    similarity_score REAL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_group_file UNIQUE(group_id, file_id)
);

-- Indexes for group members
CREATE INDEX idx_members_group ON duplicate_group_members(group_id);
CREATE INDEX idx_members_file ON duplicate_group_members(file_id);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject', 'delete', 'archive', 'keep')),
    group_id UUID REFERENCES duplicate_groups(id),
    file_ids UUID[],
    timestamp TIMESTAMP DEFAULT NOW(),
    reason TEXT,
    storage_saved_bytes BIGINT DEFAULT 0
);

-- Indexes for audit logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- Scan jobs (track scanning progress)
CREATE TABLE scan_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    total_files INTEGER DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Indexes for scan jobs
CREATE INDEX idx_jobs_user_status ON scan_jobs(user_id, status);
CREATE INDEX idx_jobs_user_id ON scan_jobs(user_id);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Files: Users can only see their own files
CREATE POLICY "Users can view own files"
    ON files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
    ON files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
    ON files FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
    ON files FOR DELETE
    USING (auth.uid() = user_id);

-- Duplicate groups: Users can only see their own groups
CREATE POLICY "Users can view own groups"
    ON duplicate_groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own groups"
    ON duplicate_groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own groups"
    ON duplicate_groups FOR UPDATE
    USING (auth.uid() = user_id);

-- Group members: Inherit from groups (users can see members of their groups)
CREATE POLICY "Users can view own group members"
    ON duplicate_group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM duplicate_groups
            WHERE duplicate_groups.id = duplicate_group_members.group_id
            AND duplicate_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own group members"
    ON duplicate_group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM duplicate_groups
            WHERE duplicate_groups.id = duplicate_group_members.group_id
            AND duplicate_groups.user_id = auth.uid()
        )
    );

-- Audit logs: Users can only see their own logs
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Scan jobs: Users can only see their own jobs
CREATE POLICY "Users can view own scan jobs"
    ON scan_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan jobs"
    ON scan_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan jobs"
    ON scan_jobs FOR UPDATE
    USING (auth.uid() = user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duplicate_groups_updated_at BEFORE UPDATE ON duplicate_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

