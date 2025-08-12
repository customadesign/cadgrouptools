'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Avatar,
  Dropdown,
  Modal,
  message,
  Tooltip,
  Row,
  Col,
  Card,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { clientApi } from '@/services/api';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: 'active' | 'inactive' | 'prospect';
  totalProjects: number;
  totalRevenue: number;
  createdAt: string;
  lastContact: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await clientApi.getAll();
      // setClients(response.data);
      
      // Mock data
      const mockClients: Client[] = [
        {
          _id: '1',
          name: 'John Smith',
          email: 'john.smith@techcorp.com',
          phone: '+1 (555) 123-4567',
          company: 'Tech Corp Solutions',
          address: '123 Business Ave, New York, NY 10001',
          status: 'active',
          totalProjects: 12,
          totalRevenue: 125000,
          createdAt: '2024-01-01',
          lastContact: '2024-01-10',
        },
        {
          _id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@innovate.io',
          phone: '+1 (555) 234-5678',
          company: 'Innovate IO',
          address: '456 Tech Street, San Francisco, CA 94102',
          status: 'active',
          totalProjects: 8,
          totalRevenue: 89000,
          createdAt: '2023-11-15',
          lastContact: '2024-01-08',
        },
        {
          _id: '3',
          name: 'Michael Chen',
          email: 'mchen@globalventures.com',
          phone: '+1 (555) 345-6789',
          company: 'Global Ventures Ltd',
          address: '789 Commerce Blvd, Chicago, IL 60601',
          status: 'prospect',
          totalProjects: 0,
          totalRevenue: 0,
          createdAt: '2024-01-05',
          lastContact: '2024-01-05',
        },
        {
          _id: '4',
          name: 'Emily Davis',
          email: 'emily.davis@creative.design',
          phone: '+1 (555) 456-7890',
          company: 'Creative Design Studio',
          address: '321 Art Lane, Los Angeles, CA 90001',
          status: 'inactive',
          totalProjects: 5,
          totalRevenue: 45000,
          createdAt: '2023-06-20',
          lastContact: '2023-12-01',
        },
      ];
      
      setTimeout(() => {
        setClients(mockClients);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Failed to fetch clients');
      setLoading(false);
    }
  };

  const handleDelete = async (client: Client) => {
    setClientToDelete(client);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    
    try {
      // await clientApi.delete(clientToDelete._id);
      message.success('Client deleted successfully');
      setClients(clients.filter(c => c._id !== clientToDelete._id));
      setDeleteModalVisible(false);
      setClientToDelete(null);
    } catch (error) {
      message.error('Failed to delete client');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'prospect':
        return 'blue';
      default:
        return 'default';
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchText.toLowerCase()) ||
      client.company.toLowerCase().includes(searchText.toLowerCase()) ||
      client.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<Client> = [
    {
      title: 'Client',
      key: 'client',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.company}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <MailOutlined style={{ color: '#8c8c8c' }} />
            <span style={{ fontSize: 13 }}>{record.email}</span>
          </Space>
          <Space size={4}>
            <PhoneOutlined style={{ color: '#8c8c8c' }} />
            <span style={{ fontSize: 13 }}>{record.phone}</span>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Prospect', value: 'prospect' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Projects',
      dataIndex: 'totalProjects',
      key: 'totalProjects',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.totalProjects - b.totalProjects,
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
      render: (revenue) => (
        <span style={{ fontWeight: 500 }}>
          ${revenue.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Last Contact',
      dataIndex: 'lastContact',
      key: 'lastContact',
      width: 130,
      sorter: (a, b) => dayjs(a.lastContact).unix() - dayjs(b.lastContact).unix(),
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/clients/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => router.push(`/clients/${record._id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as string[]);
    },
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Clients' },
      ]}
    >
      <PageHeader
        title="Clients"
        subtitle="Manage your client relationships and contact information"
        extra={
          <Space>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/clients/new')}
            >
              Add Client
            </Button>
          </Space>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search clients..."
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
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Prospect', value: 'prospect' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={fetchClients}
                loading={loading}
              >
                Refresh
              </Button>
              {selectedRowKeys.length > 0 && (
                <Button
                  size="large"
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Selected Clients',
                      content: `Are you sure you want to delete ${selectedRowKeys.length} clients?`,
                      okText: 'Delete',
                      okType: 'danger',
                      onOk: () => {
                        message.success(`${selectedRowKeys.length} clients deleted`);
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

      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredClients}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} clients`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No clients found"
              >
                <Button type="primary" onClick={() => router.push('/clients/new')}>
                  Add First Client
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      <Modal
        title="Delete Client"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setClientToDelete(null);
        }}
        okText="Delete"
        okType="danger"
      >
        <p>
          Are you sure you want to delete client <strong>{clientToDelete?.name}</strong>?
        </p>
        <p>This action cannot be undone.</p>
      </Modal>
    </DashboardLayout>
  );
}