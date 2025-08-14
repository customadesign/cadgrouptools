import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { action, userIds } = body;
    
    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ 
        error: 'Action and userIds array are required' 
      }, { status: 400 });
    }
    
    await connectToDatabase();
    
    let updateQuery = {};
    
    switch (action) {
      case 'activate':
        updateQuery = { status: 'active' };
        break;
      case 'deactivate':
        updateQuery = { status: 'inactive' };
        break;
      case 'suspend':
        updateQuery = { status: 'suspended' };
        break;
      case 'delete':
        // Prevent admin from deleting themselves
        const filteredIds = userIds.filter(id => id !== session.user.id);
        const deleteResult = await User.deleteMany({ _id: { $in: filteredIds } });
        return NextResponse.json({ 
          message: `${deleteResult.deletedCount} users deleted successfully`,
          deletedCount: deleteResult.deletedCount
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Prevent admin from modifying their own status
    const filteredIds = userIds.filter(id => id !== session.user.id);
    
    const result = await User.updateMany(
      { _id: { $in: filteredIds } },
      { $set: updateQuery }
    );
    
    return NextResponse.json({ 
      message: `${result.modifiedCount} users updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
}