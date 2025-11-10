'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Space, Typography, Timeline } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  PlusOutlined,
  CalendarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';
import StatCard from '@/components/ui/StatCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const recentActivities = [
  {
    id: 1,
    type: 'proposal',
    action: 'New proposal generated',
    detail: 'Murphy Consulting - Tech Solutions Inc.',
    user: 'Manus AI',
    time: '2 hours ago',
    color: '#3B82F6',
  },
  {
    id: 2,
    type: 'accounting',
    action: 'Document processed',
    detail: 'Murphy Web Services - October 2024',
    user: 'Manus AI',
    time: '5 hours ago',
    color: '#10B981',
  },
  {
    id: 3,
    type: 'proposal',
    action: 'Proposal sent',
    detail: 'E-Systems Management - Product Package',
    user: 'You',
    time: '1 day ago',
    color: '#3B82F6',
  },
];

const quickActions = [
  {
    title: 'Upload Document',
    description: 'Add accounting documents',
    icon: <FileTextOutlined style={{ fontSize: 24 }} />,
    color: '#3B82F6',
    onClick: '/accounting-manus',
  },
  {
    title: 'View Proposals',
    description: 'Check proposal status',
    icon: <FileTextOutlined style={{ fontSize: 24 }} />,
    color: '#10B981',
    onClick: '/proposals',
  },
  {
    title: 'New Client',
    description: 'Add a new client',
    icon: <TeamOutlined style={{ fontSize: 24 }} />,
    color: '#F59E0B',
    onClick: '/clients/new',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <ModernDashboardLayout>
        <LoadingSkeleton type="card" count={4} />
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>
              Welcome back! 👋
            </Title>
            <Text style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              {dayjs().format('dddd, MMMM D, YYYY')}
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => router.push('/accounting-manus')}
            style={{ borderRadius: '24px' }}
          >
            Upload Document
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} className="mb-8 stagger-children">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Proposals"
            value={24}
            prefix={<FileTextOutlined style={{ fontSize: 24 }} />}
            trend={{ value: 12, isPositive: true }}
            color="primary"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Review"
            value={8}
            prefix={<ClockCircleOutlined style={{ fontSize: 24 }} />}
            trend={{ value: 5, isPositive: false }}
            color="warning"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Monthly Revenue"
            value="$45K"
            prefix={<DollarOutlined style={{ fontSize: 24 }} />}
            trend={{ value: 18, isPositive: true }}
            color="success"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Documents Processed"
            value={156}
            prefix={<FileTextOutlined style={{ fontSize: 24 }} />}
            trend={{ value: 23, isPositive: true }}
            color="primary"
          />
        </Col>
      </Row>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Title level={4} style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
          Quick Actions
        </Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={8} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className="cursor-pointer gradient-card h-full"
                  onClick={() => router.push(action.onClick)}
                  hoverable
                >
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${action.color} 0%, ${action.color}dd 100%)`,
                      }}
                    >
                      {action.icon}
                    </div>
                    <div>
                      <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {action.title}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {action.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: action.color }}>
                      <span className="text-sm font-medium">Get started</span>
                      <ArrowRightOutlined style={{ fontSize: 12 }} />
                    </div>
                  </Space>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Recent Activity */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: 'var(--color-primary)' }} />
                  <span>Recent Activity</span>
                </Space>
              }
              className="gradient-card"
            >
              <Timeline
                items={recentActivities.map((activity) => ({
                  dot: (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${activity.color} 0%, ${activity.color}dd 100%)`,
                      }}
                    >
                      {activity.type === 'proposal' ? <FileTextOutlined /> : <DollarOutlined />}
                    </div>
                  ),
                  children: (
                    <div className="pb-4">
                      <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {activity.action}
                      </div>
                      <div className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {activity.detail}
                      </div>
                      <Space size={8}>
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
          </motion.div>
        </Col>

        <Col xs={24} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card
              title={
                <Space>
                  <RocketOutlined style={{ color: 'var(--color-success)' }} />
                  <span>System Status</span>
                </Space>
              }
              className="gradient-card"
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div className="flex justify-between items-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Manus AI
                    </div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>
                      Online
                    </div>
                  </div>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--color-success)' }} />
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      GoHighLevel
                    </div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>
                      Connected
                    </div>
                  </div>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--color-success)' }} />
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Claude Assistant
                    </div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>
                      Ready
                    </div>
                  </div>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--color-success)' }} />
                </div>
              </Space>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </ModernDashboardLayout>
  );
}
