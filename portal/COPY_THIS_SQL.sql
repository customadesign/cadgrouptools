-- Remove conflicting policies
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2" ON storage.objects;

-- Grant service role full access
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the policy was created
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND 'service_role' = ANY(roles);