'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Space, Row, Col } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';
import StatCard from '@/components/ui/StatCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const { TabPane } = Tabs;

interface ProposalStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export default function ProposalsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('murphy');
  const [loading, setLoading] = useState(true);
  const [murphyStats, setMurphyStats] = useState<ProposalStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [esystemsStats, setESystemsStats] = useState<ProposalStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch Murphy stats
      const murphyResponse = await fetch('/api/proposals?company=murphy');
      if (murphyResponse.ok) {
        const murphyData = await murphyResponse.json();
        const proposals = murphyData.proposals || [];
        setMurphyStats({
          total: proposals.length,
          pending: proposals.filter((p: any) => p.status === 'draft').length,
          processing: proposals.filter((p: any) => p.manusTask?.status === 'processing').length,
          completed: proposals.filter((p: any) => p.status === 'finalized' || p.manusTask?.status === 'completed').length,
          failed: proposals.filter((p: any) => p.status === 'failed').length,
        });
      }

      // Fetch E-Systems stats
      const esystemsResponse = await fetch('/api/proposals?company=esystems');
      if (esystemsResponse.ok) {
        const esystemsData = await esystemsResponse.json();
        const proposals = esystemsData.proposals || [];
        setESystemsStats({
          total: proposals.length,
          pending: proposals.filter((p: any) => p.status === 'draft').length,
          processing: proposals.filter((p: any) => p.manusTask?.status === 'processing').length,
          completed: proposals.filter((p: any) => p.status === 'finalized' || p.manusTask?.status === 'completed').length,
          failed: proposals.filter((p: any) => p.status === 'failed').length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatsCards = (stats: ProposalStats) => (
    <Row gutter={[16, 16]} className="stagger-children">
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Total Proposals"
          value={stats.total}
          icon={<FileTextOutlined style={{ fontSize: 20 }} />}
          color="primary"
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<ClockCircleOutlined style={{ fontSize: 20 }} />}
          color="warning"
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Processing"
          value={stats.processing}
          icon={<SyncOutlined style={{ fontSize: 20 }} />}
          color="primary"
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircleOutlined style={{ fontSize: 20 }} />}
          color="success"
          loading={loading}
        />
      </Col>
    </Row>
  );

  return (
    <ModernDashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Proposals
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Manage proposals for Murphy Consulting and E-Systems Management
        </p>
      </motion.div>

      {/* How It Works Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          className="gradient-card mb-6"
          styles={{ body: { padding: '24px' } }}
          style={{
            background: 'linear-gradient(135deg, #3B82F620 0%, #10B98120 100%)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <Row gutter={24} align="middle">
            <Col xs={24} md={16}>
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
                >
                  <FileTextOutlined style={{ fontSize: 24, color: 'white' }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    📋 How Proposals Work
                  </h3>
                  <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Proposals are <strong>automatically generated</strong> when clients submit forms on your GoHighLevel pages. 
                    Manus AI researches their business and creates professional Google Slides presentations.
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    ✨ No manual upload needed - everything happens automatically via webhooks!
                  </p>
                </div>
              </div>
            </Col>
            <Col xs={24} md={8} className="text-center md:text-right">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  href="https://app.venderflow.com/v2/location/62kZ0CQqMotRWvdIjMZS/form-builder/main?folder=Js6hHNkJvK4oKPSmoclb"
                  target="_blank"
                  size="large"
                  style={{ borderRadius: '24px', width: '100%' }}
                >
                  📝 Murphy Forms
                </Button>
                <Button
                  type="default"
                  href="https://link.esystemsmanagement.com/widget/form/Dencs4XQEHrrOmkLPuCz"
                  target="_blank"
                  size="large"
                  style={{ borderRadius: '24px', width: '100%' }}
                >
                  📝 E-Systems Form
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </motion.div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        animated={{ inkBar: true, tabPane: true }}
      >
        <TabPane
          tab={
            <Space>
              <span className="font-semibold">Murphy Consulting</span>
              {murphyStats.processing > 0 && <SyncOutlined spin style={{ color: '#3B82F6' }} />}
            </Space>
          }
          key="murphy"
        >
          <Space direction="vertical" size={24} style={{ width: '100%', marginTop: 24 }}>
            {renderStatsCards(murphyStats)}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="gradient-card text-center" style={{ padding: '40px 20px' }}>
                <div className="mb-4">
                  <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white mb-4"
                    style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
                  >
                    <FileTextOutlined style={{ fontSize: 40 }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Murphy Consulting Proposals
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Proposals are automatically generated from GoHighLevel form submissions at $35/hour
                  </p>
                </div>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => router.push('/proposals/murphy')}
                  icon={<ArrowRightOutlined />}
                  style={{ borderRadius: '24px', height: '48px', padding: '0 32px' }}
                >
                  View All Murphy Proposals
                </Button>
              </Card>
            </motion.div>
          </Space>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <span className="font-semibold">E-Systems Management</span>
              {esystemsStats.processing > 0 && <SyncOutlined spin style={{ color: '#3B82F6' }} />}
            </Space>
          }
          key="esystems"
        >
          <Space direction="vertical" size={24} style={{ width: '100%', marginTop: 24 }}>
            {renderStatsCards(esystemsStats)}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="gradient-card text-center" style={{ padding: '40px 20px' }}>
                <div className="mb-4">
                  <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white mb-4"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                  >
                    <FileTextOutlined style={{ fontSize: 40 }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    E-Systems Management Proposals
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Product-focused proposals automatically generated from form submissions
                  </p>
                </div>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => router.push('/proposals/esystems')}
                  icon={<ArrowRightOutlined />}
                  style={{ borderRadius: '24px', height: '48px', padding: '0 32px' }}
                >
                  View All E-Systems Proposals
                </Button>
              </Card>
            </motion.div>
          </Space>
        </TabPane>
      </Tabs>
    </ModernDashboardLayout>
  );
}
