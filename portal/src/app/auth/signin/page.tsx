'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Card, Alert, Typography, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const { Title } = Typography;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 300, height: 300, margin: '0 auto -50px auto' }}>
          <DotLottieReact
            src="https://lottie.host/fcbdc283-b587-4121-9559-d00108d5b5f3/i4iQt5jVEf.lottie"
            loop
            autoplay
          />
        </div>
        <Card style={{ width: 400, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2}>CADGroup Tools Portal</Title>
            <p style={{ color: '#666' }}>Sign in to your account</p>
          </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          name="signin"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
              type="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="/auth/forgot-password" style={{ color: '#1677ff', display: 'block', marginBottom: 8 }}>
              Forgot your password?
            </a>
            <a href="/auth/register" style={{ color: '#1677ff' }}>
              Don't have an account? Register
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Spin size="large" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}