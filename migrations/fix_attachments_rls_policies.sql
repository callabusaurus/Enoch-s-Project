-- Migration: Fix Row Level Security Policies for attachments table
-- This fixes the "new row violates row-level security policy" error
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS on attachments table if not already enabled
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can select their own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can update their own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON attachments;

-- Allow users to insert their own attachments
CREATE POLICY "Users can insert their own attachments"
ON attachments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to select their own attachments
CREATE POLICY "Users can select their own attachments"
ON attachments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own attachments
CREATE POLICY "Users can update their own attachments"
ON attachments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON attachments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


