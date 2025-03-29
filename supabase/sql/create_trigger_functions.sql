
-- Create trigger function for logging website URL changes
CREATE OR REPLACE FUNCTION log_website_url_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO client_activities (
            client_id,
            activity_type,
            activity_data
        ) VALUES (
            NEW.client_id,
            'website_url_added',
            jsonb_build_object(
                'website_id', NEW.id,
                'url', NEW.url,
                'refresh_rate', NEW.refresh_rate,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on website_urls table
DROP TRIGGER IF EXISTS log_website_url_changes ON website_urls;
CREATE TRIGGER log_website_url_changes
AFTER INSERT ON website_urls
FOR EACH ROW
EXECUTE FUNCTION log_website_url_changes();

-- Function to disable website triggers (useful for bulk operations)
CREATE OR REPLACE FUNCTION disable_website_triggers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    ALTER TABLE website_urls DISABLE TRIGGER log_website_url_changes;
END;
$$;

-- Function to enable website triggers
CREATE OR REPLACE FUNCTION enable_website_triggers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    ALTER TABLE website_urls ENABLE TRIGGER log_website_url_changes;
END;
$$;
