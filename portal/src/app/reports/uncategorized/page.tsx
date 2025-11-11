'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Progress, message, Space, Tag } from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import dayjs from 'dayjs';

export default function UncategorizedPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  useEffect(() => {
    fetchReport();
  }, [selectedCompany]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompany && selectedCompany !== 'all') {
        params.append('companyId', selectedCompany);
      }

      const response = await fetch(`/api/reports/uncategorized?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      
      const data = await response.json();
      setReportData(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(val);
  };

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val: string) => dayjs(val).format('MMM DD, YYYY'),
    },
    {
      title: 'Company',
      dataIndex: ['company', 'name'],
      key: 'company',
      width: 150,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      width: 120,
      render: (val: number, record: any) => (
        <span style={{ 
          color: record.direction === 'credit' ? '#52c41a' : '#ff4d4f',
          fontWeight: 500 
        }}>
          {record.direction === 'credit' ? '+' : '-'}{formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Current Category',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 150,
      render: (val: string) => <Tag color="orange">{val}</Tag>,
    },
  ];

  const companyBreakdownColumns = [
    {
      title: 'Company',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Total Transactions',
      dataIndex: 'totalTransactions',
      key: 'totalTransactions',
      align: 'right' as const,
    },
    {
      title: 'Uncategorized',
      dataIndex: 'uncategorizedCount',
      key: 'uncategorizedCount',
      align: 'right' as const,
      render: (val: number) => <Tag color="orange">{val}</Tag>,
    },
    {
      title: 'Categorization Rate',
      dataIndex: 'categorizationRate',
      key: 'categorizationRate',
      align: 'right' as const,
      render: (val: number) => (
        <span>
          <Progress
            percent={val}
            size="small"
            status={val >= 95 ? 'success' : val >= 80 ? 'normal' : 'exception'}
            style={{ width: 100, display: 'inline-block', marginRight: 8 }}
          />
          {val.toFixed(1)}%
        </span>
      ),
    },
  ];

  const filters = (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Company</label>
        <CompanySelector
          value={selectedCompany}
          onChange={(val) => setSelectedCompany(val as string)}
          showAllOption={true}
        />
      </div>
    </Space>
  );

  const categorizationStatus = reportData?.categorizationRate >= 95 ? 'success' : 
                                reportData?.categorizationRate >= 80 ? 'normal' : 'exception';

  return (
    <ReportLayout
      title="Data Quality Dashboard"
      subtitle="Transaction categorization tracking and data quality metrics"
      breadcrumbs={[{ label: 'Tax & Compliance' }, { label: 'Data Quality' }]}
      filters={filters}
      onExportCSV={() => message.info('CSV export coming soon')}
      onPrint={() => window.print()}
    >
      {loading ? (
        <Card loading />
      ) : reportData ? (
        <>
          {/* Categorization Rate Gauge */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <Card style={{ textAlign: 'center', height: '100%' }}>
                <Progress
                  type="dashboard"
                  percent={reportData.categorizationRate}
                  size={200}
                  status={categorizationStatus}
                  format={(percent) => (
                    <>
                      <div style={{ fontSize: 32, fontWeight: 700 }}>{percent?.toFixed(1)}%</div>
                      <div style={{ fontSize: 14, color: '#8c8c8c' }}>Categorized</div>
                    </>
                  )}
                />
                <div style={{ marginTop: 16 }}>
                  {reportData.categorizationRate >= 95 ? (
                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 14 }}>
                      Excellent Data Quality
                    </Tag>
                  ) : (
                    <Tag icon={<WarningOutlined />} color="warning" style={{ fontSize: 14 }}>
                      Needs Attention
                    </Tag>
                  )}
                </div>
              </Card>
            </Col>

            {/* Summary Stats */}
            <Col xs={24} lg={16}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card>
                    <Card.Meta
                      title="Total Transactions"
                      description={
                        <div style={{ fontSize: 24, fontWeight: 600 }}>
                          {reportData.totalTransactions.toLocaleString()}
                        </div>
                      }
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Card.Meta
                      title="Categorized"
                      description={
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                          {reportData.categorizedCount.toLocaleString()}
                        </div>
                      }
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Card.Meta
                      title="Uncategorized"
                      description={
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                          {reportData.uncategorizedCount.toLocaleString()}
                        </div>
                      }
                    />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Company Breakdown (if viewing all companies) */}
          {reportData.companyBreakdown && (
            <Card title="Categorization by Company" style={{ marginBottom: 24 }}>
              <Table
                columns={companyBreakdownColumns}
                dataSource={reportData.companyBreakdown}
                rowKey="companyId"
                pagination={false}
              />
            </Card>
          )}

          {/* Uncategorized Transactions */}
          <Card 
            title={`Uncategorized Transactions (Showing ${Math.min(reportData.transactions.length, 100)} of ${reportData.uncategorizedCount})`}
          >
            <Table
              columns={transactionColumns}
              dataSource={reportData.transactions}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </>
      ) : null}
    </ReportLayout>
  );
}

