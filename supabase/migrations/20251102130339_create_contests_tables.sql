-- Create contests table
CREATE TABLE contests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'biweekly', 'monthly', 'special')),
  description TEXT,
  gradient TEXT DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contest_registrations table
CREATE TABLE contest_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contests table
-- Anyone can view contests
CREATE POLICY "Anyone can view contests" ON contests FOR SELECT USING (true);

-- Only authenticated users can create contests
CREATE POLICY "Authenticated users can create contests" ON contests FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Only contest creators can update their contests
CREATE POLICY "Contest creators can update their contests" ON contests FOR UPDATE
USING (auth.uid() = created_by);

-- Only contest creators can delete their contests
CREATE POLICY "Contest creators can delete their contests" ON contests FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for contest_registrations table
-- Users can view their own registrations and registrations for contests they created
CREATE POLICY "Users can view registrations" ON contest_registrations FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.uid() IN (SELECT created_by FROM contests WHERE id = contest_id)
);

-- Users can register/unregister for contests
CREATE POLICY "Users can manage their registrations" ON contest_registrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unregister from contests
CREATE POLICY "Users can unregister from contests" ON contest_registrations FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_contests_start_time ON contests(start_time);
CREATE INDEX idx_contests_created_by ON contests(created_by);
CREATE INDEX idx_contest_registrations_contest_id ON contest_registrations(contest_id);
CREATE INDEX idx_contest_registrations_user_id ON contest_registrations(user_id);

