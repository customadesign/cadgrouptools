'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Upload,
  Button,
  Space,
  List,
  Tag,
  Progress,
  Typography,
  Alert,
  Row,
  Col,
  Timeline,
  Badge,
  Tooltip,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Divider,
  Empty,
  Result,
  Steps,
  Table,
  Statistic,
  Descriptions,
} from 'antd';
import {
  InboxOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  SyncOutlined,
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs from 'dayjs';
import type { UploadProps, UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

interface StatementUpload {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed' | 'pending';
  account: string;
  period: string;
  transactionsFound?: number;
  transactionsImported?: number;
  errors?: string[];
  processingTime?: number;
}

export default function BankStatementUploadPage() {
  const router = useRouter();
  const uploadRef = useRef<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentUploads, setRecentUploads] = useState<StatementUpload[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<StatementUpload | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch statements from API on component mount
  React.useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statements?limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch statements');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform API data to match component's StatementUpload interface
        const transformedData = result.data.map((statement: any) => ({
          id: statement._id,
          fileName: statement.sourceFile?.originalName || statement.sourceFile?.filename || 'Unknown file',
          fileSize: statement.sourceFile?.size || 0,
          uploadDate: statement.createdAt,
          status: statement.status || 'pending',
          account: statement.accountName,
          period: `${getMonthName(statement.month)} ${statement.year}`,
          transactionsFound: statement.transactionsFound,
          transactionsImported: statement.transactionsImported,
          processingTime: statement.processingTime,
          errors: statement.errors,
        }));
        
        setRecentUploads(transformedData);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      message.error('Failed to load statements. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  };

  const handleDeleteStatement = async (statementId: string) => {
    try {
      const response = await fetch(`/api/statements/${statementId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRecentUploads(recentUploads.filter(u => u._id !== statementId && u.id !== statementId));
        message.success('Statement deleted successfully');
      } else {
        message.error(data.error || 'Failed to delete statement');
      }
    } catch (error) {
      console.error('Error deleting statement:', error);
      message.error('Failed to delete statement');
    }
  };

  const handleViewStatement = async (statement: StatementUpload) => {
    try {
      // Fetch full statement details including transactions
      const response = await fetch(`/api/statements/${statement._id || statement.id}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // Update selected statement with full details
        setSelectedUpload({
          ...statement,
          ...data.data,
          transactionsFound: data.data.transactionCount,
          transactionsImported: data.data.transactionCount,
        });
        setDetailModalVisible(true);
      } else {
        message.error('Failed to load statement details');
      }
    } catch (error) {
      console.error('Error fetching statement details:', error);
      message.error('Failed to load statement details');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    onChange(info) {
      setFileList(info.fileList);
      
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} upload failed.`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
    beforeUpload(file) {
      const isValidType = file.type === 'application/pdf' || 
                         file.type.startsWith('image/');
      if (!isValidType) {
        message.error('You can only upload PDF or image files!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }
      return false; // Prevent auto upload
    },
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select files to upload');
      return;
    }

    setConfigModalVisible(true);
  };

  const handleConfirmUpload = async () => {
    const values = await form.validateFields();
    setConfigModalVisible(false);
    setUploading(true);

    try {
      // Process each file
      for (const [index, file] of fileList.entries()) {
        
        // Extract bank name from account selection
        const bankName = values.account.split(' - ')[1]?.split(' ')[0] || 'Unknown Bank';
        const month = values.period.month() + 1; // dayjs months are 0-indexed
        const year = values.period.year();
        
        // Create statement record in database
        const statementData = {
          fileName: file.name,
          fileSize: file.size || 0,
          fileType: file.type,
          accountName: values.account,
          bankName: bankName,
          month: month,
          year: year,
          status: 'processing',
        };
        
        try {
          const createResponse = await fetch('/api/statements', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(statementData),
          });
          
          if (!createResponse.ok) {
            throw new Error('Failed to create statement record');
          }
          
          const createResult = await createResponse.json();
          const statementId = createResult.data._id;
          
          // Add to UI immediately
          const newUpload: StatementUpload = {
            id: statementId,
            fileName: file.name,
            fileSize: file.size || 0,
            uploadDate: new Date().toISOString(),
            status: 'processing' as const,
            account: values.account,
            period: values.period.format('MMMM YYYY'),
          };
          
          setRecentUploads(prev => [newUpload, ...prev]);

        // Perform OCR if file is an image
        if (file.originFileObj && (file.type?.includes('image') || file.type?.includes('pdf'))) {
          const formData = new FormData();
          formData.append('file', file.originFileObj);
          formData.append('provider', 'auto');
          formData.append('statementId', statementId);

          try {
            const response = await fetch('/api/ocr', {
              method: 'POST',
              body: formData,
            });

            const result = await response.json();

            if (response.ok) {
              // Update statement status in database
              const updateResponse = await fetch(`/api/statements/${statementId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'completed',
                  transactionsFound: result.parsedData?.transactions?.length || 0,
                  transactionsImported: result.parsedData?.transactions?.length || 0,
                  processingTime: 5,
                }),
              });
              
              if (updateResponse.ok) {
                // Update UI
                setRecentUploads(prev => prev.map(upload => 
                  upload.id === statementId 
                    ? {
                        ...upload,
                        status: 'completed' as const,
                        transactionsFound: result.parsedData?.transactions?.length || 0,
                        transactionsImported: result.parsedData?.transactions?.length || 0,
                        processingTime: 5,
                      }
                    : upload
                ));
                
                message.success(`OCR completed for ${file.name} using ${result.provider}`);
              }
            } else {
              // Update with error status in database
              await fetch(`/api/statements/${statementId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'failed',
                  errors: [result.error || 'OCR processing failed'],
                }),
              });
              
              // Update UI
              setRecentUploads(prev => prev.map(upload => 
                upload.id === statementId 
                  ? {
                      ...upload,
                      status: 'failed' as const,
                      errors: [result.error || 'OCR processing failed'],
                    }
                  : upload
              ));
              
              message.error(`OCR failed for ${file.name}: ${result.error}`);
            }
          } catch (error: any) {
            console.error('OCR error:', error);
            
            // Update database with error
            await fetch(`/api/statements/${statementId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'failed',
                errors: ['OCR service unavailable'],
              }),
            });
            
            setRecentUploads(prev => prev.map(upload => 
              upload.id === statementId 
                ? {
                    ...upload,
                    status: 'failed' as const,
                    errors: ['OCR service unavailable'],
                  }
                : upload
            ));
          }
        } else {
          // Non-image/PDF file, mark as completed without OCR
          await fetch(`/api/statements/${statementId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'completed',
            }),
          });
          
          setRecentUploads(prev => prev.map(upload => 
            upload.id === statementId 
              ? { ...upload, status: 'completed' as const }
              : upload
          ));
        }
        } catch (error: any) {
          console.error('Error creating statement:', error);
          message.error(`Failed to process ${file.name}`);
        }
      }

      setFileList([]);
      setUploading(false);
      message.success('Files uploaded successfully. OCR processing in progress.');
      form.resetFields();
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      message.error('Upload failed. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'processing':
        return <LoadingOutlined style={{ color: '#1677ff' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#fa8c16' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'processing';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (fileName: string, record: StatementUpload) => (
        <Space>
          {fileName.endsWith('.pdf') ? <FilePdfOutlined /> : <FileImageOutlined />}
          <Text>{fileName}</Text>
        </Space>
      ),
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      render: (account: string, record: StatementUpload) => (
        <Tag icon={<BankOutlined />} color="blue">
          {account || record.accountName}
        </Tag>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      render: (period: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{period}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Transactions',
      key: 'transactions',
      render: (_: any, record: StatementUpload) => {
        if (record.status === 'completed') {
          return (
            <Space>
              <Text type="success">{record.transactionsImported}</Text>
              <Text type="secondary">/ {record.transactionsFound}</Text>
            </Space>
          );
        }
        return '-';
      },
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: StatementUpload) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewStatement(record)}
            />
          </Tooltip>
          {record.status === 'completed' && (
            <Tooltip title="View Transactions">
              <Button
                type="text"
                icon={<DollarOutlined />}
                onClick={() => router.push(`/accounting/transactions?statement=${record._id || record.id}`)}
              />
            </Tooltip>
          )}
          {record.status === 'failed' && (
            <Tooltip title="Retry">
              <Button
                type="text"
                icon={<SyncOutlined />}
                onClick={() => message.info('Retrying upload...')}
              />
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Upload',
                  content: 'Are you sure you want to delete this upload? This will also delete all associated transactions.',
                  okText: 'Delete',
                  okType: 'danger',
                  onOk: () => handleDeleteStatement(record._id || record.id || ''),
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Accounting', href: '/accounting' },
        { title: 'Upload Statement' },
      ]}
    >
      <PageHeader
        title="Upload Bank Statement"
        subtitle="Upload and process bank statements for automatic transaction import"
        onBack={() => router.push('/accounting')}
      />

      {/* Upload Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Statements Processed"
              value={recentUploads.filter(u => u.status === 'completed').length}
              prefix={<FileTextOutlined />}
              suffix={`/ ${recentUploads.length}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={recentUploads
                .filter(u => u.status === 'completed')
                .reduce((sum, u) => sum + (u.transactionsImported || 0), 0)}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Success Rate"
              value={
                recentUploads.length > 0
                  ? (recentUploads.filter(u => u.status === 'completed').length / recentUploads.length * 100)
                  : 0
              }
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: recentUploads.filter(u => u.status === 'completed').length / recentUploads.length > 0.8 
                  ? '#52c41a' 
                  : '#fa8c16' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Upload Area */}
      <Card
        title="Upload Files"
        extra={
          <Space>
            <Button icon={<InfoCircleOutlined />} type="text">
              Help
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Alert
          message="Supported Formats"
          description="Upload bank statements in PDF or image format (JPG, PNG). Files should be less than 10MB. Our OCR system will automatically extract transactions."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          </p>
          <p className="ant-upload-text">Click or drag files to this area to upload</p>
          <p className="ant-upload-hint">
            Support for single or bulk upload. Strictly prohibited from uploading company data or other banned files.
          </p>
        </Dragger>

        {fileList.length > 0 && (
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setFileList([])}>
              Clear All
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              icon={<UploadOutlined />}
            >
              Upload {fileList.length} File{fileList.length > 1 ? 's' : ''}
            </Button>
          </Space>
        )}
      </Card>

      {/* Processing Steps */}
      <Card title="How It Works" style={{ marginBottom: 24 }}>
        <Steps
          items={[
            {
              title: 'Upload',
              description: 'Select and upload your bank statements',
              icon: <UploadOutlined />,
            },
            {
              title: 'OCR Processing',
              description: 'Our AI extracts transaction data',
              icon: <RocketOutlined />,
            },
            {
              title: 'Validation',
              description: 'Transactions are validated and categorized',
              icon: <SafetyOutlined />,
            },
            {
              title: 'Import',
              description: 'Data is imported to your accounting system',
              icon: <CheckCircleOutlined />,
            },
          ]}
        />
      </Card>

      {/* Recent Uploads */}
      <Card
        title="Recent Uploads"
        extra={
          <Space>
            <Select 
              defaultValue="all" 
              style={{ width: 120 }}
              onChange={(value) => {
                // Filter statements based on status
                if (value === 'all') {
                  fetchStatements();
                } else {
                  fetchStatements();
                }
              }}
            >
              <Option value="all">All Status</Option>
              <Option value="completed">Completed</Option>
              <Option value="processing">Processing</Option>
              <Option value="failed">Failed</Option>
              <Option value="uploaded">Uploaded</Option>
              <Option value="extracted">Extracted</Option>
            </Select>
            <Button 
              icon={<SyncOutlined />}
              onClick={fetchStatements}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingOutlined style={{ fontSize: 32 }} />
            <Title level={5} style={{ marginTop: 16 }}>Loading statements...</Title>
          </div>
        ) : recentUploads.length > 0 ? (
          <Table
            columns={columns}
            dataSource={recentUploads}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No uploads yet"
          >
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={() => {
                // Trigger the file input dialog
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) {
                  fileInput.click();
                }
              }}
            >
              Upload Your First Statement
            </Button>
          </Empty>
        )}
      </Card>

      {/* Configuration Modal */}
      <Modal
        title="Configure Upload"
        open={configModalVisible}
        onOk={handleConfirmUpload}
        onCancel={() => {
          setConfigModalVisible(false);
          form.resetFields();
        }}
        okText="Upload"
        confirmLoading={uploading}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="account"
            label="Bank Account"
            rules={[{ required: true, message: 'Please select a bank account' }]}
          >
            <Select placeholder="Select account" size="large">
              <Option value="Murphy Web Services - Bank Ozk 8979">Murphy Web Services - Bank Ozk 8979</Option>
              <Option value="E Systems Management - Bank Ozk 3633">E Systems Management - Bank Ozk 3633</Option>
              <Option value="MNM Secretarial Services Inc - Bank Ozk 5883">MNM Secretarial Services Inc - Bank Ozk 5883</Option>
              <Option value="Murphy Web Services - Bluevine 4281">Murphy Web Services - Bluevine 4281</Option>
              <Option value="E Systems Management - Bluevine 4005">E Systems Management - Bluevine 4005</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="period"
            label="Statement Period"
            rules={[{ required: true, message: 'Please select the statement period' }]}
          >
            <DatePicker
              picker="month"
              size="large"
              style={{ width: '100%' }}
              format="MMMM YYYY"
              disabledDate={(current) => current && current > dayjs().endOf('month')}
            />
          </Form.Item>

          <Alert
            message="Processing Information"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>OCR processing typically takes 1-5 minutes per file</li>
                <li>You'll receive a notification when processing is complete</li>
                <li>Duplicate transactions will be automatically detected</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Upload Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedUpload(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedUpload?.status === 'completed' && (
            <Button
              key="view"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => router.push('/accounting/transactions')}
            >
              View Transactions
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedUpload && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="File Name">
                {selectedUpload.fileName}
              </Descriptions.Item>
              <Descriptions.Item label="File Size">
                {formatFileSize(selectedUpload.fileSize)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag icon={getStatusIcon(selectedUpload.status)} color={getStatusColor(selectedUpload.status)}>
                  {selectedUpload.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Account">
                {selectedUpload.account}
              </Descriptions.Item>
              <Descriptions.Item label="Period">
                {selectedUpload.period}
              </Descriptions.Item>
              <Descriptions.Item label="Upload Date">
                {dayjs(selectedUpload.uploadDate).format('MMMM DD, YYYY HH:mm:ss')}
              </Descriptions.Item>
              {selectedUpload.status === 'completed' && (
                <>
                  <Descriptions.Item label="Transactions Found">
                    {selectedUpload.transactionsFound}
                  </Descriptions.Item>
                  <Descriptions.Item label="Transactions Imported">
                    <Text type="success">{selectedUpload.transactionsImported}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Processing Time">
                    {selectedUpload.processingTime} seconds
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedUpload.status === 'failed' && selectedUpload.errors && (
              <Alert
                message="Processing Errors"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    {selectedUpload.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {selectedUpload.status === 'processing' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Progress type="circle" percent={45} />
                <Title level={5} style={{ marginTop: 16 }}>
                  Processing Statement...
                </Title>
                <Text type="secondary">
                  Extracting transaction data using OCR
                </Text>
              </div>
            )}

            {selectedUpload.status === 'completed' && (
              <Timeline style={{ marginTop: 24 }}>
                <Timeline.Item color="green">
                  File uploaded successfully
                </Timeline.Item>
                <Timeline.Item color="green">
                  OCR processing completed
                </Timeline.Item>
                <Timeline.Item color="green">
                  {selectedUpload.transactionsFound} transactions extracted
                </Timeline.Item>
                <Timeline.Item color="green">
                  Transactions validated and categorized
                </Timeline.Item>
                <Timeline.Item color="green">
                  {selectedUpload.transactionsImported} transactions imported
                </Timeline.Item>
              </Timeline>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}