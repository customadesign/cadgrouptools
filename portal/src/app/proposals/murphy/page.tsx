'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Input, Select, Space, message, Row, Col, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';

const { Option } = Select;

interface Proposal {
  _id: string;
  client: {
    _id: string;
    organization: string;
    email: string;
  };
  status: string;
  createdAt: string;
  manusTask: {
    status: string;
    manusTaskId: string;
  };
  googleSlidesUrl?: string;
}

export default function MurphyProposalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProposals();
    }
  }, [status]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        company: 'murphy',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchText && { search: searchText }),
      });

      const response = await fetch(`/api/proposals?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (error: any) {
      message.error(error.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = searchText === '' || 
      p.client.organization.toLowerCase().includes(searchText.toLowerCase()) ||
      p.client.email.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  if (status === 'loading' || !session) {
    return (
      <ModernDashboardLayout>
        <LoadingSkeleton type="card" count={6} />
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Murphy Consulting Proposals
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              Web services proposals at $35/hour
            </p>
          </div>
        </div>

        {/* Filters */}
        <Space size="middle" className="w-full md:w-auto">
          <Input
            placeholder="Search by client name..."
            prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, borderRadius: '24px' }}
            size="large"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150, borderRadius: '24px' }}
            size="large"
          >
            <Option value="all">All Status</Option>
            <Option value="draft">Draft</Option>
            <Option value="processing">Processing</Option>
            <Option value="finalized">Finalized</Option>
            <Option value="sent">Sent</Option>
          </Select>
        </Space>
      </motion.div>

      {/* Proposals Grid */}
      {loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : filteredProposals.length === 0 ? (
        <EmptyState
          title="No proposals found"
          description="Proposals will appear here automatically when forms are submitted"
          type="proposals"
        />
      ) : (
        <Row gutter={[24, 24]} className="stagger-children">
          {filteredProposals.map((proposal, index) => (
            <Col xs={24} sm={12} lg={8} key={proposal._id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card
                  className="gradient-card cursor-pointer h-full"
                  onClick={() => router.push(`/proposals/murphy/${proposal._id}`)}
                  hoverable
                  styles={{ body: { padding: '24px' } }}
                >
                  {/* Status Badge */}
                  <div className="mb-4">
                    <StatusBadge status={proposal.manusTask?.status || proposal.status as any} />
                  </div>

                  {/* Client Info */}
                  <div className="mb-4">
                    <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {proposal.client.organization}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {proposal.client.email}
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    Created {new Date(proposal.createdAt).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <Space size="small" className="w-full justify-between">
                    <div
                      className="text-sm font-medium flex items-center gap-1"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      View Details <EyeOutlined />
                    </div>
                    {proposal.googleSlidesUrl && (
                      <a
                        href={proposal.googleSlidesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium flex items-center gap-1"
                        style={{ color: 'var(--color-success)' }}
                      >
                        Slides <DownloadOutlined />
                      </a>
                    )}
                  </Space>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      )}
    </ModernDashboardLayout>
  );
}
