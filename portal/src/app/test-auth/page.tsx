'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space, Divider, Result, Tag } from 'antd';
import { LockOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTest = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    setDebugResult(null);

    try {
      // Test the debug endpoint
      const response = await fetch('/api/auth/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      setDebugResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to test authentication');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Title level={2}>Authentication Test Page</Title>
          <Paragraph>
            This page tests the authentication setup without actually logging you in.
            Enter your credentials below to verify everything is configured correctly.
          </Paragraph>

          <Divider />

          <Form
            layout="vertical"
            onFinish={handleTest}
            initialValues={{
              email: 'hpmurphy@icloud.com',
              password: 'B5tccpbx',
            }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Please enter email' }]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Email"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                block
              >
                Test Authentication
              </Button>
            </Form.Item>
          </Form>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {debugResult && (
            <>
              <Divider />
              <Title level={4}>Test Results</Title>
              
              {/* Environment Check */}
              <Card size="small" title="Environment Variables" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    {getStatusIcon(debugResult.environment?.MONGODB_URI)}
                    <Text strong> MONGODB_URI: </Text>
                    <Tag color={debugResult.environment?.MONGODB_URI ? 'green' : 'red'}>
                      {debugResult.environment?.MONGODB_URI ? 'SET' : 'NOT SET'}
                    </Tag>
                  </div>
                  <div>
                    {getStatusIcon(debugResult.environment?.NEXTAUTH_SECRET)}
                    <Text strong> NEXTAUTH_SECRET: </Text>
                    <Tag color={debugResult.environment?.NEXTAUTH_SECRET ? 'green' : 'red'}>
                      {debugResult.environment?.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'}
                    </Tag>
                  </div>
                  <div>
                    {getStatusIcon(!!debugResult.environment?.NEXTAUTH_URL)}
                    <Text strong> NEXTAUTH_URL: </Text>
                    <Text code>{debugResult.environment?.NEXTAUTH_URL || 'NOT SET'}</Text>
                  </div>
                  <div>
                    <Text strong> NODE_ENV: </Text>
                    <Text code>{debugResult.environment?.NODE_ENV || 'NOT SET'}</Text>
                  </div>
                </Space>
              </Card>

              {/* Database Check */}
              <Card size="small" title="Database Connection" style={{ marginBottom: 16 }}>
                <Space>
                  {getStatusIcon(debugResult.database?.connected)}
                  <Text strong>Status: </Text>
                  <Tag color={debugResult.database?.connected ? 'green' : 'red'}>
                    {debugResult.database?.connected ? 'CONNECTED' : 'FAILED'}
                  </Tag>
                </Space>
                {debugResult.database?.error && (
                  <Alert
                    message="Database Error"
                    description={debugResult.database.error}
                    type="error"
                    style={{ marginTop: 8 }}
                  />
                )}
              </Card>

              {/* Authentication Check */}
              <Card size="small" title="Authentication Test" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    {getStatusIcon(debugResult.authentication?.userFound)}
                    <Text strong> User Found: </Text>
                    <Tag color={debugResult.authentication?.userFound ? 'green' : 'red'}>
                      {debugResult.authentication?.userFound ? 'YES' : 'NO'}
                    </Tag>
                  </div>
                  {debugResult.authentication?.userDetails && (
                    <div style={{ marginLeft: 24 }}>
                      <Text type="secondary">Email: </Text>
                      <Text code>{debugResult.authentication.userDetails.email}</Text>
                      <br />
                      <Text type="secondary">Name: </Text>
                      <Text code>{debugResult.authentication.userDetails.name}</Text>
                      <br />
                      <Text type="secondary">Role: </Text>
                      <Tag>{debugResult.authentication.userDetails.role}</Tag>
                    </div>
                  )}
                  <div>
                    {getStatusIcon(debugResult.authentication?.passwordValid)}
                    <Text strong> Password Valid: </Text>
                    <Tag color={debugResult.authentication?.passwordValid ? 'green' : 'red'}>
                      {debugResult.authentication?.passwordValid ? 'CORRECT' : 'INCORRECT'}
                    </Tag>
                  </div>
                </Space>
              </Card>

              {/* Summary */}
              <Card size="small" title="Summary">
                {debugResult.authentication?.passwordValid ? (
                  <Result
                    status="success"
                    title="Authentication Test Passed!"
                    subTitle="Your credentials are valid. If login still fails, check NextAuth configuration or browser cookies."
                    extra={[
                      <Button key="signin" type="primary" href="/auth/signin">
                        Try Sign In
                      </Button>,
                    ]}
                  />
                ) : (
                  <Result
                    status="error"
                    title="Authentication Test Failed"
                    subTitle={debugResult.debug?.nextSteps || 'Please check the results above'}
                  />
                )}
              </Card>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}