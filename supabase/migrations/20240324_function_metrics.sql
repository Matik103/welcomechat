-- Create function metrics table
CREATE TABLE IF NOT EXISTS public.function_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_name TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for querying by function name and time
CREATE INDEX IF NOT EXISTS idx_function_metrics_name_time 
ON public.function_metrics (function_name, created_at);

-- Create function to record metrics
CREATE OR REPLACE FUNCTION public.record_function_metric(
    p_function_name TEXT,
    p_execution_time_ms INTEGER,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.function_metrics 
        (function_name, execution_time_ms, success, error_message, metadata)
    VALUES 
        (p_function_name, p_execution_time_ms, p_success, p_error_message, p_metadata)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.function_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_function_metric TO authenticated; 