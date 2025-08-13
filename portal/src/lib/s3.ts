import { S3Client } from '@aws-sdk/client-s3';

const REGION = process.env.S3_REGION;
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const ENDPOINT = process.env.S3_ENDPOINT; // optional for S3-compatible
export const BUCKET = process.env.S3_BUCKET_NAME as string | undefined;

export function getS3Client(): S3Client | null {
  // Return null if S3 is not configured (optional feature)
  if (!REGION || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET) {
    return null;
  }
  return new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    forcePathStyle: Boolean(ENDPOINT), // many S3-compatible providers need this
    credentials: {
      accessKeyId: ACCESS_KEY_ID!,
      secretAccessKey: SECRET_ACCESS_KEY!,
    },
  });
}

export function buildPublicUrl(key: string): string {
  if (!BUCKET || !REGION) {
    throw new Error('S3 is not configured');
  }
  if (ENDPOINT) {
    const base = ENDPOINT.replace(/\/$/, '');
    // path-style assumed when custom endpoint provided
    return `${base}/${BUCKET}/${encodeURIComponent(key)}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key)}`;
}


