-- Create a function to set up test client
CREATE OR REPLACE FUNCTION setup_test_client()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record json;
  agent_record json;
BEGIN
  -- Check if test client exists
  SELECT to_json(clients.*) INTO client_record
  FROM clients
  WHERE email = 'clientest3@gmail.com'
  LIMIT 1;

  IF client_record IS NULL THEN
    -- Create test client
    INSERT INTO clients (client_name, email, status, created_at, updated_at)
    VALUES ('Test Client', 'clientest3@gmail.com', 'active', NOW(), NOW())
    RETURNING to_json(clients.*) INTO client_record;
  END IF;

  -- Check if agent exists
  SELECT to_json(ai_agents.*) INTO agent_record
  FROM ai_agents
  WHERE client_id = (client_record->>'id')::uuid
  LIMIT 1;

  IF agent_record IS NULL THEN
    -- Create document processing agent
    INSERT INTO ai_agents (
      client_id,
      name,
      email,
      company,
      model,
      status,
      created_at,
      updated_at
    )
    VALUES (
      (client_record->>'id')::uuid,
      'Document Processing Agent',
      'agent@test.com',
      'Test Company',
      'gpt-4',
      'active',
      NOW(),
      NOW()
    )
    RETURNING to_json(ai_agents.*) INTO agent_record;

    -- Create activity record
    INSERT INTO activities (
      ai_agent_id,
      type,
      metadata
    )
    VALUES (
      (agent_record->>'id')::uuid,
      'document_added',
      jsonb_build_object('message', 'Agent created')
    );
  END IF;

  RETURN jsonb_build_object(
    'client', client_record,
    'agent', agent_record
  );
END;
$$; 