
-- This migration completely removes any references to activity_type_enum
-- Since we've already dropped the client_activities table

-- Try dropping the enum type if it exists
DO $$
BEGIN
  -- Drop the enum type if it exists
  DROP TYPE IF EXISTS activity_type_enum;
  
  -- Check if any table still has a column using this enum
  -- If needed, we'll convert it to text type
  IF EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'activity_type_enum'
  ) THEN
    -- Find all columns using this type and change them to text
    FOR r IN (
      SELECT 
        format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE text;',
          cols.table_schema, 
          cols.table_name, 
          cols.column_name
        ) as alter_cmd
      FROM information_schema.columns cols
      JOIN pg_type t ON cols.udt_name = t.typname
      WHERE t.typname = 'activity_type_enum'
    ) LOOP
      EXECUTE r.alter_cmd;
    END LOOP;
    
    -- Now we can safely drop the type
    DROP TYPE IF EXISTS activity_type_enum;
  END IF;
  
  RAISE NOTICE 'activity_type_enum has been completely removed';
END
$$;
