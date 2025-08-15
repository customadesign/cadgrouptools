'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Alert, Spin } from 'antd';
import { LockOutlined } from '@ant-design/icons';

interface AdminGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AdminGuard({ children, redirectTo = '/dashboard' }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
    } else if (session.user?.role !== 'admin') {
      router.push(redirectTo);
    }
  }, [session, status, router, redirectTo]);

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Alert
          message="Authentication Required"
          description="Please sign in to access this page."
          type="warning"
          showIcon
          icon={<LockOutlined />}
        />
      </div>
    );
  }

  if (session.user?.role !== 'admin') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Alert
          message="Access Denied"
          description="You need administrator privileges to access this page."
          type="error"
          showIcon
          icon={<LockOutlined />}
        />
      </div>
    );
  }

  return <>{children}</>;
}
