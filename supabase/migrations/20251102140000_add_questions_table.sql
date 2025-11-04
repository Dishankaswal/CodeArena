-- Create questions table
CREATE TABLE contest_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER NOT NULL DEFAULT 100,
  test_cases JSONB,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contest_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contest_questions table
-- Anyone can view questions for contests that have started
CREATE POLICY "Anyone can view questions for started contests" ON contest_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contests 
    WHERE contests.id = contest_id 
    AND contests.start_time <= NOW()
  )
);

-- Contest creators can add questions to their contests
CREATE POLICY "Contest creators can add questions" ON contest_questions FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT created_by FROM contests WHERE id = contest_id)
);

-- Contest creators can update questions in their contests
CREATE POLICY "Contest creators can update questions" ON contest_questions FOR UPDATE
USING (
  auth.uid() IN (SELECT created_by FROM contests WHERE id = contest_id)
);

-- Contest creators can delete questions from their contests
CREATE POLICY "Contest creators can delete questions" ON contest_questions FOR DELETE
USING (
  auth.uid() IN (SELECT created_by FROM contests WHERE id = contest_id)
);

-- Create indexes for better performance
CREATE INDEX idx_contest_questions_contest_id ON contest_questions(contest_id);
CREATE INDEX idx_contest_questions_order ON contest_questions(contest_id, order_index);

-- Add a function to check if a contest is currently running
CREATE OR REPLACE FUNCTION is_contest_running(contest_start_time TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN contest_start_time <= NOW() AND contest_start_time + INTERVAL '2 hours' > NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE;
