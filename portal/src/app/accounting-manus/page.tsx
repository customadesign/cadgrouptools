'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Form,
  Select,
  Upload,
  Button,
  message,
  Space,
  Typography,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';

const { Option } = Select;
const { Title, Text } = Typography;
const { Dragger } = Upload;

const COMPANIES = [
  { value: 'murphy_web_services', label: 'Murphy Web Services Incorporated' },
  { value: 'esystems_management', label: 'E-Systems Management Incorporated' },
  { value: 'mm_secretarial', label: 'M&M Secretarial Services Incorporated' },
  { value: 'dpm', label: 'DPM Incorporated' },
  { value: 'linkage_web_solutions', label: 'Linkage Web Solutions Enterprise Incorporated' },
  { value: 'wdds', label: 'WDDS' },
  { value: 'mm_leasing', label: 'M&M Leasing Services' },
  { value: 'hardin_bar_grill', label: 'Hardin Bar & Grill' },
  { value: 'mphi', label: 'MPHI' },
];

const DOCUMENT_TYPES = [
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'other', label: 'Other' },
];

const MONTHS = [
  { value: 'January', label: 'January' },
  { value: 'February', label: 'February' },
  { value: 'March', label: 'March' },
  { value: 'April', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'June', label: 'June' },
  { value: 'July', label: 'July' },
  { value: 'August', label: 'August' },
  { value: 'September', label: 'September' },
  { value: 'October', label: 'October' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => ({
  value: currentYear - i,
  label: (currentYear - i).toString(),
}));

export default function AccountingUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  const handleUpload = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      const file = fileList[0];
      const formData = new FormData();
      formData.append('file', file.originFileObj as Blob);
      formData.append('company', values.company);
      formData.append('month', values.month);
      formData.append('year', values.year.toString());
      formData.append('documentType', values.documentType);

      const response = await fetch('/api/accounting/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      
      message.success(`Document uploaded successfully! Manus AI is now processing it.`);
      
      setUploadedDocs([data.document, ...uploadedDocs]);
      setFileList([]);
      form.resetFields();

      // Redirect to company accounting page
      router.push(`/accounting-manus/${values.company}`);

    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    onRemove: (file: UploadFile) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: File) => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type.startsWith('image/');
      
      if (!isValidType) {
        message.error('You can only upload PDF or image files!');
        return false;
      }

      const isLt25M = file.size / 1024 / 1024 < 25;
      if (!isLt25M) {
        message.error('File must be smaller than 25MB!');
        return false;
      }

      setFileList([file as any]);
      return false; // Prevent auto upload
    },
    fileList,
  };

  if (status === 'loading') {
    return (
      <DashboardLayout breadcrumbs={[{ title: 'Accounting' }]}>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Text>Loading...</Text>
        </div>
      </DashboardLayout>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Accounting', href: '/accounting' },
        { title: 'Upload Document' },
      ]}
    >
      <PageHeader
        title="Upload Accounting Document"
        subtitle="Upload financial documents for automated analysis by Manus AI"
      />

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card>
            <Alert
              message="Automated AI Processing"
              description="Documents are automatically processed by Manus AI. OCR extraction, transaction parsing, and P&L generation happen automatically. This may take a few minutes per document."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpload}
              initialValues={{
                documentType: 'bank_statement',
                month: MONTHS[new Date().getMonth()].value,
                year: currentYear,
              }}
            >
              <Form.Item
                label="Company"
                name="company"
                rules={[{ required: true, message: 'Please select a company' }]}
              >
                <Select
                  size="large"
                  placeholder="Select company"
                  showSearch
                  optionFilterProp="children"
                >
                  {COMPANIES.map(company => (
                    <Option key={company.value} value={company.value}>
                      {company.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Month"
                    name="month"
                    rules={[{ required: true, message: 'Please select month' }]}
                  >
                    <Select size="large" placeholder="Select month">
                      {MONTHS.map(month => (
                        <Option key={month.value} value={month.value}>
                          {month.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Year"
                    name="year"
                    rules={[{ required: true, message: 'Please select year' }]}
                  >
                    <Select size="large" placeholder="Select year">
                      {YEARS.map(year => (
                        <Option key={year.value} value={year.value}>
                          {year.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Document Type"
                name="documentType"
                rules={[{ required: true, message: 'Please select document type' }]}
              >
                <Select size="large" placeholder="Select document type">
                  {DOCUMENT_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Upload Document">
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">
                    Support for PDF and image files (JPG, PNG). Maximum file size: 25MB
                  </p>
                </Dragger>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={uploading}
                    size="large"
                    icon={<UploadOutlined />}
                  >
                    Upload & Process with Manus AI
                  </Button>
                  <Button size="large" onClick={() => form.resetFields()}>
                    Reset
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="How It Works" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={5}>1. Upload Document</Title>
                <Text type="secondary">
                  Select company, month, year, and upload your document
                </Text>
              </div>
              <div>
                <Title level={5}>2. Automatic Processing</Title>
                <Text type="secondary">
                  Manus AI performs OCR extraction and analysis
                </Text>
              </div>
              <div>
                <Title level={5}>3. P&L Generation</Title>
                <Text type="secondary">
                  Monthly profit & loss statements are generated automatically
                </Text>
              </div>
              <div>
                <Title level={5}>4. View Results</Title>
                <Text type="secondary">
                  Access transaction data, insights, and reports
                </Text>
              </div>
            </Space>
          </Card>

          <Card title="Supported Documents">
            <Space direction="vertical" size="small">
              <Text><FileTextOutlined /> Bank Statements (PDF)</Text>
              <Text><FileTextOutlined /> Invoices (PDF, Images)</Text>
              <Text><FileTextOutlined /> Receipts (PDF, Images)</Text>
              <Text><FileTextOutlined /> Financial Reports</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </DashboardLayout>
  );
}

