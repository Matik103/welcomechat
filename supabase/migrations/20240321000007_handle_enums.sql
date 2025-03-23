DO $$
BEGIN
  -- Handle app_role enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'manager', 'client');
  END IF;

  -- Handle client_status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
    CREATE TYPE client_status AS ENUM ('active', 'inactive');
  END IF;

  -- Handle invitation_status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');
  END IF;

  -- Handle role_type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
    CREATE TYPE role_type AS ENUM ('admin', 'client');
  END IF;

  -- Handle source_type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
    CREATE TYPE source_type AS ENUM ('google_drive', 'website');
  END IF;

  -- Handle user_role enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
  END IF;
END $$; 