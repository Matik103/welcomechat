-- Create client_activities table
CREATE TABLE IF NOT EXISTS public.client_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    activity_type VARCHAR(255) NOT NULL,
    activity_data JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Create website_urls table
CREATE TABLE IF NOT EXISTS public.website_urls (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    refresh_rate INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    last_crawled TIMESTAMPTZ,
    scrapable BOOLEAN DEFAULT true,
    is_sitemap BOOLEAN DEFAULT false,
    scrapability VARCHAR(50),
    error TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON public.client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON public.client_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_website_urls_client_id ON public.website_urls(client_id);
CREATE INDEX IF NOT EXISTS idx_website_urls_url ON public.website_urls(url);

-- Enable Row Level Security (RLS)
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_urls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_activities
CREATE OR REPLACE POLICY "Service role has full access to client activities"
    ON public.client_activities
    FOR ALL
    USING (
        (auth.jwt() ->> 'role' = 'service_role')
        OR (
            auth.uid() IN (
                SELECT id FROM ai_agents WHERE id = client_id
            )
        )
    )
    WITH CHECK (
        (auth.jwt() ->> 'role' = 'service_role')
        OR (
            auth.uid() IN (
                SELECT id FROM ai_agents WHERE id = client_id
            )
        )
    );

-- Create RLS policies for website_urls
CREATE OR REPLACE POLICY "Service role has full access to website URLs"
    ON public.website_urls
    FOR ALL
    USING (
        (auth.jwt() ->> 'role' = 'service_role')
        OR (
            auth.uid() IN (
                SELECT id FROM ai_agents WHERE id = client_id
            )
        )
    )
    WITH CHECK (
        (auth.jwt() ->> 'role' = 'service_role')
        OR (
            auth.uid() IN (
                SELECT id FROM ai_agents WHERE id = client_id
            )
        )
    );

-- Create document_links table
CREATE TABLE IF NOT EXISTS public.document_links (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    link TEXT NOT NULL,
    document_type VARCHAR(50) DEFAULT 'document',
    refresh_rate INTEGER DEFAULT 30,
    access_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    notified_at TIMESTAMPTZ,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    storage_path TEXT
);

-- Create index for document_links
CREATE INDEX IF NOT EXISTS idx_document_links_client_id ON public.document_links(client_id);

-- Enable Row Level Security (RLS) for document_links
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role has full access to document links" ON public.document_links;
DROP POLICY IF EXISTS "Users can view their own document links" ON public.document_links;
DROP POLICY IF EXISTS "Users can insert their own document links" ON public.document_links;
DROP POLICY IF EXISTS "Users can update their own document links" ON public.document_links;
DROP POLICY IF EXISTS "Users can delete their own document links" ON public.document_links;

-- Create granular RLS policies for document_links
CREATE POLICY "Users can view their own document links"
    ON public.document_links
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can insert their own document links"
    ON public.document_links
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can update their own document links"
    ON public.document_links
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can delete their own document links"
    ON public.document_links
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Service role has full access to document links"
    ON public.document_links
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add file_name column to document_links table
ALTER TABLE IF EXISTS public.document_links
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT; 