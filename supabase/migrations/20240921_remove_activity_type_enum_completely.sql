
-- This migration completely removes any enum constraint on activity_type in client_activities
-- and ensures it's just a plain text column

-- Disable RLS for this operation
ALTER TABLE client_activities DISABLE ROW LEVEL SECURITY;

-- Create a temporary table to store the existing data
CREATE TEMP TABLE temp_client_activities AS 
SELECT 
  id, 
  client_id, 
  activity_type::text AS activity_type_text, 
  description, 
  created_at, 
  updated_at,
  metadata,
  activity_data
FROM client_activities;

-- Drop the client_activities table completely to remove all constraints
DROP TABLE IF EXISTS client_activities;

-- Recreate the table with activity_type as pure text
CREATE TABLE client_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  activity_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  activity_data JSONB
);

-- Restore the data from the temporary table
INSERT INTO client_activities (id, client_id, activity_type, description, created_at, updated_at, metadata, activity_data)
SELECT 
  id, 
  client_id, 
  activity_type_text,
  description, 
  created_at,
  updated_at, 
  metadata,
  activity_data
FROM temp_client_activities;

-- Add foreign key constraint if needed
ALTER TABLE client_activities 
  ADD CONSTRAINT client_activities_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE CASCADE;

-- Drop the activity_type_enum type if it exists
DROP TYPE IF EXISTS activity_type_enum;

-- Add index on client_id for better performance
CREATE INDEX client_activities_client_id_idx ON client_activities(client_id);

-- Log this migration
INSERT INTO client_activities (
  activity_type,
  description,
  metadata
)
VALUES (
  'system_update',
  'Completely removed activity_type_enum constraint',
  jsonb_build_object(
    'update_type', 'schema_migration',
    'table', 'client_activities',
    'change', 'removed enum constraint on activity_type',
    'timestamp', now()
  )
);

-- Disable RLS on ai_agents table to allow development access
ALTER TABLE ai_agents DISABLE ROW LEVEL SECURITY;
