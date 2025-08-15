# URGENT: Fix Supabase Configuration

## The Problem
Your avatar uploads are failing because the SUPABASE_URL is set to a PostgreSQL database URL instead of the Supabase API URL.

## Current (WRONG) Configuration
```
SUPABASE_URL=postgresql://postgres:FkTIsrH5zOKCqKvf@db.cpoeuapfcbwymoftfmsf.supabase.co:5432/postgres
```

## Correct Configuration
```
SUPABASE_URL=https://cpoeuapfcbwymoftfmsf.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://cpoeuapfcbwymoftfmsf.supabase.co
```

## Steps to Fix

### 1. Update Environment Variables in Render

Go to [Render Dashboard](https://dashboard.render.com) → Your Service → Environment tab

Update these variables:
```
SUPABASE_URL=https://cpoeuapfcbwymoftfmsf.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://cpoeuapfcbwymoftfmsf.supabase.co
SUPABASE_SERVICE_ROLE=[Keep your current value]
SUPABASE_BUCKET=cadgroupmgt
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Keep your current value]
```

### 2. Create Storage Bucket in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Storage** → **Buckets**
4. Create a new bucket:
   - Name: `cadgroupmgt`
   - Public: **Yes** (toggle ON)
   - Click "Create bucket"

### 3. Set Bucket Policies (Optional but Recommended)

In Supabase SQL Editor, run:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
USING (bucket_id = 'cadgroupmgt');

-- Allow public to view avatars
CREATE POLICY "Allow public to view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'cadgroupmgt');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'cadgroupmgt');
```

### 4. Wait for Render to Redeploy

After saving the environment variables, Render will automatically redeploy your app.

### 5. Test the Configuration

Visit: https://cadgrouptools.onrender.com/api/test-supabase

You should see:
```json
{
  "envVariables": {
    "SUPABASE_URL": true,
    "SUPABASE_SERVICE_ROLE": true,
    "SUPABASE_BUCKET": true,
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true
  },
  "allEnvConfigured": true,
  "supabaseClient": "created",
  "bucketName": "cadgroupmgt",
  "bucketsStatus": "found 1 buckets",
  "targetBucketExists": true,
  "uploadTestStatus": "upload successful"
}
```

## Understanding the URLs

### PostgreSQL URL (Database Direct Access)
- Format: `postgresql://username:password@host:port/database`
- Used for: Direct database connections
- Example: `postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres`
- **NOT FOR STORAGE/API**

### Supabase API URL (REST API & Storage)
- Format: `https://[project-id].supabase.co`
- Used for: Storage, Authentication, REST API
- Example: `https://cpoeuapfcbwymoftfmsf.supabase.co`
- **THIS IS WHAT YOU NEED**

## Quick Test After Fixing

Try uploading an avatar:
1. Go to https://cadgrouptools.onrender.com/clients
2. Edit any client
3. Upload a profile picture
4. It should work!

## Still Not Working?

Check these:
1. Is the bucket name exactly `cadgroupmgt`?
2. Is the bucket set to PUBLIC?
3. Did you use the SERVICE_ROLE key (not the ANON key)?
4. Did Render finish redeploying after you changed the variables?

## Getting Your Correct URLs from Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL → Use for SUPABASE_URL
   - Service Role Key → Use for SUPABASE_SERVICE_ROLE
   - Anon Key → Use for NEXT_PUBLIC_SUPABASE_ANON_KEY