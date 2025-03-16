
-- Diagnostic queries to check the current state
-- First, let's check if we have any data in ai_agents table
SELECT COUNT(*) AS total_ai_agents FROM ai_agents;

-- Check if the chatbot tables exist
DO $$
DECLARE
  chatbot_tables text[] := ARRAY[
    'coca_cola', 'deals', 'digicel', 'frenniy', 'gaiivo', 'glouglu', 
    'great_deal', 'imanye_3', 'mailer', 'metricool', 'n8n', 'neem_25', 
    'news', 'nnmo1', 'notion', 'sadhana_forest'
  ];
  table_exists boolean;
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY chatbot_tables
  LOOP
    EXECUTE format('SELECT EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = ''public'' AND tablename = %L
    )', table_name) INTO table_exists;
    
    IF table_exists THEN
      EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO table_exists;
      RAISE NOTICE 'Table % exists and has % rows', table_name, table_exists;
    ELSE
      RAISE NOTICE 'Table % does not exist', table_name;
    END IF;
  END LOOP;
END $$;

-- Fix: Direct migration script that explicitly maps tables to client IDs
-- This approach uses explicit insert statements for each table to ensure migration happens

-- First, let's ensure we have clients for each agent
DO $$
DECLARE
  agent_names text[] := ARRAY[
    'coca_cola', 'deals', 'digicel', 'frenniy', 'gaiivo', 'glouglu', 
    'great_deal', 'imanye_3', 'mailer', 'metricool', 'n8n', 'neem_25', 
    'news', 'nnmo1', 'notion', 'sadhana_forest'
  ];
  client_id uuid;
  agent_name text;
BEGIN
  FOREACH agent_name IN ARRAY agent_names
  LOOP
    -- Check if we already have a client with this agent name
    SELECT id INTO client_id FROM clients 
    WHERE agent_name = agent_name OR agent_name ILIKE '%' || agent_name || '%'
    LIMIT 1;
    
    -- If not, create a new client for this agent
    IF client_id IS NULL THEN
      INSERT INTO clients (
        client_name,
        agent_name,
        email,
        status,
        created_at,
        updated_at
      ) VALUES (
        initcap(replace(agent_name, '_', ' ')), -- Convert to title case for display
        agent_name,
        'migration-' || agent_name || '@example.com',
        'active',
        NOW(),
        NOW()
      )
      RETURNING id INTO client_id;
      
      RAISE NOTICE 'Created new client for agent % with ID %', agent_name, client_id;
    ELSE
      RAISE NOTICE 'Found existing client for agent % with ID %', agent_name, client_id;
    END IF;
  END LOOP;
END $$;

-- Now let's migrate the data for each table
DO $$
DECLARE
  agent_table RECORD;
  client_record RECORD;
  migration_count int;
  query_text text;
BEGIN
  -- For each known agent table
  FOR agent_table IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'coca_cola', 'deals', 'digicel', 'frenniy', 'gaiivo', 'glouglu', 
      'great_deal', 'imanye_3', 'mailer', 'metricool', 'n8n', 'neem_25', 
      'news', 'nnmo1', 'notion', 'sadhana_forest'
    )
  LOOP
    -- Find the corresponding client
    SELECT id, agent_name INTO client_record FROM clients 
    WHERE agent_name = agent_table.tablename 
    OR agent_name ILIKE '%' || agent_table.tablename || '%'
    LIMIT 1;
    
    IF client_record.id IS NOT NULL THEN
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
      ', client_record.id, client_record.agent_name, agent_table.tablename, agent_table.tablename);
      
      EXECUTE query_text;
      GET DIAGNOSTICS migration_count = ROW_COUNT;
      
      RAISE NOTICE 'Migrated % records from % to client % (agent: %)', 
        migration_count, agent_table.tablename, client_record.id, client_record.agent_name;
      
      -- Log the activity
      IF migration_count > 0 THEN
        INSERT INTO client_activities (
          client_id,
          activity_type,
          description,
          metadata
        ) VALUES (
          client_record.id,
          'ai_agent_created',
          'Migrated ' || migration_count || ' entries from ' || agent_table.tablename || ' table',
          jsonb_build_object(
            'agent_name', client_record.agent_name,
            'source_table', agent_table.tablename,
            'record_count', migration_count
          )
        );
      END IF;
    ELSE
      RAISE NOTICE 'No client found for agent table %', agent_table.tablename;
    END IF;
  END LOOP;
END $$;

-- Final check to see if we migrated successfully
SELECT COUNT(*) AS total_ai_agents_after_migration FROM ai_agents;
