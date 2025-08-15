'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Card, Upload, Button, Alert, Spin, Typography, Space, Tag, Divider, Result } from 'antd';
import { UploadOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph, Pre } = Typography;

export default function TestOCRPage() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  // Check OCR service status on mount
  React.useEffect(() => {
    checkOCRStatus();
  }, []);

  const checkOCRStatus = async () => {
    try {
      const response = await fetch('/api/ocr');
      const status = await response.json();
      setServiceStatus(status);
    } catch (error) {
      console.error('Failed to check OCR status:', error);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      return;
    }

    setProcessing(true);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as File);
      formData.append('provider', 'auto');

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setOcrResult(result);
    } catch (error) {
      console.error('OCR error:', error);
      setOcrResult({ error: 'Failed to process image' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="OCR Test" 
        subtitle="Test OCR functionality with Google Cloud Vision and Tesseract.js"
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Service Status */}
        <Card title="OCR Service Status" style={{ marginBottom: 24 }}>
          {serviceStatus ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Text strong>Status:</Text>
                <Tag color="green">{serviceStatus.status}</Tag>
              </Space>
              <Space>
                <Text strong>Default Provider:</Text>
                <Tag color="blue">{serviceStatus.defaultProvider}</Tag>
              </Space>
              <Divider />
              <Title level={5}>Available Providers:</Title>
              <Space direction="vertical">
                <Space>
                  <CheckCircleOutlined style={{ color: serviceStatus.providers?.googleVision?.available ? '#52c41a' : '#ff4d4f' }} />
                  <Text>Google Cloud Vision:</Text>
                  <Tag color={serviceStatus.providers?.googleVision?.available ? 'green' : 'red'}>
                    {serviceStatus.providers?.googleVision?.available ? 'Available' : 'Not Configured'}
                  </Tag>
                  {serviceStatus.providers?.googleVision?.projectId && (
                    <Text type="secondary">Project: {serviceStatus.providers.googleVision.projectId}</Text>
                  )}
                </Space>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>Tesseract.js:</Text>
                  <Tag color="green">Available (Fallback)</Tag>
                </Space>
              </Space>
            </Space>
          ) : (
            <Spin />
          )}
        </Card>

        {/* Upload Section */}
        <Card title="Upload Test File" style={{ marginBottom: 24 }}>
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            accept="image/*,.pdf"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Select Image or PDF</Button>
          </Upload>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={processing}
            style={{ marginTop: 16 }}
          >
            Process with OCR
          </Button>
        </Card>

        {/* Results */}
        {processing && (
          <Card>
            <Spin size="large" />
            <Paragraph style={{ textAlign: 'center', marginTop: 16 }}>
              Processing image with OCR...
            </Paragraph>
          </Card>
        )}

        {ocrResult && !processing && (
          <Card title="OCR Results">
            {ocrResult.success ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="Processing Successful"
                  type="success"
                  description={`Provider: ${ocrResult.provider} | ${ocrResult.provider === 'pdf-parse' ? 'PDF Text Extraction' : `OCR Confidence: ${ocrResult.confidence?.toFixed(2) || 'N/A'}%`}`}
                  showIcon
                />
                
                {ocrResult.pdfInfo && (
                  <Alert
                    message="PDF Information"
                    description={`Pages: ${ocrResult.pdfInfo.pages} | Has Text: ${ocrResult.pdfInfo.hasText ? 'Yes' : 'No'}`}
                    type="info"
                    showIcon
                  />
                )}
                
                <Divider />
                
                <div>
                  <Title level={5}>Extracted Text:</Title>
                  <Pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 4,
                    maxHeight: 400,
                    overflow: 'auto'
                  }}>
                    {ocrResult.extractedText || 'No text found'}
                  </Pre>
                </div>

                {ocrResult.parsedData && (
                  <>
                    <Divider />
                    <div>
                      <Title level={5}>Parsed Bank Statement Data:</Title>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {ocrResult.parsedData.bankName && (
                          <Text>Bank: {ocrResult.parsedData.bankName}</Text>
                        )}
                        {ocrResult.parsedData.accountNumber && (
                          <Text>Account: {ocrResult.parsedData.accountNumber}</Text>
                        )}
                        {ocrResult.parsedData.period && (
                          <Text>Period: {ocrResult.parsedData.period}</Text>
                        )}
                        <Text>
                          Transactions Found: {ocrResult.parsedData.transactions?.length || 0}
                        </Text>
                        {ocrResult.parsedData.totalDebits && (
                          <Text>Total Debits: ${ocrResult.parsedData.totalDebits.toFixed(2)}</Text>
                        )}
                        {ocrResult.parsedData.totalCredits && (
                          <Text>Total Credits: ${ocrResult.parsedData.totalCredits.toFixed(2)}</Text>
                        )}
                      </Space>
                    </div>
                  </>
                )}
              </Space>
            ) : (
              <Alert
                message="OCR Processing Failed"
                type="error"
                description={ocrResult.error || 'Unknown error occurred'}
                showIcon
              />
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card title="Setup Instructions" style={{ marginTop: 24 }}>
          <Alert
            message="Google Cloud Vision Setup"
            description={
              <ol>
                <li>Go to Google Cloud Console and create a service account</li>
                <li>Download the JSON credentials file</li>
                <li>Place the file in your project directory</li>
                <li>Update GOOGLE_APPLICATION_CREDENTIALS in .env.local with the file path</li>
                <li>Set GOOGLE_PROJECT_ID to: 70a0367fcd60a287</li>
              </ol>
            }
            type="info"
            showIcon
          />
          <Alert
            message="Tesseract.js (Backup)"
            description="Tesseract.js is already configured and will be used automatically if Google Cloud Vision is not available or fails."
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}