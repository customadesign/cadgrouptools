-- First, drop ALL policies to start fresh
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Create a single, simple policy that allows service_role to do everything
CREATE POLICY "service_role_bypass" ON storage.objects
FOR ALL
USING (
  auth.role() = 'service_role' OR
  (auth.jwt() ->> 'role')::text = 'service_role'
);

-- Check what we created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';