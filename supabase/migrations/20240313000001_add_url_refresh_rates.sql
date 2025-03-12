-- Add columns for URL refresh rates and check timestamps
ALTER TABLE clients
  -- Website URL columns
  ADD COLUMN website_url_refresh_rate bigint DEFAULT 86400000, -- 24 hours in milliseconds
  ADD COLUMN website_url_last_checked timestamp with time zone,
  ADD COLUMN website_url_next_check timestamp with time zone,
  
  -- Drive link columns
  ADD COLUMN drive_link_refresh_rate bigint DEFAULT 604800000, -- 7 days in milliseconds
  ADD COLUMN drive_link_last_checked timestamp with time zone,
  ADD COLUMN drive_link_next_check timestamp with time zone;

COMMENT ON COLUMN clients.website_url_refresh_rate IS 'How often to check website URL accessibility (in milliseconds)';
COMMENT ON COLUMN clients.website_url_last_checked IS 'When the website URL was last checked for accessibility';
COMMENT ON COLUMN clients.website_url_next_check IS 'When the website URL should be checked next';
COMMENT ON COLUMN clients.drive_link_refresh_rate IS 'How often to check Drive link accessibility (in milliseconds)';
COMMENT ON COLUMN clients.drive_link_last_checked IS 'When the Drive link was last checked for accessibility';
COMMENT ON COLUMN clients.drive_link_next_check IS 'When the Drive link should be checked next'; 