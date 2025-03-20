
-- Migration to thoroughly sanitize all occurrences of double quotes in agent-related fields

-- Create a comprehensive function to fix quotes in all relevant tables and fields
CREATE OR REPLACE FUNCTION fix_all_quotes() 
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  fixed_clients int := 0;
  fixed_agents int := 0;
  fixed_settings int := 0;
  fixed_prompts int := 0;
BEGIN
  -- Fix agent_name in clients table
  UPDATE clients
  SET agent_name = REPLACE(agent_name, '"', '''')
  WHERE agent_name LIKE '%"%';
  GET DIAGNOSTICS fixed_clients = ROW_COUNT;
  
  -- Fix client_name in clients table (just in case)
  UPDATE clients
  SET client_name = REPLACE(client_name, '"', '''')
  WHERE client_name LIKE '%"%';
  
  -- Fix all text fields in widget_settings JSON
  UPDATE clients
  SET widget_settings = 
    CASE 
      WHEN widget_settings IS NULL THEN widget_settings
      ELSE jsonb_strip_nulls(jsonb_build_object(
        'agent_description', REPLACE(widget_settings->>'agent_description', '"', ''''),
        'primary_color', widget_settings->>'primary_color',
        'secondary_color', widget_settings->>'secondary_color',
        'background_color', widget_settings->>'background_color',
        'text_color', widget_settings->>'text_color',
        'logo_url', widget_settings->>'logo_url',
        'logo_storage_path', widget_settings->>'logo_storage_path',
        'theme', widget_settings->>'theme',
        'welcome_message', REPLACE(widget_settings->>'welcome_message', '"', ''''),
        'position', widget_settings->>'position'
      ))
    END
  WHERE widget_settings::text LIKE '%"%';
  GET DIAGNOSTICS fixed_settings = ROW_COUNT;
  
  -- Fix ai_agents table extensively
  UPDATE ai_agents
  SET 
    name = REPLACE(name, '"', ''''),
    agent_description = REPLACE(agent_description, '"', ''''),
    ai_prompt = REPLACE(ai_prompt, '"', ''''),
    content = REPLACE(content, '"', ''''),
    settings = 
      CASE 
        WHEN settings IS NULL THEN settings
        ELSE jsonb_strip_nulls(jsonb_build_object(
          'agent_description', REPLACE(settings->>'agent_description', '"', ''''),
          'client_name', REPLACE(settings->>'client_name', '"', ''''),
          'logo_url', settings->>'logo_url',
          'logo_storage_path', settings->>'logo_storage_path',
          'source_table', settings->>'source_table',
          'original_id', settings->>'original_id',
          'migration_date', settings->>'migration_date',
          'updated_at', settings->>'updated_at'
        ))
      END
  WHERE 
    name LIKE '%"%' 
    OR agent_description LIKE '%"%' 
    OR ai_prompt LIKE '%"%'
    OR content LIKE '%"%'
    OR settings::text LIKE '%"%';
  GET DIAGNOSTICS fixed_agents = ROW_COUNT;
  
  -- Fix client_activities descriptions
  UPDATE client_activities
  SET description = REPLACE(description, '"', '''')
  WHERE description LIKE '%"%';
  
  -- Also check and sanitize document fields
  UPDATE documents
  SET 
    title = REPLACE(title, '"', ''''),
    content = REPLACE(content, '"', '''')
  WHERE 
    title LIKE '%"%' OR
    content LIKE '%"%';
  
  -- Fix any agent queries containing double quotes
  UPDATE agent_queries
  SET 
    query_text = REPLACE(query_text, '"', ''''),
    response = REPLACE(response, '"', '''')
  WHERE 
    query_text LIKE '%"%' OR
    response LIKE '%"%';
  
  -- Log the results in the system
  RAISE NOTICE 'Fixed quotes in % client records, % agent records, % widget settings', 
    fixed_clients, fixed_agents, fixed_settings;
END;
$$;

-- Execute the comprehensive sanitization
SELECT fix_all_quotes();

-- Log this thorough fix in client activities
INSERT INTO client_activities (
  client_id,
  activity_type,
  description,
  metadata
)
SELECT 
  id,
  'system_update',
  'Applied comprehensive double quote sanitization to all database records',
  jsonb_build_object(
    'fix_type', 'thorough_quote_sanitization',
    'timestamp', NOW()
  )
FROM clients
ORDER BY updated_at DESC
LIMIT 1;

-- Update the sanitize_agent_input function to be even more robust
CREATE OR REPLACE FUNCTION sanitize_agent_input(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Replace double quotes with single quotes
  input_text := REPLACE(input_text, '"', '''');
  
  -- Replace other potentially problematic characters
  input_text := REPLACE(input_text, '\\', '\\\\'); -- Escape backslashes
  input_text := REPLACE(input_text, ';', ''); -- Remove semicolons
  
  RETURN input_text;
END;
$$;

-- Update all database functions that handle agent input to use this sanitize function
-- This is a good practice to ensure that any future agent input is automatically sanitized
