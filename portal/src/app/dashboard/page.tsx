'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, List, Avatar, Tag, Button, Space, Typography, Progress, Timeline, Empty, Skeleton, InputNumber } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  RiseOutlined,
  PlusOutlined,
  CalendarOutlined,
  TrophyOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StatCard from '@/components/common/StatCard';
import PageHeader from '@/components/common/PageHeader';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

// Mock data - replace with actual API calls
// Keep only the actual revenue here; target will be injected dynamically
const baseRevenue = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 61000 },
  { month: 'May', revenue: 55000 },
  { month: 'Jun', revenue: 67000 },
];

const proposalStatusData = [
  { name: 'Draft', value: 12, color: '#8c8c8c' },
  { name: 'Sent', value: 28, color: '#1677ff' },
  { name: 'Accepted', value: 45, color: '#52c41a' },
  { name: 'Rejected', value: 8, color: '#ff4d4f' },
];

const recentActivities = [
  {
    id: 1,
    type: 'client',
    action: 'New client added',
    detail: 'Tech Solutions Inc.',
    user: 'John Doe',
    time: '2 hours ago',
    color: '#1677ff',
  },
  {
    id: 2,
    type: 'proposal',
    action: 'Proposal accepted',
    detail: 'Web Development Project - $45,000',
    user: 'Jane Smith',
    time: '5 hours ago',
    color: '#52c41a',
  },
  {
    id: 3,
    type: 'accounting',
    action: 'Invoice paid',
    detail: 'Invoice #INV-2024-035',
    user: 'System',
    time: '1 day ago',
    color: '#52c41a',
  },
  {
    id: 4,
    type: 'proposal',
    action: 'Proposal sent',
    detail: 'Mobile App Development',
    user: 'Mike Johnson',
    time: '2 days ago',
    color: '#1677ff',
  },
];

const upcomingTasks = [
  {
    id: 1,
    title: 'Follow up with Tech Solutions',
    dueDate: '2024-01-15',
    priority: 'high',
    status: 'pending',
  },
  {
    id: 2,
    title: 'Prepare Q1 financial report',
    dueDate: '2024-01-20',
    priority: 'medium',
    status: 'in-progress',
  },
  {
    id: 3,
    title: 'Review pending proposals',
    dueDate: '2024-01-18',
    priority: 'low',
    status: 'pending',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  // Revenue target configurable by the user (stored in localStorage)
  const [revenueTarget, setRevenueTarget] = useState<number>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('revenueTarget') : null;
      return saved ? Number(saved) : 60000;
    } catch {
      return 60000;
    }
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('revenueTarget', String(revenueTarget));
      }
    } catch {}
  }, [revenueTarget]);

  const chartData = baseRevenue.map((r) => ({ ...r, target: revenueTarget }));

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <TeamOutlined />;
      case 'proposal':
        return <FileTextOutlined />;
      case 'accounting':
        return <DollarOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your business today."
        extra={
          <Space>
            <Button icon={<CalendarOutlined />} style={{ borderColor: 'white', color: 'white' }}>
              {dayjs().format('MMM DD, YYYY')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/proposals/new')}>
              New Proposal
            </Button>
          </Space>
        }
      />

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Clients"
            value={156}
            trend={12}
            trendLabel="vs last month"
            icon={<TeamOutlined />}
            color="#1677ff"
            loading={loading}
            info="Active clients in your database"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Proposals"
            value={42}
            trend={-5}
            trendLabel="vs last month"
            icon={<FileTextOutlined />}
            color="#52c41a"
            loading={loading}
            info="Proposals awaiting response"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Monthly Revenue"
            value={67000}
            trend={18}
            trendLabel="vs last month"
            icon={<DollarOutlined />}
            color="#fa8c16"
            loading={loading}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
            info="Total revenue this month"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Conversion Rate"
            value={68.5}
            suffix="%"
            trend={3}
            trendLabel="vs last month"
            icon={<TrophyOutlined />}
            color="#722ed1"
            loading={loading}
            decimals={1}
            info="Proposal acceptance rate"
          />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <RiseOutlined />
                <span>Revenue Overview</span>
              </Space>
            }
            extra={
              <Space>
                <Tag color="blue">Actual</Tag>
                <Tag color="green">Target</Tag>
                <InputNumber
                  size="small"
                  min={0}
                  step={1000}
                  value={revenueTarget}
                  onChange={(val) => setRevenueTarget(Number(val) || 0)}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (value ? value.replace(/\$\s?|,/g, '') : '')}
                />
              </Space>
            }
            loading={loading}
            style={{ height: '100%' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1677ff"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#52c41a"
                  fillOpacity={1}
                  fill="url(#colorTarget)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Proposal Status</span>
              </Space>
            }
            loading={loading}
            style={{ height: '100%' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={proposalStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {proposalStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
              {proposalStatusData.map((item) => (
                <Col span={12} key={item.name}>
                  <Space size={4}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        backgroundColor: item.color,
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.name}: {item.value}
                    </Text>
                  </Space>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Activity and Tasks Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>Recent Activity</span>
              </Space>
            }
            extra={<Button type="link">View All</Button>}
            loading={loading}
          >
            <Timeline
              items={recentActivities.map((activity) => ({
                dot: (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `${activity.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: activity.color,
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                ),
                children: (
                  <div style={{ paddingBottom: 16 }}>
                    <Text strong>{activity.action}</Text>
                    <br />
                    <Text>{activity.detail}</Text>
                    <br />
                    <Space size={8} style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {activity.user}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        •
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {activity.time}
                      </Text>
                    </Space>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RocketOutlined />
                <span>Upcoming Tasks</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => router.push('/tasks')}>
                View All
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={upcomingTasks}
              renderItem={(task) => (
                <List.Item
                  actions={[
                    <Tag color={getPriorityColor(task.priority)} key="priority">
                      {task.priority}
                    </Tag>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor:
                            task.status === 'in-progress' ? '#1677ff' : '#f0f0f0',
                        }}
                        icon={
                          task.status === 'in-progress' ? (
                            <SyncOutlined spin />
                          ) : (
                            <ClockCircleOutlined />
                          )
                        }
                      />
                    }
                    title={task.title}
                    description={
                      <Space>
                        <CalendarOutlined />
                        <Text type="secondary">
                          Due {dayjs(task.dueDate).fromNow()}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </DashboardLayout>
  );
}