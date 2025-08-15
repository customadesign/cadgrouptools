'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Upload, Alert, Spin, Space, Tag, Typography, Divider, Result, message, List } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, CloudUploadOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;

interface ConfigStatus {
  supabase?: {
    url: string;
    serviceRole: string;
    bucket: string;
  };
  storage?: {
    initialized: boolean;
    bucketName: string;
  };
  environment?: {
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_ROLE?: string;
    SUPABASE_BUCKET?: string;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
  error?: string;
}

export default function TestStoragePage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      console.error('Failed to check configuration:', error);
      setConfigStatus({ error: 'Failed to connect to test endpoint' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const file = fileList[0].originFileObj as File;
      const formData = new FormData();
      formData.append('file', file);

      // Test uploading using the test-supabase endpoint
      const response = await fetch('/api/test-supabase', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setUploadResult(result);
      
      if (response.ok) {
        message.success('Upload test successful!');
      } else {
        message.error(`Upload failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Upload test error:', error);
      setUploadResult({ error: error.message });
      message.error('Upload test failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: boolean | string) => {
    if (status === true || status === 'configured') return 'green';
    if (status === false || status === 'missing') return 'red';
    return 'orange';
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Storage Configuration Test" 
        subtitle="Test Supabase storage configuration and avatar uploads"
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Configuration Status */}
        <Card title="Configuration Status" style={{ marginBottom: 24 }}>
          {loading ? (
            <Spin size="large" />
          ) : configStatus?.error ? (
            <Alert
              message="Configuration Check Failed"
              description={configStatus.error}
              type="error"
              showIcon
            />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* Supabase Configuration */}
              <div>
                <Title level={5}>Supabase Configuration</Title>
                <List
                  dataSource={[
                    { 
                      label: 'SUPABASE_URL', 
                      value: configStatus?.supabase?.url || 'missing',
                      status: configStatus?.supabase?.url === 'configured'
                    },
                    { 
                      label: 'SUPABASE_SERVICE_ROLE', 
                      value: configStatus?.supabase?.serviceRole || 'missing',
                      status: configStatus?.supabase?.serviceRole === 'configured'
                    },
                    { 
                      label: 'SUPABASE_BUCKET', 
                      value: configStatus?.supabase?.bucket || 'missing',
                      status: !!configStatus?.supabase?.bucket
                    },
                  ]}
                  renderItem={item => (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{item.label}:</Text>{' '}
                      <Tag color={getStatusColor(item.status)}>
                        {item.value}
                      </Tag>
                    </div>
                  )}
                />
              </div>

              <Divider />

              {/* Storage Status */}
              <div>
                <Title level={5}>Storage Status</Title>
                <Space>
                  <Text>Initialized:</Text>
                  {configStatus?.storage?.initialized ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                  )}
                </Space>
                <div>
                  <Text>Bucket Name: </Text>
                  <Tag>{configStatus?.storage?.bucketName || 'Not configured'}</Tag>
                </div>
              </div>

              <Divider />

              {/* Environment Variables */}
              <div>
                <Title level={5}>Environment Variables</Title>
                <Alert
                  message="Required Variables"
                  description={
                    <ul>
                      <li><strong>SUPABASE_URL</strong>: Your Supabase project URL</li>
                      <li><strong>SUPABASE_SERVICE_ROLE</strong>: Service role key (for server-side uploads)</li>
                      <li><strong>SUPABASE_BUCKET</strong>: Bucket name (default: cadgroup-uploads)</li>
                      <li><strong>NEXT_PUBLIC_SUPABASE_URL</strong>: Same as SUPABASE_URL (for client-side)</li>
                      <li><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong>: Anon key (optional)</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />
              </div>
            </Space>
          )}
        </Card>

        {/* Upload Test */}
        <Card title="Upload Test" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Test Avatar Upload"
              description="Select an image file to test the avatar upload functionality"
              type="info"
              showIcon
              icon={<CloudUploadOutlined />}
            />
            
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept="image/*"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>

            <Button
              type="primary"
              onClick={handleTestUpload}
              loading={uploading}
              disabled={fileList.length === 0}
            >
              Test Upload
            </Button>

            {uploadResult && (
              <Alert
                message={uploadResult.error ? 'Upload Failed' : 'Upload Successful'}
                description={
                  <pre style={{ fontSize: 12 }}>
                    {JSON.stringify(uploadResult, null, 2)}
                  </pre>
                }
                type={uploadResult.error ? 'error' : 'success'}
                showIcon
              />
            )}
          </Space>
        </Card>

        {/* Setup Instructions */}
        <Card title="Setup Instructions" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Step 1: Get Supabase Credentials"
              description={
                <ol>
                  <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a></li>
                  <li>Select your project</li>
                  <li>Go to Settings → API</li>
                  <li>Copy the Project URL and Service Role Key</li>
                </ol>
              }
              type="info"
            />

            <Alert
              message="Step 2: Create Storage Bucket"
              description={
                <ol>
                  <li>In Supabase, go to Storage → Buckets</li>
                  <li>Create a new bucket named "cadgroup-uploads"</li>
                  <li>Set it to PUBLIC for avatar URLs to work</li>
                  <li>Add RLS policies if needed for security</li>
                </ol>
              }
              type="info"
            />

            <Alert
              message="Step 3: Add Environment Variables to Render"
              description={
                <ol>
                  <li>Go to your Render Dashboard</li>
                  <li>Navigate to Environment tab</li>
                  <li>Add all required Supabase variables</li>
                  <li>Redeploy the service</li>
                </ol>
              }
              type="info"
            />
          </Space>
        </Card>

        {/* Troubleshooting */}
        <Card title="Common Issues">
          <List
            dataSource={[
              {
                issue: 'Bucket not found',
                solution: 'Create the bucket in Supabase Storage section',
              },
              {
                issue: 'Unauthorized error',
                solution: 'Check that you\'re using the SERVICE_ROLE key, not the ANON key',
              },
              {
                issue: 'Network error',
                solution: 'Verify SUPABASE_URL format (should start with https://)',
              },
              {
                issue: 'File too large',
                solution: 'Default limit is 5MB, can be adjusted in the API route',
              },
            ]}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={<Text strong>{item.issue}</Text>}
                  description={item.solution}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}