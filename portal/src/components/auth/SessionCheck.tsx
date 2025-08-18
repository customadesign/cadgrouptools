'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spin, Result } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface SessionCheckProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff';
  redirectTo?: string;
}

export default function SessionCheck({ 
  children, 
  requiredRole,
  redirectTo = '/auth/signin'
}: SessionCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Debug logging
    console.log('[SessionCheck] Status:', status, 'Session:', session?.user?.email);
    
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session) {
      console.log('[SessionCheck] Not authenticated, redirecting to signin');
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
      return;
    }
    
    // Check role requirement
    if (requiredRole && session.user?.role !== requiredRole) {
      console.log('[SessionCheck] Insufficient permissions:', session.user?.role, 'required:', requiredRole);
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router, requiredRole, redirectTo]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
          tip="Checking authentication..."
        />
      </div>
    );
  }

  // Show error state if not authenticated
  if (status === 'unauthenticated' || !session) {
    return (
      <Result
        status="403"
        title="Authentication Required"
        subTitle="Please sign in to access this page."
        extra={
          <a href="/auth/signin" style={{ textDecoration: 'none' }}>
            Sign In
          </a>
        }
      />
    );
  }

  // Check role permissions
  if (requiredRole && session.user?.role !== requiredRole) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="You don't have permission to access this page."
        extra={
          <a href="/dashboard" style={{ textDecoration: 'none' }}>
            Go to Dashboard
          </a>
        }
      />
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}