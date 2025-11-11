'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, message, Space, Radio } from 'antd';
import ReportLayout from '@/components/reports/ReportLayout';
import DateRangePicker from '@/components/reports/DateRangePicker';
import dayjs, { Dayjs } from 'dayjs';

export default function ConsolidatedPLPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [viewMode, setViewMode] = useState<'consolidated' | 'breakdown' | 'sidebyside'>('consolidated');

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });

      const response = await fetch(`/api/reports/consolidated/pl?${params}`);
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

  const categoryColumns = [
    {
      title: 'Category',
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
  ];

  const companyBreakdownColumns = [
    {
      title: 'Company',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#52c41a' }}>{formatCurrency(val)}</span>,
    },
    {
      title: 'Expenses',
      dataIndex: 'expenses',
      key: 'expenses',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#ff4d4f' }}>{formatCurrency(val)}</span>,
    },
    {
      title: 'Net Income',
      dataIndex: 'netIncome',
      key: 'netIncome',
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: val >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Profit Margin',
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: val >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {val.toFixed(1)}%
        </span>
      ),
    },
  ];

  const filters = (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Date Range</label>
        <DateRangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          showComparison={false}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>View Mode</label>
        <Radio.Group
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="consolidated">Consolidated</Radio.Button>
          <Radio.Button value="breakdown">Breakdown</Radio.Button>
          <Radio.Button value="sidebyside">Side-by-Side</Radio.Button>
        </Radio.Group>
      </div>
    </Space>
  );

  return (
    <ReportLayout
      title="Consolidated P&L Statement"
      subtitle="Combined profit & loss across all companies"
      breadcrumbs={[{ label: 'Consolidated Reports' }, { label: 'P&L' }]}
      companyName={reportData?.companies?.map((c: any) => c.name).join(', ')}
      period={`${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`}
      filters={filters}
      onExportPDF={() => message.info('PDF export coming soon')}
      onExportCSV={() => message.info('CSV export coming soon')}
      onExportExcel={() => message.info('Excel export coming soon')}
      onPrint={() => window.print()}
    >
      {loading ? (
        <Card loading />
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={reportData.revenue.total}
                  precision={2}
                  prefix="PHP"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Expenses"
                  value={reportData.expenses.total}
                  precision={2}
                  prefix="PHP"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Net Income"
                  value={reportData.netIncome}
                  precision={2}
                  prefix="PHP"
                  valueStyle={{ color: reportData.netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Profit Margin"
                  value={reportData.profitMargin}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: reportData.profitMargin >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Consolidated or Breakdown View */}
          {(viewMode === 'consolidated' || viewMode === 'breakdown') && (
            <>
              {/* Revenue */}
              <Card title="Revenue Breakdown" style={{ marginBottom: 24 }}>
                <Table
                  columns={categoryColumns}
                  dataSource={reportData.revenue.categories}
                  rowKey="categoryId"
                  pagination={false}
                />
              </Card>

              {/* Expenses */}
              <Card title="Expense Breakdown" style={{ marginBottom: 24 }}>
                <Table
                  columns={categoryColumns}
                  dataSource={reportData.expenses.categories}
                  rowKey="categoryId"
                  pagination={false}
                  expandable={{
                    expandedRowRender: (record) =>
                      record.subcategories && record.subcategories.length > 0 ? (
                        <Table
                          columns={[
                            { title: 'Subcategory', dataIndex: 'name', key: 'name' },
                            {
                              title: 'Amount',
                              dataIndex: 'amount',
                              key: 'amount',
                              align: 'right',
                              render: (val: number) => formatCurrency(val),
                            },
                          ]}
                          dataSource={record.subcategories}
                          rowKey="categoryId"
                          pagination={false}
                          showHeader={false}
                          size="small"
                        />
                      ) : null,
                    rowExpandable: (record) => record.subcategories && record.subcategories.length > 0,
                  }}
                />
              </Card>
            </>
          )}

          {/* Company Breakdown */}
          {(viewMode === 'breakdown' || viewMode === 'sidebyside') && (
            <Card title="Company Breakdown">
              <Table
                columns={companyBreakdownColumns}
                dataSource={reportData.companyBreakdown}
                rowKey="companyId"
                pagination={false}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                      <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <span style={{ color: '#52c41a' }}>{formatCurrency(reportData.revenue.total)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <span style={{ color: '#ff4d4f' }}>{formatCurrency(reportData.expenses.total)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <span style={{ color: reportData.netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}>
                          {formatCurrency(reportData.netIncome)}
                        </span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <span style={{ color: reportData.profitMargin >= 0 ? '#52c41a' : '#ff4d4f' }}>
                          {reportData.profitMargin.toFixed(1)}%
                        </span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          )}
        </>
      ) : null}
    </ReportLayout>
  );
}


