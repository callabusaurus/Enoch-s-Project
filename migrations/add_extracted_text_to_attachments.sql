-- Migration: Add extracted_text column to attachments table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Optional: Add an index if you plan to search through extracted text
-- CREATE INDEX IF NOT EXISTS idx_attachments_extracted_text ON attachments USING gin(to_tsvector('english', extracted_text));


