-- Create a function to insert activity records
CREATE OR REPLACE FUNCTION create_activity(
  p_ai_agent_id uuid,
  p_type text,
  p_metadata jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO activities (ai_agent_id, type, metadata)
  VALUES (p_ai_agent_id, p_type::activity_type, p_metadata)
  RETURNING to_json(activities.*) INTO v_result;
  
  RETURN v_result;
END;
$$; 