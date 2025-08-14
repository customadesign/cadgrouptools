import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, contentType } = body as { key: string; contentType: string };
  
  // Check if we should use S3 or Supabase
  const storageDriver = process.env.STORAGE_DRIVER || 'supabase';
  
  if (storageDriver === 's3') {
    // Legacy S3 implementation (commented out for now)
    return NextResponse.json({ error: 'S3 storage is deprecated, please use Supabase' }, { status: 503 });
  }

  // Supabase implementation
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE || !STORAGE_BUCKET) {
    return NextResponse.json({ error: 'Supabase is not configured on server (missing envs)' }, { status: 503 });
  }
  
  if (!key || !contentType) {
    return NextResponse.json({ error: 'key and contentType required' }, { status: 400 });
  }

  // Enforce simple, safe keys
  if (key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    return NextResponse.json({ error: 'invalid key' }, { status: 400 });
  }

  try {
    // Create a signed upload URL
    const { data, error } = await supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(key, 60 * 5); // 5 minutes expiry

    if (error) {
      console.error('Supabase upload URL error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the public URL if bucket is public
    const { data: publicData } = supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(key);

    return NextResponse.json({
      path: data.path,
      token: data.token,
      publicUrl: publicData?.publicUrl || null,
      // For S3 compatibility
      url: `${process.env.SUPABASE_URL}/storage/v1/upload/resumable?token=${data.token}`,
      headers: {}
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Presign error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


