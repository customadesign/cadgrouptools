import { NextRequest, NextResponse } from 'next/server';
import { getS3Client, BUCKET } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, contentType } = body as { key: string; contentType: string };
  if (!key || !contentType) {
    return NextResponse.json({ error: 'key and contentType required' }, { status: 400 });
  }

  try {
    const client = getS3Client();
    if (!client) {
      return NextResponse.json({ error: 'S3 is not configured' }, { status: 503 });
    }
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


