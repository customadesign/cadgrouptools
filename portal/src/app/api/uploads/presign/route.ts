import { NextRequest, NextResponse } from 'next/server';
import { getS3Client, BUCKET } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, contentType } = body as { key: string; contentType: string };
  if (!process.env.S3_REGION || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !BUCKET) {
    return NextResponse.json({ error: 'S3 is not configured on server (missing envs)' }, { status: 503 });
  }
  if (!key || !contentType) {
    return NextResponse.json({ error: 'key and contentType required' }, { status: 400 });
  }

  // Enforce simple, safe keys
  if (key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    return NextResponse.json({ error: 'invalid key' }, { status: 400 });
  }

  try {
    const client = getS3Client();
    if (!client) {
      return NextResponse.json({ error: 'S3 is not configured' }, { status: 503 });
    }
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      // Optional: allow public read if your bucket policy relies on ACLs
      // Set env S3_PUBLIC_READ=true to enable. If your bucket enforces
      // bucket-owner-enforced object ownership (ACLs disabled), leave false.
      ACL: process.env.S3_PUBLIC_READ === 'true' ? 'public-read' : undefined,
    } as any);
    const url = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
    const headers: Record<string, string> = {};
    if (process.env.S3_PUBLIC_READ === 'true') {
      headers['x-amz-acl'] = 'public-read';
    }
    return NextResponse.json({ url, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


