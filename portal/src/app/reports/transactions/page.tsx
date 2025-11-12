'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, message, Space, Input, Select, Statistic, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import DateRangePicker from '@/components/reports/DateRangePicker';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;

export default function TransactionLedgerPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

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
  }, [selectedCompany, dateRange, page, search, statusFilter, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchReport = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: selectedCompany,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        page: page.toString(),
        pageSize: '100',
      });

      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedCategory) params.append('categoryId', selectedCategory);

      const response = await fetch(`/api/reports/transactions?${params}`);
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val: string) => dayjs(val).format('MMM DD, YYYY'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
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
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 150,
      render: (val: string, record: any) => (
        <span>
          {val}
          {record.subcategory && (
            <>
              <br />
              <Tag size="small">{record.subcategory.name}</Tag>
            </>
          )}
        </span>
      ),
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
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'reconciled' ? 'green' : 'orange'}>
          {val === 'reconciled' ? 'Reconciled' : 'Unreconciled'}
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
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Search</label>
        <Input
          placeholder="Search description or vendor"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          allowClear
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Status</label>
        <Select
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          style={{ width: '100%' }}
        >
          <Option value="all">All</Option>
          <Option value="reconciled">Reconciled</Option>
          <Option value="unreconciled">Unreconciled</Option>
        </Select>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Category</label>
        <Select
          value={selectedCategory}
          onChange={(val) => {
            setSelectedCategory(val);
            setPage(1);
          }}
          style={{ width: '100%' }}
          placeholder="All categories"
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {categories.map((cat: any) => (
            <Option key={cat._id} value={cat._id}>
              {cat.name} ({cat.type})
            </Option>
          ))}
        </Select>
      </div>
    </Space>
  );

  return (
    <ReportLayout
      title="Transaction Ledger"
      subtitle="Complete transaction register with advanced filtering"
      breadcrumbs={[{ label: 'Transactions' }]}
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
          {/* Summary Statistics */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Transactions"
                  value={reportData.summary.totalTransactions}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Income"
                  value={reportData.summary.totalIncome}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Expenses"
                  value={reportData.summary.totalExpenses}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Net Change"
                  value={reportData.summary.netChange}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: reportData.summary.netChange >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Transactions Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={reportData.transactions}
              rowKey="id"
              loading={loading}
              pagination={{
                current: page,
                pageSize: 100,
                total: reportData.pagination.total,
                onChange: (newPage) => setPage(newPage),
                showTotal: (total) => `Total ${total} transactions`,
                showSizeChanger: false,
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </>
      ) : null}
    </ReportLayout>
  );
}


