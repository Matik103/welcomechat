
-- This migration removes the activity_type_enum and converts the column to text type

-- First, create a temporary table to store the existing data
CREATE TEMP TABLE temp_activities AS 
SELECT 
  id, 
  client_id, 
  activity_type::text AS activity_type_text, 
  description, 
  created_at, 
  metadata
FROM client_activities;

-- Drop the client_activities table
DROP TABLE IF EXISTS client_activities;

-- Recreate the table with activity_type as text instead of enum
CREATE TABLE client_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Restore the data from the temporary table
INSERT INTO client_activities (id, client_id, activity_type, description, created_at, metadata)
SELECT 
  id, 
  client_id, 
  activity_type_text,
  description, 
  created_at, 
  metadata
FROM temp_activities;

-- Drop the activity_type_enum type if it exists
DROP TYPE IF EXISTS activity_type_enum;
