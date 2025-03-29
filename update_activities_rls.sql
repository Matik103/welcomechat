
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON activities;

-- Create new policy to allow INSERT operations for authenticated users
CREATE POLICY "Enable insert access for authenticated users" ON activities
  FOR INSERT
  TO public
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Allow activities for agents where user's email matches
      ai_agent_id IN (
        SELECT id FROM ai_agents WHERE email = auth.jwt() ->> 'email'
      )
      OR
      -- Allow activities for client deletions and updates
      type IN ('client_deleted', 'client_updated', 'client_created', 'client_recovered')
    )
  );

-- Return success message
SELECT json_build_object('message', 'RLS policies updated successfully') as result; 
