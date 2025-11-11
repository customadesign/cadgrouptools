'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, message, Space } from 'antd';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { CashFlowChart } from '@/components/reports/ReportCharts';
import dayjs, { Dayjs } from 'dayjs';

export default function CashFlowReportPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

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

      const response = await fetch(`/api/reports/cashflow?${params}`);
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

  const inflowColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (val: string) => dayjs(val).format('MMM DD, YYYY'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatCurrency(val)}</span>,
    },
  ];

  const outflowColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (val: string) => dayjs(val).format('MMM DD, YYYY'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{formatCurrency(val)}</span>,
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
      title="Cash Flow Statement"
      subtitle="Track cash inflows, outflows, and ending cash position"
      breadcrumbs={[{ label: 'Cash Flow' }]}
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
          {/* Summary Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Beginning Cash"
                  value={reportData.beginningCash}
                  precision={2}
                  prefix={reportData.company.currency}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Ending Cash"
                  value={reportData.endingCash}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: reportData.netChange >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Net Change"
                  value={reportData.netChange}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: reportData.netChange >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Net Cash from Operations"
                  value={reportData.operatingActivities.netCashFromOperations}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: reportData.operatingActivities.netCashFromOperations >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Daily Balance Chart */}
          <Card title="Daily Cash Balance" style={{ marginBottom: 24 }}>
            <CashFlowChart
              data={{
                labels: reportData.dailyBalances.map((d: any) => dayjs(d.date).format('MMM DD')),
                datasets: [
                  {
                    label: 'Cash Balance',
                    data: reportData.dailyBalances.map((d: any) => d.balance),
                    borderColor: '#1890ff',
                    backgroundColor: 'rgba(24, 144, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              height={300}
            />
          </Card>

          {/* Cash Inflows */}
          <Card title="Cash Inflows" style={{ marginBottom: 24 }}>
            <Table
              columns={inflowColumns}
              dataSource={reportData.operatingActivities.inflows}
              rowKey={(record: any) => `${record.date}-${record.description}`}
              pagination={{ pageSize: 20 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#f0f5ff' }}>
                    <Table.Summary.Cell index={0} colSpan={3}>Total Inflows</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <span style={{ color: '#52c41a' }}>
                        {formatCurrency(reportData.operatingActivities.totalInflows)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Cash Outflows */}
          <Card title="Cash Outflows">
            <Table
              columns={outflowColumns}
              dataSource={reportData.operatingActivities.outflows}
              rowKey={(record: any) => `${record.date}-${record.description}`}
              pagination={{ pageSize: 20 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#fff1f0' }}>
                    <Table.Summary.Cell index={0} colSpan={3}>Total Outflows</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <span style={{ color: '#ff4d4f' }}>
                        {formatCurrency(reportData.operatingActivities.totalOutflows)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </>
      ) : null}
    </ReportLayout>
  );
}

