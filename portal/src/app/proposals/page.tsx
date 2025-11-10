'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Card,
  Button,
  Space,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';

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
  const [loading, setLoading] = useState(false);

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
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Proposals"
            value={stats.total}
            prefix={<FileTextOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Pending"
            value={stats.pending}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Processing"
            value={stats.processing}
            prefix={<SyncOutlined spin />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Completed"
            value={stats.completed}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
    </Row>
  );

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Proposals' },
      ]}
    >
      <PageHeader
        title="Proposals"
        subtitle="Manage proposals for Murphy Consulting and E-Systems Management"
        extra={
          <Button
            icon={<SyncOutlined spin={loading} />}
            onClick={fetchStats}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        style={{ marginTop: 24 }}
      >
        <TabPane 
          tab={
            <Space>
              <span>Murphy Consulting</span>
              {murphyStats.processing > 0 && (
                <SyncOutlined spin style={{ color: '#1890ff' }} />
              )}
            </Space>
          } 
          key="murphy"
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {renderStatsCards(murphyStats)}
            
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <h3>Murphy Consulting Proposals</h3>
                <p style={{ color: '#8c8c8c', marginBottom: 24 }}>
                  Proposals are automatically generated from GoHighLevel form submissions
                </p>
                <Space>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => router.push('/proposals/murphy')}
                  >
                    View All Murphy Proposals
                  </Button>
                </Space>
              </div>
            </Card>
          </Space>
        </TabPane>

        <TabPane 
          tab={
            <Space>
              <span>E-Systems Management</span>
              {esystemsStats.processing > 0 && (
                <SyncOutlined spin style={{ color: '#1890ff' }} />
              )}
            </Space>
          } 
          key="esystems"
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {renderStatsCards(esystemsStats)}
            
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <h3>E-Systems Management Proposals</h3>
                <p style={{ color: '#8c8c8c', marginBottom: 24 }}>
                  Product-focused proposals are automatically generated from GoHighLevel form submissions
                </p>
                <Space>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => router.push('/proposals/esystems')}
                  >
                    View All E-Systems Proposals
                  </Button>
                </Space>
              </div>
            </Card>
          </Space>
        </TabPane>
      </Tabs>
    </DashboardLayout>
  );
}
