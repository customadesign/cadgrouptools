-- URGENT: Run this in Supabase SQL Editor to fix file deletion
-- Go to: https://app.supabase.com/project/cpoeuapfcbwymoftfmsf/sql/new

-- Step 1: Remove any conflicting policies
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2" ON storage.objects;

-- Step 2: Create a policy that allows the service role to do EVERYTHING
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Step 3: Verify the policy was created
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND 'service_role' = ANY(roles);

-- You should see:
-- "Service role full access" | "ALL" | {service_role}

-- That's it! Your deletion should work now.