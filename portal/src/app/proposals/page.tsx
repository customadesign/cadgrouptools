'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Badge,
  Dropdown,
  Modal,
  message,
  Tooltip,
  Row,
  Col,
  Card,
  Empty,
  Progress,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  CopyOutlined,
  DownloadOutlined,
  FilterOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { proposalApi } from '@/services/api';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

const { Search } = Input;

interface Proposal {
  _id: string;
  title: string;
  clientName: string;
  clientCompany: string;
  value: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  description: string;
}

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await proposalApi.getAll();
      // setProposals(response.data);
      
      // Mock data
      const mockProposals: Proposal[] = [
        {
          _id: '1',
          title: 'Web Development Project',
          clientName: 'John Smith',
          clientCompany: 'Tech Corp Solutions',
          value: 45000,
          status: 'accepted',
          validUntil: '2024-02-01',
          createdAt: '2024-01-01',
          sentAt: '2024-01-02',
          viewedAt: '2024-01-03',
          respondedAt: '2024-01-05',
          description: 'Complete web application development with React and Node.js',
        },
        {
          _id: '2',
          title: 'Mobile App Development',
          clientName: 'Sarah Johnson',
          clientCompany: 'Innovate IO',
          value: 65000,
          status: 'sent',
          validUntil: '2024-02-15',
          createdAt: '2024-01-08',
          sentAt: '2024-01-09',
          description: 'Native iOS and Android application development',
        },
        {
          _id: '3',
          title: 'Cloud Migration Services',
          clientName: 'Michael Chen',
          clientCompany: 'Global Ventures Ltd',
          value: 35000,
          status: 'draft',
          validUntil: '2024-02-20',
          createdAt: '2024-01-10',
          description: 'AWS cloud migration and infrastructure setup',
        },
        {
          _id: '4',
          title: 'UI/UX Design Package',
          clientName: 'Emily Davis',
          clientCompany: 'Creative Design Studio',
          value: 15000,
          status: 'viewed',
          validUntil: '2024-01-25',
          createdAt: '2024-01-05',
          sentAt: '2024-01-06',
          viewedAt: '2024-01-07',
          description: 'Complete UI/UX redesign for existing application',
        },
        {
          _id: '5',
          title: 'API Integration Services',
          clientName: 'Robert Wilson',
          clientCompany: 'DataFlow Systems',
          value: 25000,
          status: 'rejected',
          validUntil: '2024-01-20',
          createdAt: '2023-12-28',
          sentAt: '2023-12-29',
          viewedAt: '2023-12-30',
          respondedAt: '2024-01-02',
          description: 'Third-party API integration and data synchronization',
        },
      ];
      
      setTimeout(() => {
        setProposals(mockProposals);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Failed to fetch proposals');
      setLoading(false);
    }
  };

  const handleDelete = async (proposal: Proposal) => {
    setProposalToDelete(proposal);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!proposalToDelete) return;
    
    try {
      // await proposalApi.delete(proposalToDelete._id);
      message.success('Proposal deleted successfully');
      setProposals(proposals.filter(p => p._id !== proposalToDelete._id));
      setDeleteModalVisible(false);
      setProposalToDelete(null);
    } catch (error) {
      message.error('Failed to delete proposal');
    }
  };

  const handleDuplicate = (proposal: Proposal) => {
    message.success('Proposal duplicated successfully');
    // Implement duplication logic
  };

  const handleSend = (proposal: Proposal) => {
    message.success('Proposal sent to client');
    // Implement send logic
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'blue';
      case 'viewed':
        return 'orange';
      case 'accepted':
        return 'green';
      case 'rejected':
        return 'red';
      case 'expired':
        return 'gray';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <EditOutlined />;
      case 'sent':
        return <SendOutlined />;
      case 'viewed':
        return <EyeOutlined />;
      case 'accepted':
        return <CheckCircleOutlined />;
      case 'rejected':
        return <CloseCircleOutlined />;
      case 'expired':
        return <ClockCircleOutlined />;
      default:
        return null;
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = 
      proposal.title.toLowerCase().includes(searchText.toLowerCase()) ||
      proposal.clientName.toLowerCase().includes(searchText.toLowerCase()) ||
      proposal.clientCompany.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || proposal.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getActionMenu = (record: Proposal): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View',
      onClick: () => router.push(`/proposals/${record._id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => router.push(`/proposals/${record._id}/edit`),
    },
    record.status === 'draft' && {
      key: 'send',
      icon: <SendOutlined />,
      label: 'Send to Client',
      onClick: () => handleSend(record),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Duplicate',
      onClick: () => handleDuplicate(record),
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: 'Download PDF',
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => handleDelete(record),
    },
  ].filter(Boolean);

  const columns: ColumnsType<Proposal> = [
    {
      title: 'Proposal',
      key: 'proposal',
      fixed: 'left',
      width: 300,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {record.title}
          </div>
          <Space size={4}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              {record.clientName}
            </span>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>•</span>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              {record.clientCompany}
            </span>
          </Space>
        </div>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.value - b.value,
      render: (value) => (
        <span style={{ fontWeight: 500, fontSize: 14 }}>
          ${value.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Sent', value: 'sent' },
        { text: 'Viewed', value: 'viewed' },
        { text: 'Accepted', value: 'accepted' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Expired', value: 'expired' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag 
          icon={getStatusIcon(status)} 
          color={getStatusColor(status)}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 130,
      sorter: (a, b) => dayjs(a.validUntil).unix() - dayjs(b.validUntil).unix(),
      render: (date) => {
        const daysLeft = dayjs(date).diff(dayjs(), 'days');
        const isExpired = daysLeft < 0;
        const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0;
        
        return (
          <Space direction="vertical" size={0}>
            <span>{dayjs(date).format('MMM DD, YYYY')}</span>
            {isExpired ? (
              <span style={{ fontSize: 11, color: '#ff4d4f' }}>
                Expired
              </span>
            ) : isExpiringSoon ? (
              <span style={{ fontSize: 11, color: '#fa8c16' }}>
                {daysLeft} days left
              </span>
            ) : (
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                {daysLeft} days left
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Activity',
      key: 'activity',
      width: 180,
      render: (_, record) => {
        if (record.respondedAt) {
          return (
            <Space size={4}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span style={{ fontSize: 12 }}>
                Responded {dayjs(record.respondedAt).fromNow()}
              </span>
            </Space>
          );
        }
        if (record.viewedAt) {
          return (
            <Space size={4}>
              <EyeOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 12 }}>
                Viewed {dayjs(record.viewedAt).fromNow()}
              </span>
            </Space>
          );
        }
        if (record.sentAt) {
          return (
            <Space size={4}>
              <SendOutlined style={{ color: '#8c8c8c' }} />
              <span style={{ fontSize: 12 }}>
                Sent {dayjs(record.sentAt).fromNow()}
              </span>
            </Space>
          );
        }
        return (
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            Not sent yet
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionMenu(record) }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as string[]);
    },
  };

  // Calculate statistics
  const totalValue = filteredProposals.reduce((sum, p) => sum + p.value, 0);
  const acceptedValue = filteredProposals
    .filter(p => p.status === 'accepted')
    .reduce((sum, p) => sum + p.value, 0);
  const acceptanceRate = filteredProposals.length > 0
    ? (filteredProposals.filter(p => p.status === 'accepted').length / filteredProposals.length) * 100
    : 0;

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Proposals' },
      ]}
    >
      <PageHeader
        title="Proposals"
        subtitle="Manage your proposals and track their status"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/proposals/new')}
            >
              Create Proposal
            </Button>
          </Space>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Proposals"
              value={filteredProposals.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Value"
              value={totalValue}
              prefix="$"
              formatter={(value) => `${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Acceptance Rate"
              value={acceptanceRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: acceptanceRate > 50 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search proposals..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="Filter by status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Draft', value: 'draft' },
                { label: 'Sent', value: 'sent' },
                { label: 'Viewed', value: 'viewed' },
                { label: 'Accepted', value: 'accepted' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Expired', value: 'expired' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              {selectedRowKeys.length > 0 && (
                <Button
                  size="large"
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Selected Proposals',
                      content: `Are you sure you want to delete ${selectedRowKeys.length} proposals?`,
                      okText: 'Delete',
                      okType: 'danger',
                      onOk: () => {
                        message.success(`${selectedRowKeys.length} proposals deleted`);
                        setSelectedRowKeys([]);
                      },
                    });
                  }}
                >
                  Delete ({selectedRowKeys.length})
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredProposals}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} proposals`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No proposals found"
              >
                <Button type="primary" onClick={() => router.push('/proposals/new')}>
                  Create First Proposal
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Delete Modal */}
      <Modal
        title="Delete Proposal"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setProposalToDelete(null);
        }}
        okText="Delete"
        okType="danger"
      >
        <p>
          Are you sure you want to delete proposal <strong>{proposalToDelete?.title}</strong>?
        </p>
        <p>This action cannot be undone.</p>
      </Modal>
    </DashboardLayout>
  );
}