-- Drop any existing triggers on website_urls
DROP TRIGGER IF EXISTS log_website_url_changes ON website_urls;

-- Drop any existing trigger functions
DROP FUNCTION IF EXISTS log_website_url_changes();

-- Create a new trigger function that doesn't use the description column
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

-- Create a new trigger
CREATE TRIGGER log_website_url_changes
    AFTER INSERT OR UPDATE
    ON website_urls
    FOR EACH ROW
    EXECUTE FUNCTION log_website_url_changes(); 