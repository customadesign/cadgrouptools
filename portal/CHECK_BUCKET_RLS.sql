-- Check if RLS is enabled on the bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'cadgroupmgt';

-- Check if RLS is enabled on storage.objects table
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- If RLS is enabled, we need to disable it for service_role to work
-- Option 1: Disable RLS entirely (not recommended for production)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a bypass policy for service_role
-- First drop all existing policies for a clean slate
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

-- Create a single, simple policy that allows service_role to bypass RLS
CREATE POLICY "service_role_bypass" ON storage.objects
FOR ALL
USING (
  auth.role() = 'service_role' OR
  auth.uid() IS NOT NULL  -- Also allow authenticated users for normal operations
);

-- Verify the policy
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';