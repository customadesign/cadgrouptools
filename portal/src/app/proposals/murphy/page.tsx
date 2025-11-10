'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Table, Card, Badge, Button, Input, Select, Space, message } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined, MailOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: 'Draft' },
      processing: { color: 'processing', text: 'Processing' },
      finalized: { color: 'success', text: 'Finalized' },
      sent: { color: 'blue', text: 'Sent' },
      failed: { color: 'error', text: 'Failed' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Badge status={config.color as any} text={config.text} />;
  };

  const getManusStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: 'Pending' },
      processing: { color: 'processing', text: 'Processing' },
      completed: { color: 'success', text: 'Completed' },
      failed: { color: 'error', text: 'Failed' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Badge status={config.color as any} text={config.text} />;
  };

  const columns: ColumnsType<Proposal> = [
    {
      title: 'Client',
      dataIndex: ['client', 'organization'],
      key: 'organization',
      sorter: (a, b) => a.client.organization.localeCompare(b.client.organization),
    },
    {
      title: 'Email',
      dataIndex: ['client', 'email'],
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Processing', value: 'processing' },
        { text: 'Finalized', value: 'finalized' },
        { text: 'Sent', value: 'sent' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Manus Status',
      dataIndex: ['manusTask', 'status'],
      key: 'manusStatus',
      render: (status: string) => status ? getManusStatusBadge(status) : '-',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/proposals/murphy/${record._id}`)}
          >
            View
          </Button>
          {record.googleSlidesUrl && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              href={record.googleSlidesUrl}
              target="_blank"
            >
              Slides
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (status === 'loading' || !session) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Murphy Consulting Proposals"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchProposals}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} size="middle">
          <Input
            placeholder="Search by client name"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={fetchProposals}
            style={{ width: 250 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Status</Option>
            <Option value="draft">Draft</Option>
            <Option value="processing">Processing</Option>
            <Option value="finalized">Finalized</Option>
            <Option value="sent">Sent</Option>
            <Option value="failed">Failed</Option>
          </Select>
          <Button type="primary" onClick={fetchProposals}>
            Search
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={proposals}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} proposals`,
          }}
        />
      </Card>
    </div>
  );
}

