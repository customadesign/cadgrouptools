'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, Tag, message, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { PLChart } from '@/components/reports/ReportCharts';
import dayjs, { Dayjs } from 'dayjs';

export default function PLReportPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [compareToPrevious, setCompareToPrevious] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      fetchReport();
    }
  }, [selectedCompany, dateRange, compareToPrevious]);

  const fetchReport = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: selectedCompany,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        compareToPrevious: compareToPrevious.toString(),
      });

      const response = await fetch(`/api/reports/pl?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      
      const data = await response.json();
      setReportData(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const revenueColumns = [
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
      render: (val: number) => (
        <span style={{ fontWeight: 500 }}>
          {new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: reportData?.company?.currency || 'PHP',
          }).format(val)}
        </span>
      ),
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right' as const,
      render: (val: number) => `${val.toFixed(1)}%`,
    },
  ];

  const expenseColumns = [
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
      render: (val: number) => (
        <span style={{ fontWeight: 500 }}>
          {new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: reportData?.company?.currency || 'PHP',
          }).format(val)}
        </span>
      ),
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right' as const,
      render: (val: number) => `${val.toFixed(1)}%`,
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
          onChange={(dates, compare) => {
            setDateRange(dates);
            setCompareToPrevious(compare);
          }}
          showComparison={true}
        />
      </div>
    </Space>
  );

  return (
    <ReportLayout
      title="Profit & Loss Statement"
      subtitle="Revenue and expense analysis with net income calculation"
      breadcrumbs={[{ label: 'P&L Statement' }]}
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
                  title="Total Revenue"
                  value={reportData.revenue.total}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: '#52c41a' }}
                />
                {compareToPrevious && reportData.comparison && (
                  <Tag
                    color={reportData.comparison.revenue.percentChange >= 0 ? 'green' : 'red'}
                    icon={reportData.comparison.revenue.percentChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  >
                    {Math.abs(reportData.comparison.revenue.percentChange).toFixed(1)}%
                  </Tag>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Expenses"
                  value={reportData.expenses.total}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: '#ff4d4f' }}
                />
                {compareToPrevious && reportData.comparison && (
                  <Tag
                    color={reportData.comparison.expenses.percentChange >= 0 ? 'red' : 'green'}
                    icon={reportData.comparison.expenses.percentChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  >
                    {Math.abs(reportData.comparison.expenses.percentChange).toFixed(1)}%
                  </Tag>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Net Income"
                  value={reportData.netIncome}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: reportData.netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
                {compareToPrevious && reportData.comparison && (
                  <Tag
                    color={reportData.comparison.netIncome.percentChange >= 0 ? 'green' : 'red'}
                    icon={reportData.comparison.netIncome.percentChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  >
                    {Math.abs(reportData.comparison.netIncome.percentChange).toFixed(1)}%
                  </Tag>
                )}
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

          {/* Revenue Breakdown */}
          <Card title="Revenue Breakdown" style={{ marginBottom: 24 }}>
            <Table
              columns={revenueColumns}
              dataSource={reportData.revenue.categories}
              rowKey="categoryId"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0}>Total Revenue</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: reportData.company.currency,
                      }).format(reportData.revenue.total)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      100.0%
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Expense Breakdown */}
          <Card title="Expense Breakdown" style={{ marginBottom: 24 }}>
            <Table
              columns={expenseColumns}
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
                          render: (val: number) =>
                            new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: reportData.company.currency,
                            }).format(val),
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
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0}>Total Expenses</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: reportData.company.currency,
                      }).format(reportData.expenses.total)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      100.0%
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

