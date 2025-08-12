'use client';

import React, { useEffect } from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Result
        status="500"
        title="500"
        subTitle="Sorry, something went wrong on our end. Please try again later."
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 40,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
        extra={[
          <Button
            type="primary"
            key="retry"
            icon={<ReloadOutlined />}
            onClick={() => reset()}
          >
            Try Again
          </Button>,
          <Button
            key="home"
            icon={<HomeOutlined />}
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>,
        ]}
      />
    </div>
  );
}