
-- This migration updates the activity_type enum to include client_reactivated and client_recovered activity types

-- First, check if the activity_type type exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        -- Add new values to the existing enum if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client_recovered' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type')) THEN
            ALTER TYPE activity_type ADD VALUE 'client_recovered';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client_reactivated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type')) THEN
            ALTER TYPE activity_type ADD VALUE 'client_reactivated';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client_deletion_scheduled' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type')) THEN
            ALTER TYPE activity_type ADD VALUE 'client_deletion_scheduled';
        END IF;
    END IF;
END
$$;

-- Add a comment to explain the new enum values
COMMENT ON TYPE activity_type IS 'Valid activity types for the application including client lifecycle events';
