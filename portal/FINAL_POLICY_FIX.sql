-- This should work if run with proper permissions
-- Try running this in the Supabase SQL Editor

-- First check current auth settings
SELECT current_setting('request.jwt.claims', true)::json->>'role' as current_role;

-- Create a permissive policy that explicitly allows service_role
CREATE POLICY "service_role_bypass_all" ON storage.objects
AS PERMISSIVE
FOR ALL
TO authenticated, anon, service_role
USING (
  bucket_id = 'cadgroupmgt' AND 
  (
    auth.role() = 'service_role' OR
    (auth.jwt() ->> 'role') = 'service_role'
  )
)
WITH CHECK (
  bucket_id = 'cadgroupmgt' AND 
  (
    auth.role() = 'service_role' OR
    (auth.jwt() ->> 'role') = 'service_role'
  )
);

-- Alternative: If the above doesn't work, try this simpler version
CREATE POLICY "allow_service_role_everything" ON storage.objects
FOR ALL
USING (bucket_id = 'cadgroupmgt' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'cadgroupmgt');