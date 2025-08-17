-- Nuclear option: Disable RLS on storage.objects
-- This will allow ALL operations to work without policy checks
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Should show rowsecurity = false