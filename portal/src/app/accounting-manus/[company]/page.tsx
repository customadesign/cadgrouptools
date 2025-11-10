'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Space,
  Badge,
  Descriptions,
  Tabs,
  Empty,
  message,
  Spin,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileTextOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';

const { TabPane } = Tabs;

interface AccountingDoc {
  _id: string;
  month: string;
  year: number;
  documentType: string;
  supabaseUrl: string;
  processingStatus: string;
  analysisResult?: any;
  createdAt: string;
}

interface PLStatement {
  month: string;
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  categories?: Record<string, number>;
}

const COMPANY_NAMES: Record<string, string> = {
  murphy_web_services: 'Murphy Web Services Incorporated',
  esystems_management: 'E-Systems Management Incorporated',
  mm_secretarial: 'M&M Secretarial Services Incorporated',
  dpm: 'DPM Incorporated',
  linkage_web_solutions: 'Linkage Web Solutions Enterprise Incorporated',
  wdds: 'WDDS',
  mm_leasing: 'M&M Leasing Services',
  hardin_bar_grill: 'Hardin Bar & Grill',
  mphi: 'MPHI',
};

export default function CompanyAccountingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const company = params.company as string;

  const [documents, setDocuments] = useState<AccountingDoc[]>([]);
  const [plStatements, setPLStatements] = useState<PLStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && company) {
      fetchData();
    }
  }, [status, company]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/accounting/${company}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounting data');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
      setPLStatements(data.plStatements || []);
    } catch (error: any) {
      message.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      uploaded: { color: 'default', text: 'Uploaded' },
      processing: { color: 'processing', text: 'Processing' },
      completed: { color: 'success', text: 'Completed' },
      failed: { color: 'error', text: 'Failed' },
    };

    const statusConfig = config[status] || { color: 'default', text: status };
    return <Badge status={statusConfig.color as any} text={statusConfig.text} />;
  };

  const documentColumns: ColumnsType<AccountingDoc> = [
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => `${record.month} ${record.year}`,
      sorter: (a, b) => {
        const dateA = new Date(`${a.month} 1, ${a.year}`);
        const dateB = new Date(`${b.month} 1, ${b.year}`);
        return dateB.getTime() - dateA.getTime();
      },
    },
    {
      title: 'Type',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (type: string) => type.replace('_', ' ').toUpperCase(),
    },
    {
      title: 'Status',
      dataIndex: 'processingStatus',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Uploaded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<DownloadOutlined />}
            href={record.supabaseUrl}
            target="_blank"
          >
            Download
          </Button>
          {record.analysisResult && (
            <Button
              type="link"
              onClick={() => showAnalysis(record)}
            >
              View Analysis
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const plColumns: ColumnsType<PLStatement> = [
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => `${record.month} ${record.year}`,
      sorter: (a, b) => {
        const dateA = new Date(`${a.month} 1, ${a.year}`);
        const dateB = new Date(`${b.month} 1, ${b.year}`);
        return dateB.getTime() - dateA.getTime();
      },
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'revenue',
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>
          ${value?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      title: 'Expenses',
      dataIndex: 'totalExpenses',
      key: 'expenses',
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
          ${value?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      title: 'Net Income',
      dataIndex: 'netIncome',
      key: 'netIncome',
      render: (value: number) => (
        <Space>
          {value >= 0 ? <RiseOutlined style={{ color: '#52c41a' }} /> : <FallOutlined style={{ color: '#ff4d4f' }} />}
          <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
            ${Math.abs(value)?.toLocaleString() || '0'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => showPLDetails(record)}>
          View Details
        </Button>
      ),
    },
  ];

  const showAnalysis = (doc: AccountingDoc) => {
    // TODO: Show detailed analysis in modal
    message.info('Analysis viewer coming soon');
  };

  const showPLDetails = (pl: PLStatement) => {
    // TODO: Show detailed P&L breakdown in modal
    message.info('P&L details viewer coming soon');
  };

  const exportToCSV = () => {
    message.success('Exporting to CSV...');
    // TODO: Implement CSV export
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout breadcrumbs={[{ title: 'Accounting' }]}>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  const companyName = COMPANY_NAMES[company] || company;
  const latestPL = plStatements[0];

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Accounting', href: '/accounting-manus' },
        { title: companyName },
      ]}
    >
      <PageHeader
        title={companyName}
        subtitle="Financial documents and analysis powered by Manus AI"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
            <Button
              type="primary"
              onClick={() => router.push('/accounting-manus')}
            >
              Upload New Document
            </Button>
          </Space>
        }
      />

      {/* Summary Statistics */}
      {latestPL && (
        <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Latest Revenue"
                value={latestPL.totalRevenue}
                prefix="$"
                valueStyle={{ color: '#52c41a' }}
                suffix={<small>({latestPL.month} {latestPL.year})</small>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Latest Expenses"
                value={latestPL.totalExpenses}
                prefix="$"
                valueStyle={{ color: '#ff4d4f' }}
                suffix={<small>({latestPL.month} {latestPL.year})</small>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Latest Net Income"
                value={latestPL.netIncome}
                prefix="$"
                valueStyle={{ color: latestPL.netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}
                suffix={<small>({latestPL.month} {latestPL.year})</small>}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs for Documents and P&L Statements */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane tab="Uploaded Documents" key="documents">
            <Table
              columns={documentColumns}
              dataSource={documents}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} documents`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No documents uploaded yet"
                  >
                    <Button type="primary" onClick={() => router.push('/accounting-manus')}>
                      Upload First Document
                    </Button>
                  </Empty>
                ),
              }}
            />
          </TabPane>

          <TabPane tab="P&L Statements" key="pl">
            <Table
              columns={plColumns}
              dataSource={plStatements}
              rowKey={(record) => `${record.month}-${record.year}`}
              loading={loading}
              pagination={{
                pageSize: 12,
                showTotal: (total) => `Total ${total} statements`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No P&L statements generated yet"
                  >
                    <p>Upload documents to generate P&L statements</p>
                  </Empty>
                ),
              }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </DashboardLayout>
  );
}

