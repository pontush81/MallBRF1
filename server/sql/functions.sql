-- Function to check if a schema exists
CREATE OR REPLACE FUNCTION check_schema_exists(schema_name text)
RETURNS TABLE (found_schema text) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT n.nspname::text
  FROM pg_catalog.pg_namespace n
  WHERE n.nspname = schema_name;
END;
$$ LANGUAGE plpgsql;

-- Function to create staging schema
CREATE OR REPLACE FUNCTION create_staging_schema()
RETURNS void SECURITY DEFINER AS $$
BEGIN
  CREATE SCHEMA IF NOT EXISTS staging;
  -- Grant permissions to authenticated users
  GRANT USAGE ON SCHEMA staging TO authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA staging TO authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA staging GRANT ALL ON TABLES TO authenticated;
END;
$$ LANGUAGE plpgsql;

-- Function to copy tables to staging
CREATE OR REPLACE FUNCTION copy_tables_to_staging()
RETURNS void SECURITY DEFINER AS $$
BEGIN
  -- Copy pages table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pages') THEN
    CREATE TABLE IF NOT EXISTS staging.pages (LIKE public.pages INCLUDING ALL);
    GRANT ALL ON staging.pages TO authenticated;
  END IF;

  -- Copy bookings table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    CREATE TABLE IF NOT EXISTS staging.bookings (LIKE public.bookings INCLUDING ALL);
    GRANT ALL ON staging.bookings TO authenticated;
  END IF;

  -- Copy users table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE TABLE IF NOT EXISTS staging.users (LIKE public.users INCLUDING ALL);
    GRANT ALL ON staging.users TO authenticated;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create pages table
CREATE OR REPLACE FUNCTION create_pages_table(schema text)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.pages (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            slug TEXT NOT NULL,
            ispublished BOOLEAN NOT NULL,
            show BOOLEAN NOT NULL,
            createdat TEXT NOT NULL,
            updatedat TEXT NOT NULL,
            files TEXT
        );
        
        -- Grant permissions
        GRANT ALL ON %I.pages TO authenticated;
        GRANT USAGE ON SCHEMA %I TO authenticated;
        
        -- Set default privileges
        ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO authenticated;
    ', schema, schema, schema, schema);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create bookings table
CREATE OR REPLACE FUNCTION create_bookings_table(schema text)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.bookings (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            page_id INTEGER NOT NULL,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            status TEXT NOT NULL DEFAULT ''pending'',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES auth.users(id),
            FOREIGN KEY (page_id) REFERENCES %I.pages(id)
        );
        
        -- Grant permissions
        GRANT ALL ON %I.bookings TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE %I.bookings_id_seq TO authenticated;
        GRANT USAGE ON SCHEMA %I TO authenticated;
        
        -- Set default privileges
        ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
    ', schema, schema, schema, schema, schema, schema, schema, schema);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create users table
CREATE OR REPLACE FUNCTION create_users_table(schema text)
RETURNS void SECURITY DEFINER AS $$
BEGIN
  -- Create the users table if it doesn't exist
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TEXT NOT NULL,
      lastLogin TEXT
    )', schema);
  
  -- Grant all permissions on users table to authenticated role
  EXECUTE format('GRANT ALL ON %I.users TO authenticated', schema);
  
  -- Grant usage on the sequence if one exists (for auto-incrementing IDs)
  EXECUTE format('GRANT USAGE ON ALL SEQUENCES IN SCHEMA %I TO authenticated', schema);
  
  -- Set default privileges for future tables in this schema
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO authenticated', schema);
  
  -- Grant permissions on the schema itself
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_schema_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_staging_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION copy_tables_to_staging() TO authenticated;
GRANT EXECUTE ON FUNCTION create_pages_table(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_bookings_table(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_users_table(text) TO authenticated; 