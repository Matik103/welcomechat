
-- Create or replace the log_client_activity function to bypass RLS
CREATE OR REPLACE FUNCTION public.log_client_activity(
  client_id_param UUID,
  activity_type_param TEXT,
  description_param TEXT,
  metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the function owner
SET search_path = public
AS $$
DECLARE
  new_activity_id UUID;
BEGIN
  -- Insert the activity record
  INSERT INTO client_activities (
    client_id,
    activity_type,
    description,
    activity_data,
    created_at,
    updated_at
  ) VALUES (
    client_id_param,
    activity_type_param,
    description_param,
    metadata_param,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_activity_id;
  
  -- Return success response
  RETURN json_build_object(
    'success', TRUE,
    'activity_id', new_activity_id
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'error_detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.log_client_activity TO authenticated;

-- Verify RLS is enabled on client_activities
ALTER TABLE IF EXISTS public.client_activities ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service role to do everything
CREATE POLICY IF NOT EXISTS "Service role has full access to client activities"
  ON public.client_activities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a policy that allows all authenticated users to select their own activities
CREATE POLICY IF NOT EXISTS "Users can view their own activities"
  ON public.client_activities
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR
    client_id = auth.uid()
  );
