-- Delete the incorrect policies that use "TO public"
DROP POLICY IF EXISTS "Service role full control cjbrwh_0" ON storage.objects;
DROP POLICY IF EXISTS "Service role full control cjbrwh_1" ON storage.objects;
DROP POLICY IF EXISTS "Delete Uploads cjbrwh_0" ON storage.objects;

-- Create the CORRECT policies with "TO service_role"
CREATE POLICY "Service role SELECT" ON storage.objects 
FOR SELECT 
TO service_role 
USING (bucket_id = 'cadgroupmgt');

CREATE POLICY "Service role INSERT" ON storage.objects 
FOR INSERT 
TO service_role 
WITH CHECK (bucket_id = 'cadgroupmgt');

CREATE POLICY "Service role UPDATE" ON storage.objects 
FOR UPDATE 
TO service_role 
USING (bucket_id = 'cadgroupmgt')
WITH CHECK (bucket_id = 'cadgroupmgt');

CREATE POLICY "Service role DELETE" ON storage.objects 
FOR DELETE 
TO service_role 
USING (bucket_id = 'cadgroupmgt');

-- Verify the policies are correctly set
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND 'service_role' = ANY(roles);