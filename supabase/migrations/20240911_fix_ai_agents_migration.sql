
-- This migration fixes issues with the ai_agents migration

-- First check if the helper functions exist
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'migrate_chatbot_to_ai_agents'
) AS migrate_function_exists;

-- Create the helper function if it doesn't exist
CREATE OR REPLACE FUNCTION migrate_chatbot_to_ai_agents(
  source_table text,
  client_id_param uuid,
  agent_name_param text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  migration_count integer := 0;
  query_text text;
BEGIN
  -- Build and execute migration query
  query_text := format('
    INSERT INTO ai_agents (
      client_id,
      name,
      content,
      embedding,
      settings,
      interaction_type,
      created_at,
      updated_at,
      is_error
    )
    SELECT 
      %L::uuid,                -- client_id
      %L,                      -- agent_name
      content,                 -- content
      embedding,               -- embedding
      COALESCE(metadata, ''{}''::jsonb) || jsonb_build_object(
        ''source_table'', %L,
        ''original_id'', id,
        ''migration_date'', NOW()::text
      ),                       -- settings
      ''imported_data'',       -- interaction_type
      COALESCE(created_at, NOW()),    -- created_at
      COALESCE(updated_at, NOW()),    -- updated_at
      false                    -- is_error
    FROM %I
    WHERE content IS NOT NULL
    ON CONFLICT DO NOTHING
  ', client_id_param, agent_name_param, source_table, source_table);
  
  EXECUTE query_text;
  GET DIAGNOSTICS migration_count = ROW_COUNT;
  
  RETURN migration_count;
END;
$$;

-- Update log_chat_interaction function to match current needs
DROP FUNCTION IF EXISTS log_chat_interaction(uuid, text, text, text, integer, jsonb);
CREATE OR REPLACE FUNCTION log_chat_interaction(
  client_id_param uuid,
  agent_name_param text,
  query_text_param text,
  response_text_param text,
  response_time_ms_param integer DEFAULT 0,
  topic_param text DEFAULT NULL,
  sentiment_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Enhanced metadata with interaction details
  metadata_param := jsonb_build_object(
    'type', 'chat_interaction',
    'query', query_text_param,
    'response_time_ms', response_time_ms_param,
    'timestamp', now()
  ) || metadata_param;
  
  -- Insert the interaction as a new record
  INSERT INTO ai_agents (
    client_id, 
    name, 
    content, 
    settings, 
    interaction_type,
    query_text,
    response_time_ms,
    topic,
    sentiment,
    is_error,
    created_at,
    updated_at
  )
  VALUES (
    client_id_param,
    agent_name_param,
    response_text_param,  -- Store response in content
    metadata_param,
    'chat_interaction',
    query_text_param,
    response_time_ms_param,
    topic_param,
    sentiment_param,
    false,
    now(),
    now()
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Grant execute permissions on these functions
GRANT EXECUTE ON FUNCTION migrate_chatbot_to_ai_agents(text, uuid, text) TO postgres;
GRANT EXECUTE ON FUNCTION log_chat_interaction(uuid, text, text, text, integer, text, text, jsonb) TO authenticated;

-- Add DB functions to support client dashboard stats
CREATE OR REPLACE FUNCTION get_client_dashboard_stats(
  client_id_param uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_name text;
  stats_json json;
BEGIN
  -- Get the agent name for this client
  SELECT agent_name INTO agent_name
  FROM clients
  WHERE id = client_id_param;
  
  IF agent_name IS NULL THEN
    RETURN json_build_object(
      'total_interactions', 0,
      'active_days', 0,
      'average_response_time', 0,
      'top_queries', '[]'::json
    );
  END IF;
  
  -- Get the dashboard stats
  SELECT json_build_object(
    'total_interactions', COALESCE((
      SELECT COUNT(*)
      FROM ai_agents
      WHERE client_id = client_id_param
      AND name = agent_name
      AND interaction_type = 'chat_interaction'
    ), 0),
    'active_days', COALESCE((
      SELECT COUNT(DISTINCT DATE(created_at))
      FROM ai_agents
      WHERE client_id = client_id_param
      AND name = agent_name
      AND interaction_type = 'chat_interaction'
    ), 0),
    'average_response_time', COALESCE((
      SELECT ROUND(AVG(response_time_ms)::numeric / 1000, 2)
      FROM ai_agents
      WHERE client_id = client_id_param
      AND name = agent_name
      AND interaction_type = 'chat_interaction'
      AND response_time_ms IS NOT NULL
    ), 0),
    'top_queries', COALESCE((
      SELECT json_agg(json_build_object('query_text', query_text, 'frequency', count(*)))
      FROM (
        SELECT query_text, COUNT(*) as frequency
        FROM ai_agents
        WHERE client_id = client_id_param
        AND name = agent_name
        AND interaction_type = 'chat_interaction'
        AND query_text IS NOT NULL
        GROUP BY query_text
        ORDER BY count(*) DESC
        LIMIT 5
      ) q
    ), '[]'::json)
  ) INTO stats_json;
  
  RETURN stats_json;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_client_dashboard_stats(uuid) TO authenticated;

-- Create script to run migration
DO $$
DECLARE
  chatbot_tables text[] := ARRAY[
    'coca_cola', 'deals', 'digicel', 'frenniy', 'gaiivo', 'glouglu', 
    'great_deal', 'imanye_3', 'mailer', 'metricool', 'n8n', 'neem_25', 
    'news', 'nnmo1', 'notion', 'sadhana_forest'
  ];
  table_exists boolean;
  table_name text;
  client_id uuid;
  client_agent_name text;
  migration_count integer;
BEGIN
  -- For each chatbot table in the list
  FOREACH table_name IN ARRAY chatbot_tables
  LOOP
    -- Check if the table exists
    EXECUTE format('SELECT EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = ''public'' AND tablename = %L
    )', table_name) INTO table_exists;
    
    IF table_exists THEN
      RAISE NOTICE 'Processing chatbot table: %', table_name;
      
      -- Find or create a client for this table
      SELECT id, agent_name 
      INTO client_id, client_agent_name
      FROM clients
      WHERE agent_name = table_name 
         OR LOWER(agent_name) = table_name
         OR LOWER(REPLACE(agent_name, ' ', '_')) = table_name
         OR agent_name ILIKE '%' || table_name || '%'
      LIMIT 1;
      
      -- If no client exists, create one
      IF client_id IS NULL THEN
        INSERT INTO clients (
          client_name,
          agent_name,
          email,
          status,
          created_at,
          updated_at
        ) VALUES (
          initcap(replace(table_name, '_', ' ')), -- Convert to title case for display
          table_name,
          'auto-created-' || table_name || '@example.com',
          'active',
          NOW(),
          NOW()
        )
        RETURNING id, agent_name INTO client_id, client_agent_name;
        
        RAISE NOTICE 'Created new client for table % with ID %', table_name, client_id;
      ELSE
        RAISE NOTICE 'Found existing client for table % with ID %', table_name, client_id;
      END IF;
      
      -- Now migrate the data
      SELECT migrate_chatbot_to_ai_agents(
        table_name, 
        client_id, 
        client_agent_name
      ) INTO migration_count;
      
      RAISE NOTICE 'Migrated % records from % to ai_agents for client %', 
        migration_count, table_name, client_id;
        
      -- Log the activity
      IF migration_count > 0 THEN
        INSERT INTO client_activities (
          client_id,
          activity_type,
          description,
          metadata
        ) VALUES (
          client_id,
          'ai_agent_created',
          'Migrated ' || migration_count || ' entries from ' || table_name || ' table',
          jsonb_build_object(
            'agent_name', client_agent_name,
            'source_table', table_name,
            'record_count', migration_count
          )
        );
      END IF;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complete';
END $$;

-- Return stats to verify migration worked
SELECT COUNT(*) as total_entries FROM ai_agents;
SELECT COUNT(DISTINCT client_id) as unique_clients FROM ai_agents;
