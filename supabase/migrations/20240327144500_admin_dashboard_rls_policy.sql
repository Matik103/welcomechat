
-- This migration ensures admin dashboard users can access and modify ai_agents table

-- Make sure RLS is enabled
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow service role full access" ON ai_agents;
DROP POLICY IF EXISTS "Enable read access for all users" ON ai_agents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON ai_agents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON ai_agents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON ai_agents;
DROP POLICY IF EXISTS "Enable public read access" ON ai_agents;

-- Create comprehensive policy for service role (keeps this intact)
CREATE POLICY "Allow service role full access" ON ai_agents
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create policy for authenticated users with admin role to have full access
CREATE POLICY "Allow admins full access" ON ai_agents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- General policy for authenticated users to read their own records
CREATE POLICY "Allow users to read their own records" ON ai_agents
    FOR SELECT
    TO authenticated
    USING (client_id::text = auth.uid()::text OR 
           EXISTS (
               SELECT 1 FROM user_roles
               WHERE user_roles.client_id = ai_agents.client_id
               AND user_roles.user_id = auth.uid()
           )
    );

-- Log the policy change
INSERT INTO client_activities (
    activity_type,
    description,
    metadata
)
VALUES (
    'system_update',
    'Updated RLS policies for admin access to ai_agents table',
    jsonb_build_object(
        'update_type', 'rls_policy',
        'table', 'ai_agents',
        'updated_at', NOW()
    )
);
