'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Tabs,
  Table,
  Tag,
  Statistic,
  Progress,
  Empty,
  Skeleton,
  message,
  Segmented,
  Tooltip,
  Dropdown,
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  FilterOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  TrophyOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
} from 'recharts';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs, { Dayjs } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Mock data generation functions
const generateRevenueData = (period: string) => {
  const baseData = {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: dayjs().subtract(29 - i, 'day').format('MMM DD'),
      revenue: Math.floor(Math.random() * 5000) + 2000,
      expenses: Math.floor(Math.random() * 3000) + 1000,
      profit: 0,
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      date: dayjs().subtract(11 - i, 'month').format('MMM YYYY'),
      revenue: Math.floor(Math.random() * 80000) + 40000,
      expenses: Math.floor(Math.random() * 50000) + 20000,
      profit: 0,
    })),
    quarterly: Array.from({ length: 4 }, (_, i) => ({
      date: `Q${i + 1} ${dayjs().year()}`,
      revenue: Math.floor(Math.random() * 250000) + 150000,
      expenses: Math.floor(Math.random() * 150000) + 80000,
      profit: 0,
    })),
    yearly: Array.from({ length: 5 }, (_, i) => ({
      date: String(dayjs().year() - 4 + i),
      revenue: Math.floor(Math.random() * 1000000) + 600000,
      expenses: Math.floor(Math.random() * 600000) + 400000,
      profit: 0,
    })),
  };

  return baseData[period as keyof typeof baseData].map(item => ({
    ...item,
    profit: item.revenue - item.expenses,
  }));
};

const generateClientData = () => {
  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'];
  const statuses = ['Active', 'Inactive', 'Pending'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Client ${String.fromCharCode(65 + i % 26)}${i + 1}`,
    industry: industries[Math.floor(Math.random() * industries.length)],
    revenue: Math.floor(Math.random() * 500000) + 50000,
    proposals: Math.floor(Math.random() * 20) + 1,
    successRate: Math.floor(Math.random() * 40) + 60,
    lastActivity: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD'),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    growth: Math.floor(Math.random() * 60) - 20,
  }));
};

const generateProposalData = () => {
  const stages = ['Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected'];
  const categories = ['Web Development', 'Mobile App', 'Consulting', 'Design', 'Marketing'];
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: `PROP-${String(1000 + i)}`,
    title: `Proposal ${i + 1}`,
    client: `Client ${String.fromCharCode(65 + i % 10)}`,
    value: Math.floor(Math.random() * 100000) + 10000,
    stage: stages[Math.floor(Math.random() * stages.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    createdDate: dayjs().subtract(Math.floor(Math.random() * 60), 'day').format('YYYY-MM-DD'),
    dueDate: dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD'),
    winProbability: Math.floor(Math.random() * 100),
  }));
};

const generateTransactionData = () => {
  const types = ['Income', 'Expense'];
  const categories = ['Sales', 'Services', 'Subscriptions', 'Salaries', 'Office', 'Marketing'];
  const statuses = ['Completed', 'Pending', 'Failed'];
  
  return Array.from({ length: 25 }, (_, i) => ({
    id: `TXN-${String(10000 + i)}`,
    date: dayjs().subtract(Math.floor(Math.random() * 90), 'day').format('YYYY-MM-DD'),
    description: `Transaction ${i + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    amount: Math.floor(Math.random() * 50000) + 1000,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    reference: `REF-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  }));
};

const generateUserActivityData = () => {
  const actions = ['Login', 'Created Proposal', 'Updated Client', 'Generated Report', 'Uploaded File'];
  const users = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown'];
  
  return Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    user: users[Math.floor(Math.random() * users.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    timestamp: dayjs().subtract(Math.floor(Math.random() * 168), 'hour').format('YYYY-MM-DD HH:mm'),
    ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
    device: Math.random() > 0.5 ? 'Desktop' : 'Mobile',
  }));
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [revenuePeriod, setRevenuePeriod] = useState('monthly');
  const [clientFilter, setClientFilter] = useState('all');
  const [proposalFilter, setProposalFilter] = useState('all');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1500);
  }, []);

  const revenueData = useMemo(() => generateRevenueData(revenuePeriod), [revenuePeriod]);
  const clientData = useMemo(() => generateClientData(), []);
  const proposalData = useMemo(() => generateProposalData(), []);
  const transactionData = useMemo(() => generateTransactionData(), []);
  const userActivityData = useMemo(() => generateUserActivityData(), []);

  // Calculate summary statistics
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const avgDealSize = proposalData.reduce((sum, p) => sum + p.value, 0) / proposalData.length;

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    console.log(`Exporting ${activeTab} report as ${format}...`);
    message.info(`Export to ${format.toUpperCase()} functionality will be implemented soon`);
  };

  const handlePrint = () => {
    console.log(`Printing ${activeTab} report...`);
    message.info('Print functionality will be implemented soon');
  };

  const exportMenuItems = [
    {
      key: 'csv',
      label: 'Export as CSV',
      icon: <FileExcelOutlined />,
      onClick: () => handleExport('csv'),
    },
    {
      key: 'excel',
      label: 'Export as Excel',
      icon: <FileExcelOutlined style={{ color: '#52c41a' }} />,
      onClick: () => handleExport('excel'),
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      icon: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
      onClick: () => handleExport('pdf'),
    },
    {
      type: 'divider',
    },
    {
      key: 'print',
      label: 'Print Report',
      icon: <PrinterOutlined />,
      onClick: handlePrint,
    },
  ];

  // Chart colors
  const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

  // Industry distribution for pie chart
  const industryData = clientData.reduce((acc: any[], client) => {
    const existing = acc.find(item => item.name === client.industry);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: client.industry, value: 1 });
    }
    return acc;
  }, []);

  // Proposal conversion funnel
  const proposalFunnelData = [
    { stage: 'Draft', value: proposalData.filter(p => p.stage === 'Draft').length },
    { stage: 'Sent', value: proposalData.filter(p => p.stage === 'Sent').length },
    { stage: 'Under Review', value: proposalData.filter(p => p.stage === 'Under Review').length },
    { stage: 'Accepted', value: proposalData.filter(p => p.stage === 'Accepted').length },
  ];

  const renderRevenueReport = () => (
    <>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${Number(value).toLocaleString()}`}
            />
            <Progress percent={75} strokeColor="#52c41a" showInfo={false} />
            <Text type="secondary" style={{ fontSize: 12 }}>75% of target</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={totalExpenses}
              prefix="$"
              valueStyle={{ color: '#ff4d4f' }}
              formatter={(value) => `${Number(value).toLocaleString()}`}
            />
            <Progress percent={60} strokeColor="#ff4d4f" showInfo={false} />
            <Text type="secondary" style={{ fontSize: 12 }}>60% of budget</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Net Profit"
              value={totalProfit}
              prefix="$"
              valueStyle={{ color: '#1677ff' }}
              formatter={(value) => `${Number(value).toLocaleString()}`}
            />
            <Progress percent={85} strokeColor="#1677ff" showInfo={false} />
            <Text type="secondary" style={{ fontSize: 12 }}>15% profit margin</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Growth Rate"
              value={18.2}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress percent={100} strokeColor="#52c41a" showInfo={false} />
            <Text type="secondary" style={{ fontSize: 12 }}>vs last period</Text>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card
            title="Revenue Trend"
            extra={
              <Segmented
                value={revenuePeriod}
                onChange={setRevenuePeriod}
                options={[
                  { label: 'Daily', value: 'daily' },
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Quarterly', value: 'quarterly' },
                  { label: 'Yearly', value: 'yearly' },
                ]}
              />
            }
          >
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#52c41a"
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#ff4d4f"
                  fill="url(#colorExpenses)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stackId="3"
                  stroke="#1677ff"
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Detailed Table */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Revenue Details">
            <Table
              dataSource={revenueData}
              columns={[
                {
                  title: 'Period',
                  dataIndex: 'date',
                  key: 'date',
                },
                {
                  title: 'Revenue',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  render: (value) => `$${value.toLocaleString()}`,
                  sorter: (a, b) => a.revenue - b.revenue,
                },
                {
                  title: 'Expenses',
                  dataIndex: 'expenses',
                  key: 'expenses',
                  render: (value) => `$${value.toLocaleString()}`,
                  sorter: (a, b) => a.expenses - b.expenses,
                },
                {
                  title: 'Profit',
                  dataIndex: 'profit',
                  key: 'profit',
                  render: (value) => (
                    <span style={{ color: value > 0 ? '#52c41a' : '#ff4d4f' }}>
                      ${value.toLocaleString()}
                    </span>
                  ),
                  sorter: (a, b) => a.profit - b.profit,
                },
                {
                  title: 'Margin %',
                  key: 'margin',
                  render: (_, record) => {
                    const margin = ((record.profit / record.revenue) * 100).toFixed(1);
                    return (
                      <Tag color={Number(margin) > 20 ? 'green' : Number(margin) > 10 ? 'orange' : 'red'}>
                        {margin}%
                      </Tag>
                    );
                  },
                },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderClientReport = () => (
    <>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Clients"
              value={clientData.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <Text type="secondary">Active accounts</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Client Revenue"
              value={clientData.reduce((sum, c) => sum + c.revenue, 0)}
              prefix="$"
              formatter={(value) => `${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary">Total value</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Success Rate"
              value={clientData.reduce((sum, c) => sum + c.successRate, 0) / clientData.length}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary">Proposal acceptance</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="New Clients"
              value={5}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">This month</Text>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Client Distribution by Industry">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top 5 Clients by Revenue">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={clientData
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map(c => ({ name: c.name, revenue: c.revenue }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Client Table */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="Client Details"
            extra={
              <Select
                value={clientFilter}
                onChange={setClientFilter}
                style={{ width: 120 }}
              >
                <Select.Option value="all">All Clients</Select.Option>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            }
          >
            <Table
              dataSource={clientData}
              columns={[
                {
                  title: 'Client Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text) => <a>{text}</a>,
                },
                {
                  title: 'Industry',
                  dataIndex: 'industry',
                  key: 'industry',
                  filters: industryData.map(i => ({ text: i.name, value: i.name })),
                  onFilter: (value, record) => record.industry === value,
                },
                {
                  title: 'Revenue',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  render: (value) => `$${value.toLocaleString()}`,
                  sorter: (a, b) => a.revenue - b.revenue,
                },
                {
                  title: 'Proposals',
                  dataIndex: 'proposals',
                  key: 'proposals',
                  sorter: (a, b) => a.proposals - b.proposals,
                },
                {
                  title: 'Success Rate',
                  dataIndex: 'successRate',
                  key: 'successRate',
                  render: (value) => (
                    <Progress
                      percent={value}
                      size="small"
                      strokeColor={value > 80 ? '#52c41a' : value > 60 ? '#faad14' : '#ff4d4f'}
                    />
                  ),
                  sorter: (a, b) => a.successRate - b.successRate,
                },
                {
                  title: 'Growth',
                  dataIndex: 'growth',
                  key: 'growth',
                  render: (value) => (
                    <Tag color={value > 0 ? 'green' : 'red'}>
                      {value > 0 ? <RiseOutlined /> : <FallOutlined />} {Math.abs(value)}%
                    </Tag>
                  ),
                  sorter: (a, b) => a.growth - b.growth,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag
                      color={
                        status === 'Active' ? 'green' : status === 'Inactive' ? 'red' : 'orange'
                      }
                    >
                      {status}
                    </Tag>
                  ),
                },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderProposalReport = () => (
    <>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Proposals"
              value={proposalData.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <Text type="secondary">All time</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={proposalData.reduce((sum, p) => sum + p.value, 0)}
              prefix="$"
              formatter={(value) => `${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary">Pipeline value</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Win Rate"
              value={
                (proposalData.filter(p => p.stage === 'Accepted').length / proposalData.length) * 100
              }
              suffix="%"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary">Conversion rate</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Deal Size"
              value={avgDealSize}
              prefix="$"
              formatter={(value) => `${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">Per proposal</Text>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Proposal Pipeline">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={proposalFunnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#1677ff">
                  {proposalFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Proposals by Category">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={proposalData.reduce((acc: any[], proposal) => {
                    const existing = acc.find(item => item.name === proposal.category);
                    if (existing) {
                      existing.value += proposal.value;
                    } else {
                      acc.push({ name: proposal.category, value: proposal.value });
                    }
                    return acc;
                  }, [])}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {proposalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Proposal Table */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="Proposal Details"
            extra={
              <Select
                value={proposalFilter}
                onChange={setProposalFilter}
                style={{ width: 150 }}
              >
                <Select.Option value="all">All Proposals</Select.Option>
                <Select.Option value="draft">Draft</Select.Option>
                <Select.Option value="sent">Sent</Select.Option>
                <Select.Option value="accepted">Accepted</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
              </Select>
            }
          >
            <Table
              dataSource={proposalData}
              columns={[
                {
                  title: 'Proposal ID',
                  dataIndex: 'id',
                  key: 'id',
                  render: (text) => <a>{text}</a>,
                },
                {
                  title: 'Title',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: 'Client',
                  dataIndex: 'client',
                  key: 'client',
                },
                {
                  title: 'Value',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value) => `$${value.toLocaleString()}`,
                  sorter: (a, b) => a.value - b.value,
                },
                {
                  title: 'Stage',
                  dataIndex: 'stage',
                  key: 'stage',
                  render: (stage) => {
                    const colors: Record<string, string> = {
                      Draft: 'default',
                      Sent: 'blue',
                      'Under Review': 'orange',
                      Accepted: 'green',
                      Rejected: 'red',
                    };
                    return <Tag color={colors[stage]}>{stage}</Tag>;
                  },
                  filters: [
                    { text: 'Draft', value: 'Draft' },
                    { text: 'Sent', value: 'Sent' },
                    { text: 'Under Review', value: 'Under Review' },
                    { text: 'Accepted', value: 'Accepted' },
                    { text: 'Rejected', value: 'Rejected' },
                  ],
                  onFilter: (value, record) => record.stage === value,
                },
                {
                  title: 'Category',
                  dataIndex: 'category',
                  key: 'category',
                },
                {
                  title: 'Win Probability',
                  dataIndex: 'winProbability',
                  key: 'winProbability',
                  render: (value) => (
                    <Progress
                      percent={value}
                      size="small"
                      strokeColor={value > 70 ? '#52c41a' : value > 40 ? '#faad14' : '#ff4d4f'}
                    />
                  ),
                  sorter: (a, b) => a.winProbability - b.winProbability,
                },
                {
                  title: 'Due Date',
                  dataIndex: 'dueDate',
                  key: 'dueDate',
                  render: (date) => dayjs(date).format('MMM DD, YYYY'),
                  sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix(),
                },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderTransactionReport = () => (
    <>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Income"
              value={transactionData
                .filter(t => t.type === 'Income')
                .reduce((sum, t) => sum + t.amount, 0)}
              prefix="$"
              formatter={(value) => `${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary">All transactions</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={transactionData
                .filter(t => t.type === 'Expense')
                .reduce((sum, t) => sum + t.amount, 0)}
              prefix="$"
              formatter={(value) => `${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Text type="secondary">All transactions</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={transactionData.filter(t => t.status === 'Pending').length}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary">Awaiting processing</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={
                (transactionData.filter(t => t.status === 'Completed').length /
                  transactionData.length) *
                100
              }
              suffix="%"
              precision={1}
              valueStyle={{ color: '#1677ff' }}
            />
            <Text type="secondary">Completed transactions</Text>
          </Card>
        </Col>
      </Row>

      {/* Transaction Table */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Transaction History">
            <Table
              dataSource={transactionData}
              columns={[
                {
                  title: 'Transaction ID',
                  dataIndex: 'id',
                  key: 'id',
                  render: (text) => <a>{text}</a>,
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  key: 'date',
                  render: (date) => dayjs(date).format('MMM DD, YYYY'),
                  sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
                },
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                },
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type) => (
                    <Tag color={type === 'Income' ? 'green' : 'red'}>{type}</Tag>
                  ),
                  filters: [
                    { text: 'Income', value: 'Income' },
                    { text: 'Expense', value: 'Expense' },
                  ],
                  onFilter: (value, record) => record.type === value,
                },
                {
                  title: 'Category',
                  dataIndex: 'category',
                  key: 'category',
                  filters: Array.from(new Set(transactionData.map(t => t.category))).map(c => ({
                    text: c,
                    value: c,
                  })),
                  onFilter: (value, record) => record.category === value,
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount, record) => (
                    <span style={{ color: record.type === 'Income' ? '#52c41a' : '#ff4d4f' }}>
                      {record.type === 'Expense' ? '-' : '+'}${amount.toLocaleString()}
                    </span>
                  ),
                  sorter: (a, b) => a.amount - b.amount,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => {
                    const config: Record<string, { color: string; icon: React.ReactNode }> = {
                      Completed: { color: 'green', icon: <CheckCircleOutlined /> },
                      Pending: { color: 'orange', icon: <ClockCircleOutlined /> },
                      Failed: { color: 'red', icon: <CloseCircleOutlined /> },
                    };
                    return (
                      <Tag color={config[status].color} icon={config[status].icon}>
                        {status}
                      </Tag>
                    );
                  },
                  filters: [
                    { text: 'Completed', value: 'Completed' },
                    { text: 'Pending', value: 'Pending' },
                    { text: 'Failed', value: 'Failed' },
                  ],
                  onFilter: (value, record) => record.status === value,
                },
                {
                  title: 'Reference',
                  dataIndex: 'reference',
                  key: 'reference',
                },
              ]}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderUserActivityReport = () => (
    <>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={new Set(userActivityData.map(a => a.user)).size}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <Text type="secondary">Last 7 days</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Activities"
              value={userActivityData.length}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary">All actions</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Desktop Users"
              value={
                (userActivityData.filter(a => a.device === 'Desktop').length /
                  userActivityData.length) *
                100
              }
              suffix="%"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary">vs Mobile</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Daily Actions"
              value={Math.floor(userActivityData.length / 7)}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">Per day</Text>
          </Card>
        </Col>
      </Row>

      {/* Activity Chart */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="User Activity Heatmap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Array.from({ length: 7 }, (_, i) => {
                  const date = dayjs().subtract(6 - i, 'day');
                  const count = userActivityData.filter(a =>
                    dayjs(a.timestamp).isSame(date, 'day')
                  ).length;
                  return {
                    day: date.format('ddd'),
                    activities: count || Math.floor(Math.random() * 20) + 5,
                  };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="activities" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Activity Table */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Activity Log">
            <Table
              dataSource={userActivityData}
              columns={[
                {
                  title: 'User',
                  dataIndex: 'user',
                  key: 'user',
                  render: (text) => (
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                        {text[0]}
                      </Avatar>
                      {text}
                    </Space>
                  ),
                  filters: Array.from(new Set(userActivityData.map(a => a.user))).map(u => ({
                    text: u,
                    value: u,
                  })),
                  onFilter: (value, record) => record.user === value,
                },
                {
                  title: 'Action',
                  dataIndex: 'action',
                  key: 'action',
                  filters: Array.from(new Set(userActivityData.map(a => a.action))).map(a => ({
                    text: a,
                    value: a,
                  })),
                  onFilter: (value, record) => record.action === value,
                },
                {
                  title: 'Timestamp',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (timestamp) => dayjs(timestamp).format('MMM DD, YYYY HH:mm'),
                  sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
                },
                {
                  title: 'IP Address',
                  dataIndex: 'ip',
                  key: 'ip',
                },
                {
                  title: 'Device',
                  dataIndex: 'device',
                  key: 'device',
                  render: (device) => (
                    <Tag color={device === 'Desktop' ? 'blue' : 'green'}>{device}</Tag>
                  ),
                  filters: [
                    { text: 'Desktop', value: 'Desktop' },
                    { text: 'Mobile', value: 'Mobile' },
                  ],
                  onFilter: (value, record) => record.device === value,
                },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const reportTabs = [
    {
      key: 'revenue',
      label: (
        <span>
          <DollarOutlined /> Revenue
        </span>
      ),
      children: renderRevenueReport(),
    },
    {
      key: 'clients',
      label: (
        <span>
          <TeamOutlined /> Clients
        </span>
      ),
      children: renderClientReport(),
    },
    {
      key: 'proposals',
      label: (
        <span>
          <FileTextOutlined /> Proposals
        </span>
      ),
      children: renderProposalReport(),
    },
    {
      key: 'transactions',
      label: (
        <span>
          <ShoppingCartOutlined /> Transactions
        </span>
      ),
      children: renderTransactionReport(),
    },
    {
      key: 'activity',
      label: (
        <span>
          <UserOutlined /> User Activity
        </span>
      ),
      children: renderUserActivityReport(),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        subtitle="Comprehensive business analytics and insights"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])}
              style={{ width: 250 }}
            />
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <Button icon={<DownloadOutlined />}>Export</Button>
            </Dropdown>
          </Space>
        }
      />

      {loading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 12 }} />
        </Card>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={reportTabs}
          tabBarStyle={{ marginBottom: 24 }}
        />
      )}
    </DashboardLayout>
  );
}