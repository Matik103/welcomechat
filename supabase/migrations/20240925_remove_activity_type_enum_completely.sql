
-- This migration completely removes the client_activities table and activity_type_enum
-- This is a clean slate approach to ensure no lingering references

-- Drop the client_activities table if it exists
DROP TABLE IF EXISTS client_activities;

-- Drop the enum type if it exists (with CASCADE to force removal of any dependencies)
DROP TYPE IF EXISTS activity_type_enum CASCADE;

-- Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'client_activities table and activity_type_enum have been completely removed';
END
$$;
