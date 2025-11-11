'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, message, Space, Alert } from 'antd';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { ComparisonBarChart } from '@/components/reports/ReportCharts';
import dayjs, { Dayjs } from 'dayjs';

export default function CompanyComparisonPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  useEffect(() => {
    if (selectedCompanies.length > 0) {
      fetchReport();
    }
  }, [selectedCompanies, dateRange]);

  const fetchReport = async () => {
    if (selectedCompanies.length === 0) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyIds: selectedCompanies.join(','),
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });

      const response = await fetch(`/api/reports/consolidated/comparison?${params}`);
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

  const columns = [
    {
      title: 'Company',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left' as const,
      width: 200,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#52c41a' }}>{formatCurrency(val)}</span>,
      sorter: (a: any, b: any) => a.revenue - b.revenue,
    },
    {
      title: 'Expenses',
      dataIndex: 'expenses',
      key: 'expenses',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#ff4d4f' }}>{formatCurrency(val)}</span>,
      sorter: (a: any, b: any) => a.expenses - b.expenses,
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
      sorter: (a: any, b: any) => a.netIncome - b.netIncome,
      defaultSortOrder: 'descend' as const,
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
      sorter: (a: any, b: any) => a.profitMargin - b.profitMargin,
    },
    {
      title: 'Cash Position',
      dataIndex: 'cashPosition',
      key: 'cashPosition',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
      sorter: (a: any, b: any) => a.cashPosition - b.cashPosition,
    },
  ];

  const filters = (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Companies to Compare</label>
        <CompanySelector
          value={selectedCompanies}
          onChange={(val) => setSelectedCompanies(val as string[])}
          multiple={true}
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
      title="Company Comparison"
      subtitle="Side-by-side performance comparison across companies"
      breadcrumbs={[{ label: 'Consolidated Reports' }, { label: 'Comparison' }]}
      period={`${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`}
      filters={filters}
      onExportPDF={() => message.info('PDF export coming soon')}
      onExportCSV={() => message.info('CSV export coming soon')}
      onExportExcel={() => message.info('Excel export coming soon')}
      onPrint={() => window.print()}
    >
      {selectedCompanies.length === 0 ? (
        <Card>
          <p>Please select at least one company to compare.</p>
        </Card>
      ) : loading ? (
        <Card loading />
      ) : reportData ? (
        <>
          {selectedCompanies.length < 2 && (
            <Alert
              message="Select multiple companies for comparison"
              description="Select at least 2 companies to see comparative analysis."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Comparison Chart */}
          <Card title="Performance Comparison" style={{ marginBottom: 24 }}>
            <ComparisonBarChart
              data={reportData.chartData}
              height={400}
            />
          </Card>

          {/* Detailed Comparison Table */}
          <Card title="Detailed Metrics">
            <Table
              columns={columns}
              dataSource={reportData.companies}
              rowKey="companyId"
              pagination={false}
              scroll={{ x: 1000 }}
            />
          </Card>
        </>
      ) : null}
    </ReportLayout>
  );
}


