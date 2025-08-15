import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email.toLowerCase() }).lean();
  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  await connectToDatabase();
  const update: any = {
    name: body.name,
    phone: body.phone,
    department: body.department,
    position: body.position,
    joinDate: body.joinDate,
  };
  if (typeof body.avatar === 'string') {
    update.avatar = body.avatar;
  }
  const user = await User.findOneAndUpdate(
    { email: session.user.email.toLowerCase() },
    { $set: update },
    { new: true }
  ).lean();
  return NextResponse.json({ user });
}



