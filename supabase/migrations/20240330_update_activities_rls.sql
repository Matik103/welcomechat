-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON activities;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON activities;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON activities;

-- Enable RLS on activities table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read activities
CREATE POLICY "Enable read access for authenticated users"
ON activities FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert activities
CREATE POLICY "Enable insert access for authenticated users"
ON activities FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update activities
CREATE POLICY "Enable update access for authenticated users"
ON activities FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON activities TO authenticated; 