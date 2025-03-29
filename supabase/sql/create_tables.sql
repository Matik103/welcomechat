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
CREATE POLICY "Service role has full access to client activities"
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
CREATE POLICY "Service role has full access to website URLs"
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