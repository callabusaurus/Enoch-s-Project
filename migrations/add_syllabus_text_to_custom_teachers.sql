-- Migration: Add syllabus_text column to custom_teachers table
-- This allows storing extracted text from syllabus files uploaded during teacher creation
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE custom_teachers 
ADD COLUMN IF NOT EXISTS syllabus_text TEXT;

-- Optional: Add an index if you plan to search through syllabus text
-- CREATE INDEX IF NOT EXISTS idx_custom_teachers_syllabus_text ON custom_teachers USING gin(to_tsvector('english', syllabus_text));


