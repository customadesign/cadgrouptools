'use client';

import React, { useState, useEffect } from 'react';

// Force dynamic rendering to prevent static generation issues with theme context
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Table,
  Tag,
  Progress,
  Select,
  DatePicker,
  Typography,
  Alert,
  Badge,
  Tooltip,
  Segmented,
  Empty,
  List,
  Avatar,
} from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UploadOutlined,
  FileTextOutlined,
  BankOutlined,
  CalendarOutlined,
  PieChartOutlined,
  LineChartOutlined,
  BarChartOutlined,
  WalletOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  HomeOutlined,
  CarOutlined,
  CoffeeOutlined,
  ShopOutlined,
  TeamOutlined,
  FilterOutlined,
  DownloadOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs from 'dayjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
);

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'failed';
  account: string;
  vendor?: string;
}

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

export default function AccountingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any>(null);

  useEffect(() => {
    fetchAccountingData();
  }, [dateRange]);

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      // Fetch overview data
      const params = new URLSearchParams();
      if (dateRange[0]) params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
      if (dateRange[1]) params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      params.append('includeBalances', 'true');

      const [overviewResponse, categoriesResponse, balancesResponse] = await Promise.all([
        fetch(`/api/accounting/overview?${params.toString()}`),
        fetch(`/api/accounting/categories?${params.toString()}`),
        fetch('/api/accounting/balances?includeHistory=true&historyDays=30'),
      ]);

      if (!overviewResponse.ok || !categoriesResponse.ok || !balancesResponse.ok) {
        throw new Error('Failed to fetch accounting data');
      }

      const overview = await overviewResponse.json();
      const categories = await categoriesResponse.json();
      const balances = await balancesResponse.json();

      setOverviewData(overview);
      setCategoryData(categories);
      setBalanceData(balances);
      setTransactions(overview.recentTransactions || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch accounting data:', error);
      setLoading(false);
    }
  };

  // Calculate statistics from API data
  const totalIncome = overviewData?.keyMetrics?.totalIncome || 0;
  const totalExpenses = overviewData?.keyMetrics?.totalExpenses || 0;
  const netIncome = overviewData?.keyMetrics?.netIncome || 0;
  const profitMargin = overviewData?.keyMetrics?.profitMargin || 0;

  // Category breakdown from API
  const categoryIcons: Record<string, React.ReactNode> = {
    'Technology': <ShopOutlined />,
    'Rent': <HomeOutlined />,
    'Meals': <CoffeeOutlined />,
    'Transport': <CarOutlined />,
    'Utilities': <BankOutlined />,
    'Other': <WalletOutlined />,
    'Uncategorized': <WalletOutlined />,
  };

  const categoryColors: Record<string, string> = {
    'Technology': '#1677ff',
    'Rent': '#52c41a',
    'Meals': '#fa8c16',
    'Transport': '#eb2f96',
    'Utilities': '#722ed1',
    'Other': '#8c8c8c',
    'Uncategorized': '#8c8c8c',
  };

  const categoryBreakdown: CategoryData[] = (overviewData?.expenseCategories || []).map((cat: any, index: number) => ({
    name: cat.name,
    amount: cat.amount,
    percentage: cat.percentage,
    icon: categoryIcons[cat.name] || <WalletOutlined />,
    color: categoryColors[cat.name] || `hsl(${index * 60}, 70%, 50%)`,
  }));

  // Chart data from API
  const cashFlowData = overviewData?.cashFlowTrend || {
    labels: [],
    datasets: [
      {
        label: 'Income',
        data: [],
        borderColor: '#52c41a',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: [],
        borderColor: '#ff4d4f',
        backgroundColor: 'rgba(255, 77, 79, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const cashFlowOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => `$${value / 1000}k`,
        },
      },
    },
  };

  const categoryPieData = {
    labels: categoryBreakdown.map(c => c.name),
    datasets: [
      {
        data: categoryBreakdown.map(c => c.amount),
        backgroundColor: categoryBreakdown.map(c => c.color),
        borderWidth: 0,
      },
    ],
  };

  const categoryPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = ((value / totalExpenses) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  const monthlyComparisonData = {
    labels: ['Income', 'Expenses', 'Net'],
    datasets: [
      {
        label: 'This Month',
        data: [
          overviewData?.monthlyComparison?.thisMonth?.income || 0,
          overviewData?.monthlyComparison?.thisMonth?.expenses || 0,
          overviewData?.monthlyComparison?.thisMonth?.net || 0,
        ],
        backgroundColor: '#1677ff',
      },
      {
        label: 'Last Month',
        data: [
          overviewData?.monthlyComparison?.lastMonth?.income || 0,
          overviewData?.monthlyComparison?.lastMonth?.expenses || 0,
          overviewData?.monthlyComparison?.lastMonth?.net || 0,
        ],
        backgroundColor: '#a0d4ff',
      },
    ],
  };

  const monthlyComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => `$${value / 1000}k`,
        },
      },
    },
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (date: string) => dayjs(date).format('MMM DD'),
      sorter: (a: Transaction, b: Transaction) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number, record: Transaction) => (
        <Text
          strong
          style={{
            color: record.type === 'income' ? '#52c41a' : '#ff4d4f',
          }}
        >
          {record.type === 'income' ? '+' : '-'}${amount.toLocaleString()}
        </Text>
      ),
      sorter: (a: Transaction, b: Transaction) => a.amount - b.amount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = {
          completed: 'green',
          pending: 'orange',
          failed: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      width: 150,
      render: (account: string) => (
        <Space>
          <BankOutlined />
          <Text>{account}</Text>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Accounting' },
      ]}
    >
      <PageHeader
        title="Accounting Overview"
        subtitle="Monitor your financial health and cash flow"
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={fetchAccountingData}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />}>
              Export Report
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => router.push('/accounting/upload')}
            >
              Upload Statement
            </Button>
          </Space>
        }
      />

      {/* Period Selector */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Segmented
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              options={[
                { label: 'Today', value: 'today' },
                { label: 'Week', value: 'week' },
                { label: 'Month', value: 'month' },
                { label: 'Quarter', value: 'quarter' },
                { label: 'Year', value: 'year' },
                { label: 'Custom', value: 'custom' },
              ]}
            />
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
              format="MMM DD, YYYY"
            />
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Income"
              value={totalIncome}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
              suffix={
                overviewData?.monthlyComparison?.percentageChange?.income ? (
                  <span style={{ fontSize: 14, fontWeight: 'normal' }}>
                    {overviewData.monthlyComparison.percentageChange.income > 0 ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )}{' '}
                    {Math.abs(overviewData.monthlyComparison.percentageChange.income).toFixed(1)}%
                  </span>
                ) : null
              }
            />
            <Progress
              percent={75}
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={totalExpenses}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<DollarOutlined />}
              suffix={
                overviewData?.monthlyComparison?.percentageChange?.expenses ? (
                  <span style={{ fontSize: 14, fontWeight: 'normal' }}>
                    {overviewData.monthlyComparison.percentageChange.expenses > 0 ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )}{' '}
                    {Math.abs(overviewData.monthlyComparison.percentageChange.expenses).toFixed(1)}%
                  </span>
                ) : null
              }
            />
            <Progress
              percent={45}
              strokeColor="#ff4d4f"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Net Income"
              value={netIncome}
              precision={2}
              valueStyle={{ color: netIncome >= 0 ? '#1677ff' : '#ff4d4f' }}
              prefix={<DollarOutlined />}
            />
            <Progress
              percent={Math.abs(profitMargin)}
              strokeColor={netIncome >= 0 ? '#1677ff' : '#ff4d4f'}
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Profit Margin"
              value={profitMargin}
              precision={1}
              valueStyle={{ color: profitMargin >= 30 ? '#52c41a' : '#fa8c16' }}
              suffix="%"
              prefix={profitMargin >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            />
            <Progress
              percent={Math.abs(profitMargin)}
              strokeColor={profitMargin >= 30 ? '#52c41a' : '#fa8c16'}
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="Cash Flow Trend"
            extra={
              <Select defaultValue="6months" style={{ width: 120 }}>
                <Select.Option value="3months">3 Months</Select.Option>
                <Select.Option value="6months">6 Months</Select.Option>
                <Select.Option value="1year">1 Year</Select.Option>
              </Select>
            }
          >
            <div style={{ height: 350 }}>
              <Line data={cashFlowData} options={cashFlowOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Expense Categories">
            <div style={{ height: 350 }}>
              <Pie data={categoryPieData} options={categoryPieOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Monthly Comparison and Category Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Monthly Comparison">
            <div style={{ height: 300 }}>
              <Bar data={monthlyComparisonData} options={monthlyComparisonOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Category Breakdown"
            extra={
              <Button type="link" onClick={() => router.push('/accounting/transactions')}>
                View All
              </Button>
            }
          >
            <List
              dataSource={categoryBreakdown}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: item.color }}
                        icon={item.icon}
                      />
                    }
                    title={item.name}
                    description={`${item.percentage}% of total expenses`}
                  />
                  <Text strong style={{ fontSize: 16 }}>
                    ${item.amount.toLocaleString()}
                  </Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions */}
      <Card
        title="Recent Transactions"
        extra={
          <Space>
            <Button icon={<FilterOutlined />}>Filter</Button>
            <Button
              type="link"
              onClick={() => router.push('/accounting/transactions')}
            >
              View All
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Account Balances */}
      {balanceData?.accounts && balanceData.accounts.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {balanceData.accounts.slice(0, 3).map((account: any, index: number) => {
            const iconColors = ['#1677ff', '#52c41a', '#fa8c16'];
            const icons = [<BankOutlined />, <CreditCardOutlined />, <WalletOutlined />];
            
            return (
              <Col xs={24} md={8} key={account.accountName}>
                <Card>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      {React.cloneElement(icons[index] || icons[0], {
                        style: { fontSize: 24, color: iconColors[index] || iconColors[0] },
                      })}
                      <Text strong>{account.accountName}</Text>
                    </Space>
                    <Title level={3} style={{ margin: '8px 0' }}>
                      ${(account.currentBalance || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Title>
                    <Text type="secondary">
                      {account.lastTransaction?.date
                        ? `Updated: ${dayjs(account.lastTransaction.date).fromNow()}`
                        : 'No recent transactions'}
                    </Text>
                    {account.statistics && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Net Flow: ${account.statistics.netFlow.toLocaleString()}
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Alerts */}
      <div style={{ marginTop: 24 }}>
        <Alert
          message="Tax Payment Reminder"
          description="Quarterly estimated tax payment of $12,500 is due on January 15, 2024."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          action={
            <Button size="small" type="primary">
              Schedule Payment
            </Button>
          }
          closable
        />
      </div>
    </DashboardLayout>
  );
}