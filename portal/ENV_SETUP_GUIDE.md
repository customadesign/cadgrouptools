# Environment Variables Setup Guide

## Storage Configuration (Supabase - Recommended)

### For Local Development

1. **Create a `.env.local` file** in the portal directory:
   ```bash
   cd "Cadgroupmgt.com Internal Tools/portal"
   cp env.example .env.local
   ```

2. **Edit `.env.local`** and add your actual values:
   ```env
   # Supabase Configuration (REQUIRED for uploads)
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Service role key
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Anon key
   SUPABASE_BUCKET=cadgroup-uploads              # Your bucket name
   STORAGE_DRIVER=supabase                       # Use 'supabase' or 's3'
   
   # Database (you already have this working)
   DATABASE_URL=your-existing-mongodb-url
   
   # NextAuth (you already have this working)
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-existing-secret
   ```

### For Production (Render.com)

1. **Go to your Render Dashboard**
2. **Select your service** (cadgrouptools)
3. **Click on "Environment" tab**
4. **Add these environment variables**:

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE` | Your Supabase service role key |
   | `NEXT_PUBLIC_SUPABASE_URL` | Same as SUPABASE_URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `SUPABASE_BUCKET` | `cadgroup-uploads` (or your bucket name) |
   | `STORAGE_DRIVER` | `supabase` |

## Setting up Supabase Storage

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage**
3. **Create a new bucket**:
   - Name: `cadgroup-uploads`
   - Public bucket: ON (recommended for easier access)
   - File size limit: 10MB
   - Allowed MIME types: `image/*,application/pdf`
4. **Get your keys**:
   - Project URL: Settings → API → Project URL
   - Anon key: Settings → API → Project API keys → anon/public
   - Service role key: Settings → API → Project API keys → service_role
5. **Configure CORS** (if needed):
   - Supabase handles CORS automatically for your project URL
   - Add additional origins in Authentication → URL Configuration if needed

## Legacy: AWS S3 Configuration (Deprecated)

### Getting AWS S3 Credentials

1. **Log in to AWS Console**: https://console.aws.amazon.com/
2. **Go to IAM** (Identity and Access Management)
3. **Create a new user** or use existing:
   - Click "Users" → "Add users"
   - Give it a name like `cadgroup-s3-uploads`
   - Select "Programmatic access"
4. **Attach permissions**:
   - Either attach `AmazonS3FullAccess` policy (easier but less secure)
   - Or create a custom policy with only needed permissions (see S3_UPLOAD_TROUBLESHOOTING.md)
5. **Save the credentials**:
   - Access Key ID
   - Secret Access Key (shown only once!)

## Creating an S3 Bucket

1. **Go to S3 in AWS Console**
2. **Click "Create bucket"**
3. **Configure**:
   - Bucket name: `cadgroup-uploads` (must be globally unique)
   - Region: `us-east-1` (or your preference)
   - Uncheck "Block all public access" if you need public URLs
4. **Set CORS** (in Bucket → Permissions → CORS):
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
           "AllowedOrigins": [
               "https://cadgrouptools.onrender.com",
               "http://localhost:3000"
           ],
           "ExposeHeaders": ["ETag"],
           "MaxAgeSeconds": 3000
       }
   ]
   ```

## Testing Your Configuration

After setting up, visit: https://cadgrouptools.onrender.com/api/test-s3

You should see:
```json
{
  "configured": {
    "region": true,
    "accessKey": true,
    "secretKey": true,
    "bucket": true
  },
  "values": {
    "region": "us-east-1",
    "bucket": "cadgroup-uploads"
  }
}
```

If any value shows `false`, that environment variable is missing.
