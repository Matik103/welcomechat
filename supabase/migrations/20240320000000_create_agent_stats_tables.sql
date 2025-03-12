-- Create interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    topic text,
    response_time integer, -- in milliseconds
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create error logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create agent logs table
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interactions_ai_agent_id ON public.interactions(ai_agent_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_ai_agent_id ON public.error_logs(ai_agent_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_ai_agent_id ON public.agent_logs(ai_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON public.agent_logs(created_at);

-- Add RLS policies
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Policies for interactions
CREATE POLICY "Users can view their own agent's interactions"
    ON public.interactions FOR SELECT
    USING (ai_agent_id IN (
        SELECT id FROM public.ai_agents WHERE client_id = auth.uid()
    ));

-- Policies for error logs
CREATE POLICY "Users can view their own agent's error logs"
    ON public.error_logs FOR SELECT
    USING (ai_agent_id IN (
        SELECT id FROM public.ai_agents WHERE client_id = auth.uid()
    ));

-- Policies for agent logs
CREATE POLICY "Users can view their own agent's logs"
    ON public.agent_logs FOR SELECT
    USING (ai_agent_id IN (
        SELECT id FROM public.ai_agents WHERE client_id = auth.uid()
    ));

-- Function to log an interaction
CREATE OR REPLACE FUNCTION public.log_interaction(
    p_ai_agent_id uuid,
    p_topic text,
    p_response_time integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_interaction_id uuid;
BEGIN
    INSERT INTO public.interactions (ai_agent_id, topic, response_time)
    VALUES (p_ai_agent_id, p_topic, p_response_time)
    RETURNING id INTO v_interaction_id;
    
    RETURN v_interaction_id;
END;
$$; 