-- Create a universal policy that checks role at runtime
CREATE POLICY "universal_service_role" ON storage.objects
AS PERMISSIVE
FOR ALL
USING (
  bucket_id = 'cadgroupmgt' AND 
  (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' OR
    auth.role() = 'service_role' OR
    (auth.jwt() ->> 'role') = 'service_role'
  )
)
WITH CHECK (
  bucket_id = 'cadgroupmgt' AND 
  (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' OR
    auth.role() = 'service_role' OR
    (auth.jwt() ->> 'role') = 'service_role'
  )
);

-- Also try creating policies for authenticated users (service_role is authenticated)
CREATE POLICY "authenticated_all" ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'cadgroupmgt')
WITH CHECK (bucket_id = 'cadgroupmgt');

-- Check what exists
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';