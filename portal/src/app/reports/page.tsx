'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
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
  Input,
  List,
  Avatar,
  Switch,
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
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
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
import { usePageTracking, useInteractionTracking } from '@/hooks/useActivityTracking';

dayjs.extend(quarterOfYear);

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Real data state and fetch helpers
type RevenuePoint = { date: string; revenue: number; expenses: number; profit: number };
type ClientRow = {
  id: string;
  name: string;
  industry?: string;
  revenue: number;
  proposals: number;
  successRate: number;
  lastActivity?: string;
  status?: string;
  growth: number;
};
type ProposalRow = {
  id: string;
  title: string;
  client: string;
  value: number;
  stage: string;
  category?: string;
  createdDate: string;
  dueDate?: string;
  winProbability: number;
};
type TransactionRow = {
  id: string;
  date: string;
  description: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  reference?: string;
};

// User activity data will be fetched from the API

function ReportsContent() {
  // Activity tracking hooks
  usePageTracking();
  const { trackInteraction } = useInteractionTracking();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [revenuePeriod, setRevenuePeriod] = useState('monthly');
  const [clientFilter, setClientFilter] = useState('all');
  const [proposalFilter, setProposalFilter] = useState('all');
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [clientData, setClientData] = useState<ClientRow[]>([]);
  const [proposalData, setProposalData] = useState<ProposalRow[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionRow[]>([]);
  const [userActivityData, setUserActivityData] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState({
    userId: '',
    actionType: '',
    resourceType: '',
    success: '',
    search: '',
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default

  // Initial and dependent data fetches
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchRevenueData(),
        fetchClientsAndProposals(),
        fetchTransactionData(),
      ]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // refresh when date range changes
    const refetch = async () => {
      setLoading(true);
      await Promise.all([
        fetchRevenueData(),
        fetchClientsAndProposals(),
        fetchTransactionData(),
      ]);
      setLoading(false);
    };
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    // revenue period switch
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenuePeriod]);

  const fetchRevenueData = async () => {
    try {
      const start = (dateRange[0] || dayjs().subtract(30, 'day')).toISOString();
      const end = (dateRange[1] || dayjs()).toISOString();

      if (revenuePeriod === 'daily') {
        const params = new URLSearchParams({ startDate: start, endDate: end, limit: '5000' });
        const resp = await fetch(`/api/transactions?${params.toString()}`);
        if (!resp.ok) throw new Error('Failed to fetch transactions');
        const data = await resp.json();
        const txns = data.transactions || [];
        const dayMap = new Map<string, { revenue: number; expenses: number }>();
        txns.forEach((t: any) => {
          const key = dayjs(t.txnDate || t.date).format('MMM DD');
          const isCredit = (t.direction || t.type) === 'credit' || (t.type === 'income');
          const entry = dayMap.get(key) || { revenue: 0, expenses: 0 };
          if (isCredit) entry.revenue += t.amount || 0; else entry.expenses += t.amount || 0;
          dayMap.set(key, entry);
        });
        const series = Array.from(dayMap.entries())
          .map(([date, v]) => ({ date, revenue: v.revenue, expenses: v.expenses, profit: v.revenue - v.expenses }))
          .sort((a, b) => dayjs(a.date, 'MMM DD').unix() - dayjs(b.date, 'MMM DD').unix());
        setRevenueData(series);
      } else {
        const resp = await fetch('/api/accounting/overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: start, endDate: end, reportType: 'summary' }),
        });
        if (!resp.ok) throw new Error('Failed to fetch accounting summary');
        const data = await resp.json();
        const report = data.report || {};
        const byMonth: any[] = report.byMonth || [];
        // Build monthly base
        const monthly = byMonth.map((m: any) => {
          const dt = dayjs(`${m._id.year}-${String(m._id.month).padStart(2, '0')}-01`);
          const date = dt.format('MMM YYYY');
          const revenue = m.income || 0;
          const expenses = m.expenses || 0;
          return { date, revenue, expenses, profit: revenue - expenses } as RevenuePoint;
        });

        if (revenuePeriod === 'monthly') {
          setRevenueData(monthly);
        } else if (revenuePeriod === 'quarterly') {
          const qMap = new Map<string, { revenue: number; expenses: number }>();
          monthly.forEach(m => {
            const d = dayjs(m.date, 'MMM YYYY');
            const q = `Q${d.quarter()} ${d.year()}`;
            const entry = qMap.get(q) || { revenue: 0, expenses: 0 };
            entry.revenue += m.revenue; entry.expenses += m.expenses;
            qMap.set(q, entry);
          });
          const series = Array.from(qMap.entries()).map(([date, v]) => ({ date, revenue: v.revenue, expenses: v.expenses, profit: v.revenue - v.expenses }));
          setRevenueData(series);
        } else if (revenuePeriod === 'yearly') {
          const yMap = new Map<string, { revenue: number; expenses: number }>();
          monthly.forEach(m => {
            const y = dayjs(m.date, 'MMM YYYY').year().toString();
            const entry = yMap.get(y) || { revenue: 0, expenses: 0 };
            entry.revenue += m.revenue; entry.expenses += m.expenses;
            yMap.set(y, entry);
          });
          const series = Array.from(yMap.entries()).map(([date, v]) => ({ date, revenue: v.revenue, expenses: v.expenses, profit: v.revenue - v.expenses }));
          setRevenueData(series);
        }
      }
    } catch (err) {
      console.error('Error loading revenue data', err);
      setRevenueData([]);
    }
  };

  const fetchClientsAndProposals = async () => {
    try {
      const [clientsResp, proposalsResp] = await Promise.all([
        fetch('/api/clients?limit=500'),
        fetch('/api/proposals?limit=500'),
      ]);
      if (!clientsResp.ok) throw new Error('Failed to fetch clients');
      if (!proposalsResp.ok) throw new Error('Failed to fetch proposals');
      const clientsJson = await clientsResp.json();
      const proposalsJson = await proposalsResp.json();
      const clients = clientsJson.clients || [];
      const proposals = proposalsJson.proposals || [];

      const proposalsByClient = new Map<string, any[]>();
      proposals.forEach((p: any) => {
        const clientId = typeof p.client === 'object' && p.client?._id ? p.client._id : p.client;
        if (!clientId) return;
        const list = proposalsByClient.get(clientId) || [];
        list.push(p);
        proposalsByClient.set(clientId, list);
      });

      const mappedClients: ClientRow[] = clients.map((c: any) => {
        const cId = c._id?.toString();
        const pList = proposalsByClient.get(cId) || [];
        const finalized = pList.filter((p: any) => p.status === 'finalized').length;
        const successRate = pList.length > 0 ? (finalized / pList.length) * 100 : 0;
        return {
          id: cId,
          name: c.organization,
          industry: c.industry || '—',
          revenue: c.estimatedValue || 0,
          proposals: pList.length,
          successRate,
          lastActivity: (c.updatedAt || c.createdAt) ? dayjs(c.updatedAt || c.createdAt).format('YYYY-MM-DD') : undefined,
          status: (c.status || 'active').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          growth: 0,
        };
      });
      setClientData(mappedClients);

      const mappedProposals: ProposalRow[] = proposals.map((p: any, idx: number) => ({
        id: p._id?.toString() || `PROP-${idx + 1}`,
        title: (p.selectedServices && p.selectedServices.length > 0) ? p.selectedServices[0] : 'Proposal',
        client: typeof p.client === 'object' && p.client?.organization ? p.client.organization : (p.client?.toString?.() || 'Unknown'),
        value: p.clientRate || 0,
        stage: (p.status || 'draft').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        category: (p.selectedServices && p.selectedServices.length > 0) ? p.selectedServices[0] : undefined,
        createdDate: p.createdAt || new Date().toISOString(),
        dueDate: p.createdAt || new Date().toISOString(),
        winProbability: 0,
      }));
      setProposalData(mappedProposals);
    } catch (err) {
      console.error('Error loading clients/proposals', err);
      setClientData([]);
      setProposalData([]);
    }
  };

  const fetchTransactionData = async () => {
    try {
      const start = (dateRange[0] || dayjs().subtract(30, 'day')).toISOString();
      const end = (dateRange[1] || dayjs()).toISOString();
      const params = new URLSearchParams({ startDate: start, endDate: end, limit: '500' });
      const resp = await fetch(`/api/transactions?${params.toString()}`);
      if (!resp.ok) throw new Error('Failed to fetch transactions');
      const data = await resp.json();
      const txns = data.transactions || [];
      const mapped: TransactionRow[] = txns.map((t: any, i: number) => ({
        id: t._id?.toString() || `TXN-${i + 1}`,
        date: t.txnDate || t.date,
        description: t.description || '—',
        type: (t.direction === 'credit' || t.type === 'income') ? 'Income' : 'Expense',
        category: t.category || 'Uncategorized',
        amount: t.amount || 0,
        status: 'Completed',
        reference: t.checkNo || undefined,
      }));
      setTransactionData(mapped);
    } catch (err) {
      console.error('Error loading transactions', err);
      setTransactionData([]);
    }
  };
  // Fetch user activity data from API
  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivityLogs();
      fetchActivityStats();
    }
  }, [activeTab, dateRange, activityFilter]);

  // Auto-refresh functionality for activity logs
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (activeTab === 'activity' && autoRefresh) {
      intervalId = setInterval(() => {
        fetchActivityLogs();
        fetchActivityStats();
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab, autoRefresh, refreshInterval, dateRange, activityFilter]);

  const fetchActivityLogs = async () => {
    try {
      setActivityLoading(true);
      const params = new URLSearchParams();
      if (dateRange[0]) params.append('startDate', dateRange[0].toISOString());
      if (dateRange[1]) params.append('endDate', dateRange[1].toISOString());
      if (activityFilter.userId) params.append('userId', activityFilter.userId);
      if (activityFilter.actionType) params.append('actionType', activityFilter.actionType);
      if (activityFilter.resourceType) params.append('resourceType', activityFilter.resourceType);
      if (activityFilter.success !== '') params.append('success', activityFilter.success);
      if (activityFilter.search) params.append('search', activityFilter.search);
      params.append('limit', '100');

      const response = await fetch(`/api/admin/activity-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      const data = await response.json();
      setUserActivityData(data.logs || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      message.error('Failed to load activity logs');
      setUserActivityData([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange[0]) params.append('startDate', dateRange[0].toISOString());
      if (dateRange[1]) params.append('endDate', dateRange[1].toISOString());

      const response = await fetch(`/api/admin/activity-logs/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activity stats');
      const data = await response.json();
      setActivityStats(data);
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      setActivityStats(null);
    }
  };

  const handleActivityExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      if (dateRange[0]) params.append('startDate', dateRange[0].toISOString());
      if (dateRange[1]) params.append('endDate', dateRange[1].toISOString());
      params.append('format', format);

      const response = await fetch(`/api/admin/activity-logs/export?${params}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to export activity logs');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${dayjs().format('YYYY-MM-DD')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      message.success(`Activity logs exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting activity logs:', error);
      message.error('Failed to export activity logs');
    }
  };

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
      {/* Auto-refresh and Filter Controls */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren="Auto Refresh ON"
                unCheckedChildren="Auto Refresh OFF"
              />
              {autoRefresh && (
                <Select
                  value={refreshInterval}
                  onChange={setRefreshInterval}
                  style={{ width: 120 }}
                >
                  <Select.Option value={10000}>10 seconds</Select.Option>
                  <Select.Option value={30000}>30 seconds</Select.Option>
                  <Select.Option value={60000}>1 minute</Select.Option>
                  <Select.Option value={300000}>5 minutes</Select.Option>
                </Select>
              )}
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary">
              {autoRefresh ? `Refreshing every ${refreshInterval / 1000} seconds` : 'Auto-refresh disabled'}
            </Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Tag color={activityLoading ? 'processing' : 'success'}>
                {activityLoading ? <SyncOutlined spin /> : <CheckCircleOutlined />}
                {activityLoading ? ' Loading...' : ' Live'}
              </Tag>
              <Text type="secondary">
                Last updated: {dayjs().format('HH:mm:ss')}
              </Text>
            </Space>
          </Col>
        </Row>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search logs..."
              prefix={<SearchOutlined />}
              value={activityFilter.search}
              onChange={(e) => setActivityFilter({ ...activityFilter, search: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Action Type"
              value={activityFilter.actionType || undefined}
              onChange={(value) => setActivityFilter({ ...activityFilter, actionType: value || '' })}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="login">Login</Select.Option>
              <Select.Option value="logout">Logout</Select.Option>
              <Select.Option value="create">Create</Select.Option>
              <Select.Option value="read">Read</Select.Option>
              <Select.Option value="update">Update</Select.Option>
              <Select.Option value="delete">Delete</Select.Option>
              <Select.Option value="upload">Upload</Select.Option>
              <Select.Option value="download">Download</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Resource Type"
              value={activityFilter.resourceType || undefined}
              onChange={(value) => setActivityFilter({ ...activityFilter, resourceType: value || '' })}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="user">User</Select.Option>
              <Select.Option value="client">Client</Select.Option>
              <Select.Option value="proposal">Proposal</Select.Option>
              <Select.Option value="report">Report</Select.Option>
              <Select.Option value="transaction">Transaction</Select.Option>
              <Select.Option value="file">File</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Select
              placeholder="Status"
              value={activityFilter.success === '' ? undefined : activityFilter.success}
              onChange={(value) => setActivityFilter({ ...activityFilter, success: value === undefined ? '' : value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="true">Success</Select.Option>
              <Select.Option value="false">Failed</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Button 
              onClick={() => {
                setActivityFilter({
                  userId: '',
                  actionType: '',
                  resourceType: '',
                  success: '',
                  search: '',
                });
              }}
              icon={<FilterOutlined />}
            >
              Clear Filters
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                onClick={() => handleActivityExport('csv')}
                icon={<FileExcelOutlined />}
              >
                Export CSV
              </Button>
              <Button
                onClick={() => fetchActivityLogs()}
                icon={<ReloadOutlined />}
                loading={activityLoading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={activityLoading}>
            <Statistic
              title="Total Activities"
              value={activityStats?.summary?.totalLogs || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1677ff' }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <Text type="secondary">In selected period</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={activityLoading}>
            <Statistic
              title="Success Rate"
              value={activityStats?.summary?.successRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={activityStats?.summary?.successRate > 95 ? <CheckCircleOutlined /> : null}
            />
            <Progress 
              percent={activityStats?.summary?.successRate || 0} 
              strokeColor="#52c41a" 
              showInfo={false} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={activityLoading}>
            <Statistic
              title="Failed Operations"
              value={activityStats?.summary?.failedLogs || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
            <Text type="secondary">
              {activityStats?.summary?.failureRate?.toFixed(1) || 0}% failure rate
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={activityLoading}>
            <Statistic
              title="Avg Response Time"
              value={activityStats?.summary?.avgResponseTime || 0}
              suffix="ms"
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
            <Text type="secondary">Server performance</Text>
          </Card>
        </Col>
      </Row>

      {/* Activity Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Activity Trends" loading={activityLoading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={activityStats?.trends?.hourly || []}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <RechartsTooltip 
                  labelFormatter={(hour) => `${hour}:00`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#1677ff" 
                  strokeWidth={2}
                  dot={{ fill: '#1677ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Activity Distribution" loading={activityLoading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityStats?.actionTypes || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(activityStats?.actionTypes || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top Users */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Most Active Users" loading={activityLoading}>
            <List
              dataSource={activityStats?.topUsers?.slice(0, 5) || []}
              renderItem={(user: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: '#1677ff' }}>
                        {user.userName?.[0] || user.userId?.[0] || '?'}
                      </Avatar>
                    }
                    title={user.userName || user.userId}
                    description={`${user.count} activities`}
                  />
                  <Progress
                    type="circle"
                    percent={Math.min((user.count / (activityStats?.summary?.totalLogs || 1)) * 100, 100)}
                    width={50}
                    format={(percent) => `${percent?.toFixed(0)}%`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Errors" loading={activityLoading}>
            <List
              dataSource={activityStats?.recentErrors?.slice(0, 5) || []}
              renderItem={(error: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />}
                    title={
                      <Space>
                        <Text type="danger">{error.actionType}</Text>
                        <Tag color="red">{error.resourceType}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {error.userName || error.userId}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(error.timestamp).format('MMM DD, HH:mm')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              empty={<Empty description="No errors found" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Activity Table */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Activity Logs" loading={activityLoading}>
            <Table
              dataSource={userActivityData}
              rowKey={(record) => record._id || record.id || `${record.timestamp}-${record.userId}`}
              columns={[
                {
                  title: 'Timestamp',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (timestamp) => (
                    <Tooltip title={dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}>
                      <Text>{dayjs(timestamp).format('MMM DD, HH:mm')}</Text>
                    </Tooltip>
                  ),
                  sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
                  defaultSortOrder: 'descend',
                  width: 130,
                },
                {
                  title: 'User',
                  key: 'user',
                  render: (_, record) => (
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                        {record.userName?.[0] || record.userId?.[0] || '?'}
                      </Avatar>
                      <Text>{record.userName || record.userId || 'System'}</Text>
                    </Space>
                  ),
                  width: 200,
                },
                {
                  title: 'Action',
                  dataIndex: 'actionType',
                  key: 'actionType',
                  render: (action) => {
                    const actionColors: Record<string, string> = {
                      login: 'green',
                      logout: 'orange',
                      create: 'blue',
                      read: 'default',
                      update: 'cyan',
                      delete: 'red',
                      upload: 'purple',
                      download: 'magenta',
                    };
                    return (
                      <Tag color={actionColors[action] || 'default'}>
                        {action?.toUpperCase() || 'UNKNOWN'}
                      </Tag>
                    );
                  },
                  width: 100,
                },
                {
                  title: 'Resource',
                  key: 'resource',
                  render: (_, record) => (
                    <Space>
                      <Tag color="blue">{record.resourceType}</Tag>
                      {record.resourceName && (
                        <Text ellipsis style={{ maxWidth: 200 }}>
                          {record.resourceName}
                        </Text>
                      )}
                    </Space>
                  ),
                  width: 250,
                },
                {
                  title: 'Status',
                  dataIndex: 'success',
                  key: 'success',
                  render: (success) => (
                    success ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>SUCCESS</Tag>
                    ) : (
                      <Tag color="red" icon={<CloseCircleOutlined />}>FAILED</Tag>
                    )
                  ),
                  filters: [
                    { text: 'Success', value: true },
                    { text: 'Failed', value: false },
                  ],
                  onFilter: (value, record) => record.success === value,
                  width: 100,
                },
                {
                  title: 'Response Time',
                  dataIndex: 'responseTime',
                  key: 'responseTime',
                  render: (time) => {
                    if (!time) return '-';
                    const color = time < 100 ? 'green' : time < 500 ? 'orange' : 'red';
                    return <Tag color={color}>{time}ms</Tag>;
                  },
                  sorter: (a, b) => (a.responseTime || 0) - (b.responseTime || 0),
                  width: 100,
                },
                {
                  title: 'IP Address',
                  dataIndex: 'ipAddress',
                  key: 'ipAddress',
                  render: (ip) => <Text code>{ip || 'N/A'}</Text>,
                  width: 130,
                },
                {
                  title: 'Details',
                  key: 'details',
                  render: (_, record) => (
                    <Tooltip
                      title={
                        <div>
                          <p>User Agent: {record.userAgent || 'N/A'}</p>
                          {record.metadata && (
                            <p>Metadata: {JSON.stringify(record.metadata, null, 2)}</p>
                          )}
                        </div>
                      }
                    >
                      <Button type="link" size="small" icon={<EyeOutlined />}>
                        View
                      </Button>
                    </Tooltip>
                  ),
                  width: 80,
                },
              ]}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} activities`,
              }}
              scroll={{ x: 1200 }}
              size="small"
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

export default function ReportsPage() {
  return (
    <Suspense fallback={<DashboardLayout><Skeleton active paragraph={{ rows: 12 }} /></DashboardLayout>}>
      <ReportsContent />
    </Suspense>
  );
}