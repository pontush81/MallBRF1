-- Create a function to execute dynamic SQL
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Execute the SQL and return the result
  RETURN (SELECT json_agg(row_to_json(t)) FROM (EXECUTE sql) t);
END;
$$; 