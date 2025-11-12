'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, message, Space, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { PLChart } from '@/components/reports/ReportCharts';
import dayjs, { Dayjs } from 'dayjs';

export default function RevenueReportPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Pre-select company from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('companyId');
    if (companyId) {
      setSelectedCompany(companyId);
    }
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchReport();
    }
  }, [selectedCompany, dateRange]);

  const fetchReport = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: selectedCompany,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });

      const response = await fetch(`/api/reports/revenue?${params}`);
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
      currency: reportData?.company?.currency || 'PHP',
    }).format(val);
  };

  const sourceColumns = [
    {
      title: 'Revenue Source',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(val)}</span>,
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right' as const,
      render: (val: number) => `${val.toFixed(1)}%`,
    },
    {
      title: 'Transactions',
      dataIndex: 'transactionCount',
      key: 'transactionCount',
      align: 'right' as const,
      render: (val: number) => <Tag color="green">{val}</Tag>,
    },
  ];

  const momColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (val: string) => dayjs(val).format('MMMM YYYY'),
    },
    {
      title: 'Revenue',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Change',
      dataIndex: 'percentChange',
      key: 'percentChange',
      align: 'right' as const,
      render: (val: number) => (
        <Tag color={val >= 0 ? 'green' : 'red'} icon={val >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
          {val === 0 ? '—' : `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
        </Tag>
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
          showAllOption={false}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Date Range</label>
        <DateRangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          showComparison={false}
        />
      </div>
    </Space>
  );

  return (
    <ReportLayout
      title="Revenue Analysis"
      subtitle="Revenue sources and month-over-month trends"
      breadcrumbs={[{ label: 'Revenue' }]}
      companyName={reportData?.company?.name}
      period={`${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`}
      filters={filters}
      onExportPDF={() => message.info('PDF export coming soon')}
      onExportCSV={() => message.info('CSV export coming soon')}
      onExportExcel={() => message.info('Excel export coming soon')}
      onPrint={() => window.print()}
    >
      {!selectedCompany ? (
        <Card>
          <p>Please select a company to view the report.</p>
        </Card>
      ) : loading ? (
        <Card loading />
      ) : reportData ? (
        <>
          {/* Summary Card */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={reportData.totalRevenue}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Revenue Trend Chart */}
          {reportData.monthOverMonth.length > 1 && (
            <Card title="Revenue Trend" style={{ marginBottom: 24 }}>
              <PLChart
                data={{
                  labels: reportData.monthOverMonth.map((m: any) => dayjs(m.month).format('MMM YYYY')),
                  datasets: [
                    {
                      label: 'Revenue',
                      data: reportData.monthOverMonth.map((m: any) => m.amount),
                      borderColor: '#52c41a',
                      backgroundColor: 'rgba(82, 196, 26, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                height={300}
              />
            </Card>
          )}

          {/* Revenue by Source */}
          <Card title="Revenue by Source" style={{ marginBottom: 24 }}>
            <Table
              columns={sourceColumns}
              dataSource={reportData.sources}
              rowKey="categoryId"
              pagination={{ pageSize: 10 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {formatCurrency(reportData.totalRevenue)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      100.0%
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      {reportData.sources.reduce((sum: number, s: any) => sum + s.transactionCount, 0)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Month-over-Month */}
          {reportData.monthOverMonth.length > 0 && (
            <Card title="Month-over-Month Comparison">
              <Table
                columns={momColumns}
                dataSource={reportData.monthOverMonth}
                rowKey="month"
                pagination={false}
              />
            </Card>
          )}
        </>
      ) : null}
    </ReportLayout>
  );
}

