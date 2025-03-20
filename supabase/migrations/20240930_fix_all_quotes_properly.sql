
-- More thorough sanitization of quotes in all client data

-- Create a function to handle proper quote sanitization
CREATE OR REPLACE FUNCTION sanitize_database_quotes() 
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  fixed_clients int := 0;
  fixed_agents int := 0;
  fixed_settings int := 0;
BEGIN
  -- Fix agent_name in clients table - replace double quotes with empty string
  UPDATE clients
  SET agent_name = REPLACE(agent_name, '"', '')
  WHERE agent_name LIKE '%"%';
  GET DIAGNOSTICS fixed_clients = ROW_COUNT;
  
  -- Fix any single quotes by properly escaping them (double them for SQL)
  UPDATE clients
  SET agent_name = REPLACE(agent_name, '''', '''''')
  WHERE agent_name LIKE '%''%';
  
  -- Fix all text fields in widget_settings JSON
  UPDATE clients
  SET widget_settings = 
    CASE 
      WHEN widget_settings IS NULL THEN widget_settings
      ELSE jsonb_strip_nulls(jsonb_build_object(
        'agent_description', REPLACE(REPLACE(widget_settings->>'agent_description', '"', ''), '''', ''''''),
        'primary_color', widget_settings->>'primary_color',
        'secondary_color', widget_settings->>'secondary_color',
        'background_color', widget_settings->>'background_color',
        'text_color', widget_settings->>'text_color',
        'logo_url', widget_settings->>'logo_url',
        'logo_storage_path', widget_settings->>'logo_storage_path',
        'theme', widget_settings->>'theme',
        'welcome_message', REPLACE(REPLACE(widget_settings->>'welcome_message', '"', ''), '''', ''''''),
        'position', widget_settings->>'position'
      ))
    END
  WHERE widget_settings::text LIKE '%"%' OR widget_settings::text LIKE '%''%';
  GET DIAGNOSTICS fixed_settings = ROW_COUNT;
  
  -- Fix AI agents settings thorougly
  UPDATE ai_agents
  SET 
    name = REPLACE(name, '"', ''),
    agent_description = REPLACE(agent_description, '"', '')
  WHERE 
    name LIKE '%"%' OR
    agent_description LIKE '%"%';
  GET DIAGNOSTICS fixed_agents = ROW_COUNT;

  -- Also fix single quotes
  UPDATE ai_agents
  SET 
    name = REPLACE(name, '''', ''''''),
    agent_description = REPLACE(agent_description, '''', '''''')
  WHERE 
    name LIKE '%''%' OR
    agent_description LIKE '%''%';
  
  -- Log the results
  RAISE NOTICE 'Fixed quotes in % client records, % agent records, % widget settings', 
    fixed_clients, fixed_agents, fixed_settings;
END;
$$;

-- Execute the sanitization
SELECT sanitize_database_quotes();

-- Log this more thorough fix in client activities
INSERT INTO client_activities (
  client_id,
  activity_type,
  description,
  metadata
)
SELECT 
  id,
  'system_update',
  'Applied more thorough quote sanitization to all database records',
  jsonb_build_object(
    'fix_type', 'complete_quote_sanitization',
    'timestamp', NOW()
  )
FROM clients
ORDER BY updated_at DESC
LIMIT 1;

-- Update the SQL function to properly handle quotes
CREATE OR REPLACE FUNCTION create_new_client(
  p_client_name TEXT,
  p_email TEXT,
  p_agent_name TEXT DEFAULT '',
  p_agent_description TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_logo_storage_path TEXT DEFAULT NULL,
  p_widget_settings JSONB DEFAULT '{}'::jsonb,
  p_status TEXT DEFAULT 'active'
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  new_client_id UUID;
  safe_agent_name TEXT;
  safe_agent_description TEXT;
  final_widget_settings JSONB;
BEGIN
  -- Sanitize inputs to prevent SQL issues
  safe_agent_name := REPLACE(COALESCE(p_agent_name, ''), '"', '');
  safe_agent_description := REPLACE(COALESCE(p_agent_description, ''), '"', '');
  
  -- Merge the provided widget_settings with the agent_description
  final_widget_settings := COALESCE(p_widget_settings, '{}'::jsonb);
  final_widget_settings := jsonb_set(
    final_widget_settings, 
    '{agent_description}', 
    to_jsonb(safe_agent_description)
  );
  
  -- Add logo information to widget_settings
  IF p_logo_url IS NOT NULL THEN
    final_widget_settings := jsonb_set(
      final_widget_settings, 
      '{logo_url}', 
      to_jsonb(p_logo_url)
    );
  END IF;
  
  IF p_logo_storage_path IS NOT NULL THEN
    final_widget_settings := jsonb_set(
      final_widget_settings, 
      '{logo_storage_path}', 
      to_jsonb(p_logo_storage_path)
    );
  END IF;
  
  -- Insert into clients table
  INSERT INTO clients (
    client_name,
    email,
    agent_name,
    logo_url,
    logo_storage_path,
    widget_settings,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_client_name,
    p_email,
    safe_agent_name,
    p_logo_url,
    p_logo_storage_path,
    final_widget_settings,
    p_status,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_client_id;
  
  -- Insert into ai_agents table
  INSERT INTO ai_agents (
    client_id,
    name,
    agent_description,
    content,
    interaction_type,
    settings,
    logo_url,
    logo_storage_path,
    created_at,
    updated_at
  ) VALUES (
    new_client_id,
    safe_agent_name,
    safe_agent_description,
    '',
    'config',
    jsonb_build_object(
      'agent_name', safe_agent_name,
      'agent_description', safe_agent_description,
      'client_name', p_client_name,
      'logo_url', p_logo_url,
      'logo_storage_path', p_logo_storage_path,
      'created_at', NOW()
    ),
    p_logo_url,
    p_logo_storage_path,
    NOW(),
    NOW()
  );
  
  -- Create activity log for client creation
  INSERT INTO client_activities (
    client_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    new_client_id,
    'client_created',
    'New client created with widget: ' || safe_agent_name,
    jsonb_build_object(
      'client_name', p_client_name,
      'agent_name', safe_agent_name,
      'email', p_email
    )
  );
  
  RETURN new_client_id;
END;
$$;
