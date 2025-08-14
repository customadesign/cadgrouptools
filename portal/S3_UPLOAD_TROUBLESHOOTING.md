# S3 Upload Troubleshooting Guide

## Required Environment Variables

The S3 upload functionality requires the following environment variables to be set:

```env
# S3 Configuration (Required)
S3_REGION=us-east-1                    # Your AWS region
S3_ACCESS_KEY_ID=your_access_key       # Your AWS access key
S3_SECRET_ACCESS_KEY=your_secret_key   # Your AWS secret key
S3_BUCKET_NAME=your_bucket_name        # Your S3 bucket name

# Optional S3 Configuration
S3_ENDPOINT=                           # Only needed for S3-compatible services (not AWS)
S3_PUBLIC_READ=false                   # Set to 'true' if you want public-read ACL
```

## Common Issues and Solutions

### 1. "S3 is not configured on server (missing envs)" Error

This error occurs when one or more required environment variables are missing. Check your deployment platform (Render) and ensure all the S3 variables are set.

### 2. CORS Configuration

Your S3 bucket needs proper CORS configuration. Add this to your bucket's CORS settings:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["https://cadgrouptools.onrender.com", "http://localhost:3000"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

### 3. Bucket Policy

Ensure your S3 bucket policy allows the necessary operations. Example policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowUploads",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
            },
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

### 4. IAM User Permissions

Your IAM user needs these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR_BUCKET_NAME",
                "arn:aws:s3:::YOUR_BUCKET_NAME/*"
            ]
        }
    ]
}
```

## Debugging Steps

1. **Check Browser Console**: Open DevTools (F12) and check for errors when uploading
2. **Check Network Tab**: Look for failed requests to `/api/uploads/presign`
3. **Check Render Logs**: Look for server-side errors in your Render deployment logs

## Testing S3 Configuration

To test if S3 is properly configured, you can add this temporary debug endpoint:

```typescript
// app/api/test-s3/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    configured: {
      region: !!process.env.S3_REGION,
      accessKey: !!process.env.S3_ACCESS_KEY_ID,
      secretKey: !!process.env.S3_SECRET_ACCESS_KEY,
      bucket: !!process.env.S3_BUCKET_NAME,
    },
    values: {
      region: process.env.S3_REGION || 'NOT SET',
      bucket: process.env.S3_BUCKET_NAME || 'NOT SET',
      // Don't expose keys
    }
  });
}
```

Then visit `/api/test-s3` to see what's configured.

## Quick Fix Steps

1. **On Render.com**:
   - Go to your service dashboard
   - Click on "Environment" tab
   - Add all required S3 variables
   - Save and let the service redeploy

2. **For Local Development**:
   - Create a `.env.local` file in the portal directory
   - Add all the S3 configuration variables
   - Restart your development server

3. **ACL Issues**:
   - If you get ACL-related errors, set `S3_PUBLIC_READ=false`
   - Modern S3 buckets often have ACLs disabled by default
