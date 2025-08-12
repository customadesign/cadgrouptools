'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Alert, Typography, Spin, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const { Title, Text } = Typography;

function ForgotPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setError('');
    setEmail(values.email);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <Result
            status="success"
            title="Reset Email Sent!"
            subTitle={
              <div>
                <p>We've sent a password reset link to:</p>
                <Text strong style={{ fontSize: 16 }}>{email}</Text>
                <p style={{ marginTop: 16 }}>
                  Please check your email and click the link to reset your password.
                  The link will expire in 1 hour.
                </p>
              </div>
            }
            extra={[
              <Button 
                key="signin"
                type="primary" 
                onClick={() => router.push('/auth/signin')}
              >
                Back to Sign In
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

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
            <Title level={2}>Forgot Password</Title>
            <p style={{ color: '#666' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
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
            name="forgot-password"
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
                prefix={<MailOutlined />} 
                placeholder="Email Address" 
                type="email"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
              >
                Send Reset Link
              </Button>
            </Form.Item>

            <Form.Item>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/auth/signin')}
                block
              >
                Back to Sign In
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
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
      <ForgotPasswordForm />
    </Suspense>
  );
}