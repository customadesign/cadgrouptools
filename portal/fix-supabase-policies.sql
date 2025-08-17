-- Fix Supabase Storage Policies for File Deletion
-- Run this in your Supabase SQL Editor

-- First, check existing policies on the storage.objects table
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop any existing policies that might interfere (optional - be careful)
-- DROP POLICY IF EXISTS "Service role can do everything" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can view" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create comprehensive policies for the service role
-- This ensures the service role can perform ALL operations
CREATE POLICY "Service role bypass" ON storage.objects
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Alternative: If you want more granular control
-- Allow service role to SELECT (view) all files
CREATE POLICY "Service role can view all files" ON storage.objects
FOR SELECT 
USING (auth.role() = 'service_role');

-- Allow service role to INSERT (upload) files
CREATE POLICY "Service role can upload files" ON storage.objects
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to DELETE files
CREATE POLICY "Service role can delete files" ON storage.objects
FOR DELETE 
USING (auth.role() = 'service_role');

-- Allow service role to UPDATE files
CREATE POLICY "Service role can update files" ON storage.objects
FOR UPDATE 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Check the bucket configuration
SELECT * FROM storage.buckets WHERE name = 'cadgroupmgt';

-- Make sure the bucket is configured correctly
UPDATE storage.buckets 
SET 
  public = false, -- Set to false for security
  file_size_limit = 10485760, -- 10MB limit
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff']
WHERE name = 'cadgroupmgt';

-- Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;