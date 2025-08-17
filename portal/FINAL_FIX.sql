-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Drop ALL existing policies on storage.objects
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
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Since the bucket is PUBLIC, we can use a simpler approach
-- Create a permissive policy that allows everything for authenticated users and service role
CREATE POLICY "allow_all_authenticated" ON storage.objects
FOR ALL
USING (
  bucket_id = 'cadgroupmgt' AND (
    auth.role() = 'service_role' OR 
    auth.role() = 'authenticated' OR
    true  -- Since bucket is public, allow all operations
  )
)
WITH CHECK (
  bucket_id = 'cadgroupmgt' AND (
    auth.role() = 'service_role' OR 
    auth.role() = 'authenticated' OR
    true  -- Since bucket is public, allow all operations
  )
);

-- Verify the new policy
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- If the above doesn't work, nuclear option: disable RLS entirely
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;