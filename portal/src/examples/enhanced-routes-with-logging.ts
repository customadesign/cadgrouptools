/**
 * Example implementations showing how to integrate activity logging
 * into existing API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Client } from '@/models/Client';
import { withStatelessAuth } from '@/lib/auth-stateless';
import { withActivityLogging, contextExtractors } from '@/utils/withActivityLogging';
import { activityLogger } from '@/services/activityLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

/**
 * Example 1: Simple GET route with automatic logging
 */
export const enhancedGetClients = withStatelessAuth(
  withActivityLogging(
    async (request: NextRequest) => {
      await connectToDatabase();
      
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      
      const clients = await Client.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      return NextResponse.json({ clients });
    },
    contextExtractors.client
  )
);

/**
 * Example 2: POST route with detailed logging including created resource
 */
export const enhancedCreateClient = withStatelessAuth(
  async (request: NextRequest) => {
    const startTime = Date.now();
    
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      await connectToDatabase();
      
      const data = await request.json();
      const client = new Client(data);
      await client.save();
      
      // Log the activity with detailed information
      await activityLogger.logActivity(
        request,
        {
          actionType: 'create',
          resourceType: 'client',
          resourceId: client._id.toString(),
          resourceName: client.organization,
          metadata: {
            industry: client.industry,
            contactName: `${client.firstName} ${client.lastName}`
          }
        },
        {
          success: true,
          statusCode: 201,
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json(client, { status: 201 });
    } catch (error) {
      // Log the error
      await activityLogger.logActivity(
        request,
        {
          actionType: 'create',
          resourceType: 'client',
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        {
          success: false,
          statusCode: 500,
          errorMessage: error instanceof Error ? error.message : 'Failed to create client',
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }
  }
);

/**
 * Example 3: UPDATE route with before/after change tracking
 */
export const enhancedUpdateClient = withStatelessAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const startTime = Date.now();
    
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      await connectToDatabase();
      
      const { id } = params;
      const updates = await request.json();
      
      // Get the original document for change tracking
      const originalClient = await Client.findById(id).lean();
      
      if (!originalClient) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      
      // Update the client
      const updatedClient = await Client.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      // Log with before/after changes
      await activityLogger.logActivity(
        request,
        {
          actionType: 'update',
          resourceType: 'client',
          resourceId: id,
          resourceName: updatedClient?.organization,
          changes: {
            before: originalClient,
            after: updatedClient?.toObject()
          },
          metadata: {
            fieldsUpdated: Object.keys(updates)
          }
        },
        {
          success: true,
          statusCode: 200,
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json(updatedClient);
    } catch (error) {
      await activityLogger.logActivity(
        request,
        {
          actionType: 'update',
          resourceType: 'client',
          resourceId: params.id
        },
        {
          success: false,
          statusCode: 500,
          errorMessage: error instanceof Error ? error.message : 'Failed to update client',
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 }
      );
    }
  }
);

/**
 * Example 4: DELETE route with soft delete tracking
 */
export const enhancedDeleteClient = withStatelessAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const startTime = Date.now();
    
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      await connectToDatabase();
      
      const { id } = params;
      
      // Get client details before deletion
      const client = await Client.findById(id);
      
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      
      // Perform deletion
      await Client.findByIdAndDelete(id);
      
      // Log the deletion with full details
      await activityLogger.logActivity(
        request,
        {
          actionType: 'delete',
          resourceType: 'client',
          resourceId: id,
          resourceName: client.organization,
          metadata: {
            deletedData: client.toObject(),
            permanentDelete: true
          }
        },
        {
          success: true,
          statusCode: 200,
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json({ message: 'Client deleted successfully' });
    } catch (error) {
      await activityLogger.logActivity(
        request,
        {
          actionType: 'delete',
          resourceType: 'client',
          resourceId: params.id
        },
        {
          success: false,
          statusCode: 500,
          errorMessage: error instanceof Error ? error.message : 'Failed to delete client',
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json(
        { error: 'Failed to delete client' },
        { status: 500 }
      );
    }
  }
);

/**
 * Example 5: Bulk operation with detailed logging
 */
export const enhancedBulkImportClients = withStatelessAuth(
  async (request: NextRequest) => {
    const startTime = Date.now();
    
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      await connectToDatabase();
      
      const { clients } = await request.json();
      
      const results = {
        successful: [] as any[],
        failed: [] as any[]
      };
      
      // Process each client
      for (const clientData of clients) {
        try {
          const client = new Client(clientData);
          await client.save();
          results.successful.push({
            id: client._id,
            organization: client.organization
          });
        } catch (error) {
          results.failed.push({
            data: clientData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Log the bulk operation
      await activityLogger.logActivity(
        request,
        {
          actionType: 'import',
          resourceType: 'client',
          metadata: {
            totalProcessed: clients.length,
            successCount: results.successful.length,
            failureCount: results.failed.length,
            successfulIds: results.successful.map(c => c.id),
            failedRecords: results.failed
          }
        },
        {
          success: results.failed.length === 0,
          statusCode: results.failed.length === 0 ? 200 : 207, // 207 Multi-Status
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json({
        message: `Imported ${results.successful.length} clients successfully`,
        results
      });
    } catch (error) {
      await activityLogger.logActivity(
        request,
        {
          actionType: 'import',
          resourceType: 'client'
        },
        {
          success: false,
          statusCode: 500,
          errorMessage: error instanceof Error ? error.message : 'Bulk import failed',
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json(
        { error: 'Bulk import failed' },
        { status: 500 }
      );
    }
  }
);

/**
 * Example 6: File upload with detailed logging
 */
export const enhancedFileUpload = withStatelessAuth(
  async (request: NextRequest) => {
    const startTime = Date.now();
    
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      
      // Process file upload (simplified example)
      const fileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      };
      
      // Log file upload activity
      await activityLogger.logActivity(
        request,
        {
          actionType: 'upload',
          resourceType: 'file',
          resourceName: file.name,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            sizeMB: (file.size / 1024 / 1024).toFixed(2)
          }
        },
        {
          success: true,
          statusCode: 201,
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json({
        message: 'File uploaded successfully',
        file: fileMetadata
      }, { status: 201 });
    } catch (error) {
      await activityLogger.logActivity(
        request,
        {
          actionType: 'upload',
          resourceType: 'file'
        },
        {
          success: false,
          statusCode: 500,
          errorMessage: error instanceof Error ? error.message : 'File upload failed',
          responseTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json(
        { error: 'File upload failed' },
        { status: 500 }
      );
    }
  }
);