-- Fix policies to work with nested paths like statements/2025/1/file.pdf
-- The issue is that the policies need to handle the full path

-- Drop existing service role policies
DROP POLICY IF EXISTS "Service role SELECT" ON storage.objects;
DROP POLICY IF EXISTS "Service role INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Service role UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Service role DELETE" ON storage.objects;

-- Create new policies that work with any path in the bucket
CREATE POLICY "service_role_select_all" ON storage.objects 
FOR SELECT 
TO service_role 
USING (bucket_id = 'cadgroupmgt');

CREATE POLICY "service_role_insert_all" ON storage.objects 
FOR INSERT 
TO service_role 
WITH CHECK (bucket_id = 'cadgroupmgt');

CREATE POLICY "service_role_update_all" ON storage.objects 
FOR UPDATE 
TO service_role 
USING (bucket_id = 'cadgroupmgt')
WITH CHECK (bucket_id = 'cadgroupmgt');

CREATE POLICY "service_role_delete_all" ON storage.objects 
FOR DELETE 
TO service_role 
USING (bucket_id = 'cadgroupmgt');

-- Also create a catch-all policy for service_role
CREATE POLICY "service_role_all_operations" ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'cadgroupmgt')
WITH CHECK (bucket_id = 'cadgroupmgt');

-- Verify
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND 'service_role' = ANY(roles);