'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Modal,
  Form,
  Select,
  message,
  Dropdown,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Switch,
  Tooltip,
  Badge,
  Divider,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  MoreOutlined,
  MailOutlined,
  TeamOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserAddOutlined,
  KeyOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Pat Murphy',
      email: 'hpmurphy@icloud.com',
      role: 'admin',
      department: 'Management',
      status: 'active',
      lastLogin: '2025-01-13T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'John Smith',
      email: 'john.smith@cadgroup.com',
      role: 'staff',
      department: 'Sales',
      status: 'active',
      lastLogin: '2025-01-12T14:20:00Z',
      createdAt: '2024-03-15T00:00:00Z',
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      email: 'sarah.j@cadgroup.com',
      role: 'staff',
      department: 'Marketing',
      status: 'active',
      lastLogin: '2025-01-13T09:00:00Z',
      createdAt: '2024-05-20T00:00:00Z',
    },
    {
      id: '4',
      name: 'Mike Wilson',
      email: 'mike.w@cadgroup.com',
      role: 'staff',
      department: 'Engineering',
      status: 'inactive',
      lastLogin: '2024-12-15T16:45:00Z',
      createdAt: '2024-02-10T00:00:00Z',
    },
    {
      id: '5',
      name: 'Emily Davis',
      email: 'emily.d@cadgroup.com',
      role: 'admin',
      department: 'HR',
      status: 'active',
      lastLogin: '2025-01-13T11:00:00Z',
      createdAt: '2024-04-01T00:00:00Z',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDeleteUser = (user: User) => {
    confirm({
      title: 'Delete User',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setUsers(users.filter(u => u.id !== user.id));
        message.success('User deleted successfully');
      },
    });
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, status: newStatus } : u
    ));
    message.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
  };

  const handleResetPassword = (user: User) => {
    confirm({
      title: 'Reset Password',
      icon: <KeyOutlined />,
      content: `Send password reset email to ${user.email}?`,
      onOk: () => {
        message.success('Password reset email sent successfully');
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (editingUser) {
        setUsers(users.map(u => 
          u.id === editingUser.id ? { ...u, ...values } : u
        ));
        message.success('User updated successfully');
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          lastLogin: '-',
          createdAt: new Date().toISOString(),
        };
        setUsers([...users, newUser]);
        message.success('User created successfully');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Please fill in all required fields');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchText.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'gold' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          active: { color: 'green', icon: <CheckCircleOutlined /> },
          inactive: { color: 'gray', icon: <CloseCircleOutlined /> },
          suspended: { color: 'red', icon: <ExclamationCircleOutlined /> },
        };
        return (
          <Tag color={config[status as keyof typeof config].color} icon={config[status as keyof typeof config].icon}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string) => date === '-' ? '-' : dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Button
              type="text"
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'reset',
                  label: 'Reset Password',
                  icon: <KeyOutlined />,
                  onClick: () => handleResetPassword(record),
                },
                {
                  key: 'email',
                  label: 'Send Email',
                  icon: <MailOutlined />,
                  onClick: () => message.info('Email composer would open here'),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  label: 'Delete User',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteUser(record),
                  disabled: record.email === session?.user?.email,
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    recentLogins: users.filter(u => {
      if (u.lastLogin === '-') return false;
      return dayjs().diff(dayjs(u.lastLogin), 'day') <= 7;
    }).length,
  };

  // Only admins can access this page
  if (session?.user?.role !== 'admin') {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: 'Admin', href: '/admin' },
          { title: 'User Management' },
        ]}
      >
        <Alert
          message="Access Denied"
          description="You need administrator privileges to access this page."
          type="error"
          showIcon
          style={{ maxWidth: 600, margin: '100px auto' }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'User Management' },
      ]}
    >
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts and permissions"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.info('Refreshing...')}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />}>
              Export
            </Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={handleAddUser}>
              Add User
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.total}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Administrators"
              value={stats.admins}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Recent Logins (7d)"
              value={stats.recentLogins}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Select
            value={filterRole}
            onChange={setFilterRole}
            style={{ width: 120 }}
            placeholder="Filter by role"
          >
            <Option value="all">All Roles</Option>
            <Option value="admin">Admin</Option>
            <Option value="staff">Staff</Option>
          </Select>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 120 }}
            placeholder="Filter by status"
          >
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="suspended">Suspended</Option>
          </Select>
          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setSearchText('');
              setFilterRole('all');
              setFilterStatus('all');
            }}
          >
            Clear Filters
          </Button>
        </Space>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredUsers()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
          }}
        />
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: 'staff',
            department: 'Sales',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Full Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Invalid email format' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                  disabled={!!editingUser}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select Role">
                  <Option value="admin">Admin</Option>
                  <Option value="staff">Staff</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select Department">
                  <Option value="Management">Management</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Engineering">Engineering</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Support">Support</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Alert
              message="Initial Password"
              description="A temporary password will be sent to the user's email address. They will be required to change it on first login."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Form>
      </Modal>
    </DashboardLayout>
  );
}