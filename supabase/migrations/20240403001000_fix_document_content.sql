-- Function to store document content and embedding
CREATE OR REPLACE FUNCTION public.store_document_content(
    p_client_id UUID,
    p_content TEXT,
    p_embedding vector(1536),
    p_file_name TEXT,
    p_file_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id BIGINT;
BEGIN
    -- Insert the document content and return the ID
    INSERT INTO public.document_content (
        client_id,
        content,
        embedding,
        filename,
        file_type,
        created_at,
        updated_at
    ) VALUES (
        p_client_id,
        p_content,
        p_embedding,
        p_file_name,
        p_file_type,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_id;

    -- Return the ID as a JSON object
    RETURN jsonb_build_object('id', v_id);
END;
$$;