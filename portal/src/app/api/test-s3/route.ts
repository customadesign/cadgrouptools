import { NextResponse } from 'next/server';
import { getS3Client, BUCKET } from '@/lib/s3';

export async function GET() {
  // Check which environment variables are set
  const config = {
    region: !!process.env.S3_REGION,
    accessKey: !!process.env.S3_ACCESS_KEY_ID,
    secretKey: !!process.env.S3_SECRET_ACCESS_KEY,
    bucket: !!process.env.S3_BUCKET_NAME,
    endpoint: !!process.env.S3_ENDPOINT,
    publicRead: process.env.S3_PUBLIC_READ,
  };

  // Try to create S3 client
  let clientStatus = 'not attempted';
  try {
    const client = getS3Client();
    clientStatus = client ? 'created successfully' : 'failed - missing config';
  } catch (error) {
    clientStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`;
  }

  return NextResponse.json({
    configured: config,
    allConfigured: Object.values(config).slice(0, 4).every(v => v === true),
    values: {
      region: process.env.S3_REGION || 'NOT SET',
      bucket: process.env.S3_BUCKET_NAME || 'NOT SET',
      endpoint: process.env.S3_ENDPOINT || 'default (AWS)',
      publicRead: process.env.S3_PUBLIC_READ || 'false',
    },
    clientStatus,
    bucketFromLib: BUCKET || 'NOT SET',
  });
}
