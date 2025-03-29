-- Function to insert a website URL as admin
CREATE OR REPLACE FUNCTION admin_insert_website_url(
    client_id uuid,
    url text,
    refresh_rate integer,
    status text
) RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_website_url json;
BEGIN
    INSERT INTO website_urls (client_id, url, refresh_rate, status)
    VALUES ($1, $2, $3, $4)
    RETURNING json_build_object(
        'id', id,
        'client_id', client_id,
        'url', url,
        'refresh_rate', refresh_rate,
        'status', status,
        'created_at', created_at
    ) INTO new_website_url;
    
    RETURN new_website_url;
END;
$$;

-- Function to get website URLs for a client as admin
CREATE OR REPLACE FUNCTION admin_get_website_urls(p_client_id uuid)
RETURNS SETOF website_urls
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM website_urls
    WHERE client_id = p_client_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_insert_website_url(uuid, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_website_urls(uuid) TO authenticated; 