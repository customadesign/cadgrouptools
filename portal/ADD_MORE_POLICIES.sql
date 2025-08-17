-- Add comprehensive policies for service_role
-- Run these in Supabase SQL Editor

-- 1. Allow service role to SELECT (needed to check if file exists)
CREATE POLICY "Service role can view" ON storage.objects 
FOR SELECT TO service_role 
USING (bucket_id = 'cadgroupmgt');

-- 2. Allow service role to INSERT (for uploads)
CREATE POLICY "Service role can upload" ON storage.objects 
FOR INSERT TO service_role 
WITH CHECK (bucket_id = 'cadgroupmgt');

-- 3. Allow service role to UPDATE
CREATE POLICY "Service role can update" ON storage.objects 
FOR UPDATE TO service_role 
USING (bucket_id = 'cadgroupmgt')
WITH CHECK (bucket_id = 'cadgroupmgt');

-- 4. Check what policies exist now
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND bucket_id = 'cadgroupmgt';