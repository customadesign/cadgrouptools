import { S3Client } from '@aws-sdk/client-s3';

const REGION = process.env.S3_REGION;
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const ENDPOINT = process.env.S3_ENDPOINT; // optional for S3-compatible
export const BUCKET = process.env.S3_BUCKET_NAME as string | undefined;

if (!REGION) throw new Error('Missing S3_REGION');
if (!ACCESS_KEY_ID) throw new Error('Missing S3_ACCESS_KEY_ID');
if (!SECRET_ACCESS_KEY) throw new Error('Missing S3_SECRET_ACCESS_KEY');
if (!BUCKET) throw new Error('Missing S3_BUCKET_NAME');

export function getS3Client(): S3Client {
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
  if (ENDPOINT) {
    const base = ENDPOINT.replace(/\/$/, '');
    // path-style assumed when custom endpoint provided
    return `${base}/${BUCKET}/${key}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}


