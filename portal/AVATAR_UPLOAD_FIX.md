# Avatar Upload Fix Guide

## Problem
Profile pictures (avatars) are not saving even though environment variables are set in Render.

## Root Cause Analysis

After reviewing the code, I've identified several potential issues:

1. **Missing Supabase Environment Variables in render.yaml**: The render.yaml file was missing Supabase configuration entries.
2. **Supabase Client Initialization**: The client may not be initializing properly if environment variables are missing.
3. **Bucket Configuration**: The Supabase bucket might not exist or have incorrect permissions.

## Solution Steps

### Step 1: Verify Environment Variables in Render

Go to your Render dashboard and ensure these environment variables are set:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=cadgroup-uploads
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy:
   - Project URL → Use for both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - Service Role Key (under Project API keys) → Use for `SUPABASE_SERVICE_ROLE`

### Step 2: Test Supabase Configuration

I've created a test endpoint. After deploying, visit:
```
https://cadgrouptools.onrender.com/api/test-supabase
```

This will show you:
- Which environment variables are configured
- Whether the Supabase client is created
- Whether the bucket exists
- Upload test results

### Step 3: Create and Configure Supabase Bucket

If the bucket doesn't exist:

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name it: `cadgroup-uploads`
4. Set it as **Public** (important for avatar URLs to work)
5. Click "Create bucket"

### Step 4: Set Bucket Permissions

In Supabase Storage:

1. Click on your `cadgroup-uploads` bucket
2. Go to "Policies" tab
3. Create a new policy with these settings:

**For Upload/Update/Delete (Authenticated users only):**
```sql
-- Policy name: Allow authenticated uploads
-- Allowed operation: INSERT, UPDATE, DELETE

(auth.role() = 'authenticated' OR auth.role() = 'service_role')
```

**For Public Read Access (Everyone):**
```sql
-- Policy name: Public read access
-- Allowed operation: SELECT

true
```

### Step 5: Debug Upload Issues

If uploads still fail, check these common issues:

1. **File Size**: Maximum file size is 5MB (enforced in code)
2. **File Type**: Only image files are allowed (enforced in code)
3. **Network Issues**: Check Render logs for timeout errors

### Step 6: Monitor Logs

In Render dashboard:
1. Go to your service
2. Click on "Logs" tab
3. Look for errors when uploading:
   - "Storage service not configured" → Environment variables missing
   - "Failed to upload avatar" → Check Supabase bucket permissions
   - Specific error messages from Supabase

## Updated Files

1. **render.yaml**: Added Supabase environment variable configuration
2. **src/app/api/test-supabase/route.ts**: Created test endpoint for debugging

## Testing Avatar Upload

After fixing the configuration:

1. Go to a client edit page: `/clients/[id]/edit`
2. Click on "Upload Photo" 
3. Select an image (< 5MB)
4. Save the client
5. Check if the avatar appears

## Alternative: Fallback to S3

If Supabase continues to have issues, you can switch to S3:

1. Set up AWS S3 bucket
2. Configure S3 environment variables in Render:
   ```
   S3_REGION=us-east-1
   S3_ACCESS_KEY_ID=your-key
   S3_SECRET_ACCESS_KEY=your-secret
   S3_BUCKET_NAME=your-bucket
   ```
3. Modify the avatar upload code to use S3 instead

## Verification Checklist

- [ ] All Supabase environment variables are set in Render
- [ ] Test endpoint `/api/test-supabase` shows all green
- [ ] Supabase bucket `cadgroup-uploads` exists
- [ ] Bucket is set to PUBLIC
- [ ] Bucket policies allow upload and public read
- [ ] Avatar upload works on a test client
- [ ] Avatar URL is saved to MongoDB
- [ ] Avatar displays correctly on client pages

## Support

If issues persist after following these steps:

1. Check Render logs for specific error messages
2. Test with the `/api/test-supabase` endpoint
3. Verify Supabase project is active and not paused
4. Check Supabase dashboard for storage usage limits