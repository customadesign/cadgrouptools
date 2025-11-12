'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, message, Space, Tag } from 'antd';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { ExpensePieChart } from '@/components/reports/ReportCharts';
import dayjs, { Dayjs } from 'dayjs';

export default function ExpenseReportPage() {
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
        groupBy: 'month',
      });

      const response = await fetch(`/api/reports/expenses?${params}`);
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

  const columns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      width: 200,
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
      render: (val: number) => <Tag>{val}</Tag>,
    },
  ];

  // Generate colors for pie chart
  const generateColors = (count: number) => {
    const colors = [
      '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
      '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
    ];
    return colors.slice(0, count);
  };

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
      title="Expense Analysis"
      subtitle="Detailed expense breakdown by category and vendor"
      breadcrumbs={[{ label: 'Expenses' }]}
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
                  title="Total Expenses"
                  value={reportData.totalExpenses}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts and Table Row */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            {/* Pie Chart */}
            <Col xs={24} lg={10}>
              <Card title="Expenses by Category" style={{ height: '100%' }}>
                {reportData.categories.length > 0 ? (
                  <ExpensePieChart
                    data={{
                      labels: reportData.categories.slice(0, 10).map((c: any) => c.name),
                      datasets: [
                        {
                          data: reportData.categories.slice(0, 10).map((c: any) => c.amount),
                          backgroundColor: generateColors(reportData.categories.slice(0, 10).length),
                          borderWidth: 1,
                        },
                      ],
                    }}
                    height={350}
                  />
                ) : (
                  <p>No expense data available</p>
                )}
              </Card>
            </Col>

            {/* Top Categories */}
            <Col xs={24} lg={14}>
              <Card title="Expense Breakdown" style={{ height: '100%' }}>
                <Table
                  columns={columns}
                  dataSource={reportData.categories}
                  rowKey="categoryId"
                  pagination={{ pageSize: 10 }}
                  expandable={{
                    expandedRowRender: (record) =>
                      record.topVendors && record.topVendors.length > 0 ? (
                        <div style={{ padding: '12px 0' }}>
                          <strong>Top Vendors:</strong>
                          <Table
                            columns={[
                              { title: 'Vendor', dataIndex: 'vendor', key: 'vendor' },
                              {
                                title: 'Amount',
                                dataIndex: 'amount',
                                key: 'amount',
                                align: 'right',
                                render: (val: number) => formatCurrency(val),
                              },
                              {
                                title: 'Transactions',
                                dataIndex: 'count',
                                key: 'count',
                                align: 'right',
                                render: (val: number) => <Tag>{val}</Tag>,
                              },
                            ]}
                            dataSource={record.topVendors}
                            rowKey="vendor"
                            pagination={false}
                            size="small"
                          />
                        </div>
                      ) : (
                        <p style={{ padding: '12px 0' }}>No vendor data available</p>
                      ),
                    rowExpandable: (record) => record.topVendors && record.topVendors.length > 0,
                  }}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          {formatCurrency(reportData.totalExpenses)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          100.0%
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          {reportData.categories.reduce((sum: number, c: any) => sum + c.transactionCount, 0)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </ReportLayout>
  );
}


