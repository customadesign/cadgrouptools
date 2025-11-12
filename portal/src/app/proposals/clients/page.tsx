'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Input,
  message,
  Row,
  Col,
  Space,
  Tag,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';
import StatCard from '@/components/ui/StatCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Client {
  _id: string;
  organization: string;
  email: string;
  phone?: string;
  website?: string;
  createdAt: string;
  proposalCount: number;
  latestProposalDate?: string;
  completedProposals: number;
  processingProposals: number;
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchClients();
    }
  }, [status]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clients');
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data.clients || []);
    } catch (error: any) {
      message.error(error.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    searchText === '' ||
    client.organization.toLowerCase().includes(searchText.toLowerCase()) ||
    client.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalClients = clients.length;
  const newThisMonth = clients.filter(c => 
    dayjs(c.createdAt).isAfter(dayjs().startOf('month'))
  ).length;
  const activeProposals = clients.reduce((sum, c) => sum + c.processingProposals, 0);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
      '#EC4899', '#06B6D4', '#EF4444', '#14B8A6'
    ];
    return colors[index % colors.length];
  };

  if (status === 'loading') {
    return (
      <ModernDashboardLayout>
        <LoadingSkeleton type="card" count={6} />
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Clients
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              Companies that have submitted proposals through GoHighLevel forms
            </p>
          </div>
        </div>

        <Input
          placeholder="Search by company name or email..."
          prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 400, borderRadius: '24px' }}
          size="large"
        />
      </motion.div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} className="mb-8 stagger-children">
        <Col xs={24} sm={8}>
          <StatCard
            title="Total Clients"
            value={totalClients}
            icon={<TeamOutlined style={{ fontSize: 20 }} />}
            color="primary"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Active Proposals"
            value={activeProposals}
            icon={<ClockCircleOutlined style={{ fontSize: 20 }} />}
            color="warning"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="New This Month"
            value={newThisMonth}
            icon={<FileTextOutlined style={{ fontSize: 20 }} />}
            color="success"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Clients Grid */}
      {loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Clients will appear here automatically when forms are submitted"
          type="default"
        />
      ) : (
        <Row gutter={[24, 24]} className="stagger-children">
          {filteredClients.map((client, index) => (
            <Col xs={24} sm={12} lg={8} key={client._id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card
                  className="gradient-card cursor-pointer h-full"
                  onClick={() => router.push(`/clients/${client._id}`)}
                  hoverable
                  styles={{ body: { padding: '24px' } }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar
                      size={56}
                      style={{
                        background: `linear-gradient(135deg, ${getAvatarColor(index)} 0%, ${getAvatarColor(index)}dd 100%)`,
                        fontSize: '20px',
                        fontWeight: 'bold',
                      }}
                    >
                      {getInitials(client.organization)}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {client.organization}
                      </h3>
                      <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <MailOutlined className="mr-1" />
                        {client.email}
                      </div>
                      {client.website && (
                        <div className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                          <GlobalOutlined className="mr-1" />
                          {client.website}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Proposal Stats */}
                  <div className="mb-3">
                    <Space size="small" wrap>
                      <Tag
                        icon={<FileTextOutlined />}
                        style={{ borderRadius: '12px', padding: '4px 12px' }}
                      >
                        {client.proposalCount} {client.proposalCount === 1 ? 'proposal' : 'proposals'}
                      </Tag>
                      {client.completedProposals > 0 && (
                        <Tag
                          color="success"
                          icon={<CheckCircleOutlined />}
                          style={{ borderRadius: '12px', padding: '4px 12px' }}
                        >
                          {client.completedProposals} completed
                        </Tag>
                      )}
                      {client.processingProposals > 0 && (
                        <Tag
                          color="processing"
                          icon={<ClockCircleOutlined />}
                          style={{ borderRadius: '12px', padding: '4px 12px' }}
                        >
                          {client.processingProposals} processing
                        </Tag>
                      )}
                    </Space>
                  </div>

                  {/* Latest Activity */}
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {client.latestProposalDate ? (
                      <>Latest: {dayjs(client.latestProposalDate).fromNow()}</>
                    ) : (
                      <>Joined {dayjs(client.createdAt).fromNow()}</>
                    )}
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      )}
    </ModernDashboardLayout>
  );
}

