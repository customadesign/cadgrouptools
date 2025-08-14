import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Client } from '@/models/Client';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';

// POST /api/clients/[id]/avatar - Upload avatar for a client
export const POST = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Storage service not configured' },
        { status: 503 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if client exists
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Delete old avatar if exists
    if (client.avatar) {
      try {
        const oldPath = client.avatar.split('/').pop();
        if (oldPath) {
          await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([`avatars/${oldPath}`]);
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Continue anyway
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/client-${id}-${timestamp}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    // Update client with new avatar URL
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { avatar: avatarUrl },
      { new: true }
    );

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
      client: updatedClient,
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
});

// DELETE /api/clients/[id]/avatar - Delete avatar for a client
export const DELETE = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Storage service not configured' },
        { status: 503 }
      );
    }

    await connectToDatabase();

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (!client.avatar) {
      return NextResponse.json(
        { error: 'Client has no avatar' },
        { status: 400 }
      );
    }

    // Extract file path from URL
    const filePath = client.avatar.split('/').pop();
    if (filePath) {
      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([`avatars/${filePath}`]);
      
      if (error) {
        console.error('Error deleting avatar from storage:', error);
      }
    }

    // Remove avatar from client
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { $unset: { avatar: 1 } },
      { new: true }
    );

    return NextResponse.json({
      message: 'Avatar deleted successfully',
      client: updatedClient,
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
});