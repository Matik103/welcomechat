-- Function to calculate average response time
CREATE OR REPLACE FUNCTION public.calculate_avg_response_time(p_agent_id uuid)
RETURNS TABLE (average_response_time double precision)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(AVG(response_time), 0) as average_response_time
  FROM interactions
  WHERE ai_agent_id = p_agent_id
    AND status = 'completed'
    AND response_time > 0
    AND response_time < 300000; -- Filter out outliers (> 5 minutes)
END;
$$;

-- Function to get common topics
CREATE OR REPLACE FUNCTION public.get_common_topics(p_agent_id uuid, p_limit integer)
RETURNS TABLE (
  topic text,
  count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.topic,
    COUNT(*) as count
  FROM interactions i
  WHERE i.ai_agent_id = p_agent_id
    AND i.status = 'completed'
    AND i.topic IS NOT NULL
    AND i.topic != ''
  GROUP BY i.topic
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$;

-- Add status column to interactions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'interactions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.interactions 
    ADD COLUMN status text DEFAULT 'completed';
  END IF;
END $$;

-- Add metadata JSONB columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'error_logs' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.error_logs 
    ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN severity text DEFAULT 'error';
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'agent_logs' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.agent_logs 
    ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN log_level text DEFAULT 'info';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interactions_status ON public.interactions(status);
CREATE INDEX IF NOT EXISTS idx_interactions_topic ON public.interactions(topic);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_agent_logs_log_level ON public.agent_logs(log_level); 