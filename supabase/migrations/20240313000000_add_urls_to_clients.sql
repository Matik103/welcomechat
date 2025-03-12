-- Add URLs array column to clients table
ALTER TABLE clients
ADD COLUMN urls TEXT[] DEFAULT '{}';

-- Add Google Drive URLs array column to clients table
ALTER TABLE clients
ADD COLUMN drive_urls TEXT[] DEFAULT '{}';

-- Add comment to describe the columns
COMMENT ON COLUMN clients.urls IS 'Array of website URLs added by the client';
COMMENT ON COLUMN clients.drive_urls IS 'Array of Google Drive URLs added by the client'; 