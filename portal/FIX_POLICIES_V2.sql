-- First, let's see what policies currently exist
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Create a new policy for service_role (different name to avoid conflicts)
CREATE POLICY "service_role_bypass_all" ON storage.objects
AS PERMISSIVE
FOR ALL
TO authenticated, service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Alternative approach: Create individual policies for each operation
CREATE POLICY "service_role_select" ON storage.objects AS PERMISSIVE FOR SELECT TO service_role USING (true);
CREATE POLICY "service_role_insert" ON storage.objects AS PERMISSIVE FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_role_update" ON storage.objects AS PERMISSIVE FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_delete" ON storage.objects AS PERMISSIVE FOR DELETE TO service_role USING (true);

-- Now check if the policies were created
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND 'service_role' = ANY(roles);