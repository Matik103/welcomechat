
-- Create activities table
CREATE TABLE IF NOT EXISTS client_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    activity_type VARCHAR(255) NOT NULL,
    activity_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create website_urls table if it doesn't exist
CREATE TABLE IF NOT EXISTS website_urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON client_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_website_urls_client_id ON website_urls(client_id);
CREATE INDEX IF NOT EXISTS idx_website_urls_url ON website_urls(url);

-- Add RLS (Row Level Security) policies
ALTER TABLE client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_urls ENABLE ROW LEVEL SECURITY;

-- Policies for client_activities
CREATE POLICY "Users can view their own activities"
    ON client_activities FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can insert their own activities"
    ON client_activities FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

-- Policies for website_urls
CREATE POLICY "Users can view their own website URLs"
    ON website_urls FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can insert their own website URLs"
    ON website_urls FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can update their own website URLs"
    ON website_urls FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can delete their own website URLs"
    ON website_urls FOR DELETE
    USING (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );
