'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Timeline,
  Table,
  Tag,
  Button,
  Space,
  Avatar,
  Descriptions,
  Statistic,
  List,
  Empty,
  Progress,
  message,
  Dropdown,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  MessageOutlined,
  MoreOutlined,
  TeamOutlined,
  TrophyOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { clientApi } from '@/services/api';
import dayjs from 'dayjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const { TextArea } = Input;

// Default client structure for initial state
const defaultClient = {
  _id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organization: '',
  jobTitle: '',
  industry: '',
  companySize: '',
  website: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  status: 'active',
  leadSource: '',
  estimatedValue: 0,
  totalProjects: 0,
  completedProjects: 0,
  totalRevenue: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastContact: new Date().toISOString(),
  linkedin: '',
  twitter: '',
  notes: '',
  avatar: '',
};

const mockProposals = [
  {
    id: '1',
    title: 'Web Development Project',
    status: 'accepted',
    value: 45000,
    date: '2024-01-05',
  },
  {
    id: '2',
    title: 'Mobile App Development',
    status: 'sent',
    value: 65000,
    date: '2024-01-08',
  },
  {
    id: '3',
    title: 'Cloud Migration',
    status: 'draft',
    value: 35000,
    date: '2024-01-10',
  },
];

const mockActivities = [
  {
    id: 1,
    type: 'email',
    title: 'Email sent',
    description: 'Sent proposal for new project',
    date: '2024-01-10',
  },
  {
    id: 2,
    type: 'call',
    title: 'Phone call',
    description: 'Discussed project requirements',
    date: '2024-01-08',
  },
  {
    id: 3,
    type: 'meeting',
    title: 'Meeting scheduled',
    description: 'Quarterly review meeting',
    date: '2024-01-05',
  },
];

const revenueData = [
  { month: 'Jan', revenue: 15000 },
  { month: 'Feb', revenue: 20000 },
  { month: 'Mar', revenue: 18000 },
  { month: 'Apr', revenue: 25000 },
  { month: 'May', revenue: 22000 },
  { month: 'Jun', revenue: 30000 },
];

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(defaultClient);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (params.id) {
      fetchClient();
    }
  }, [params.id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await clientApi.getById(params.id as string);
      const clientData = response.data.client;
      
      // Transform the data to match the expected format
      const transformedClient = {
        ...defaultClient,
        ...clientData,
        // Use organization as company if company field doesn't exist
        company: clientData.organization || clientData.company,
        // Parse address fields
        address: clientData.address?.line1 || '',
        city: clientData.address?.city || '',
        state: clientData.address?.state || '',
        zipCode: clientData.address?.postalCode || '',
        country: clientData.address?.country || '',
        // Set default values for missing fields
        firstName: clientData.firstName || clientData.organization?.split(' ')[0] || 'Unknown',
        lastName: clientData.lastName || clientData.organization?.split(' ').slice(1).join(' ') || 'Client',
        totalProjects: clientData.totalProjects || 0,
        completedProjects: clientData.completedProjects || 0,
        totalRevenue: clientData.totalRevenue || clientData.estimatedValue || 0,
        lastContact: clientData.lastContact || clientData.updatedAt,
      };
      
      setClient(transformedClient);
    } catch (error) {
      console.error('Failed to fetch client:', error);
      message.error('Failed to load client details');
      // Optionally redirect to clients list on error
      // router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Client',
      content: `Are you sure you want to delete ${client.firstName} ${client.lastName}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await clientApi.delete(params.id as string);
          message.success('Client deleted successfully');
          router.push('/clients');
        } catch (error) {
          console.error('Failed to delete client:', error);
          message.error('Failed to delete client');
        }
      },
    });
  };

  const handleAddActivity = async (values: any) => {
    console.log('New activity:', values);
    message.success('Activity added successfully');
    setActivityModalVisible(false);
    form.resetFields();
  };

  const handleAddNote = async (values: any) => {
    console.log('New note:', values);
    message.success('Note added successfully');
    setNoteModalVisible(false);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'green';
      case 'sent':
        return 'blue';
      case 'draft':
        return 'default';
      case 'rejected':
        return 'red';
      default:
        return 'default';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <MailOutlined />;
      case 'call':
        return <PhoneOutlined />;
      case 'meeting':
        return <TeamOutlined />;
      default:
        return <MessageOutlined />;
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Total Revenue"
                value={client.totalRevenue}
                prefix="$"
                formatter={(value) => Number(value).toLocaleString()}
                icon={<DollarOutlined />}
                color="#52c41a"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Total Projects"
                value={client.totalProjects}
                icon={<FileTextOutlined />}
                color="#1677ff"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Completed Projects"
                value={client.completedProjects}
                icon={<TrophyOutlined />}
                color="#fa8c16"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Success Rate"
                value={(client.completedProjects / client.totalProjects * 100).toFixed(1)}
                suffix="%"
                icon={<RiseOutlined />}
                color="#722ed1"
              />
            </Col>
          </Row>

          <Card title="Revenue Trend" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1677ff"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Recent Proposals">
            <Table
              dataSource={mockProposals}
              columns={[
                {
                  title: 'Title',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={getStatusColor(status)}>
                      {status.toUpperCase()}
                    </Tag>
                  ),
                },
                {
                  title: 'Value',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value) => `$${value.toLocaleString()}`,
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  key: 'date',
                  render: (date) => dayjs(date).format('MMM DD, YYYY'),
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record) => (
                    <Button
                      type="link"
                      onClick={() => router.push(`/proposals/${record.id}`)}
                    >
                      View
                    </Button>
                  ),
                },
              ]}
              pagination={false}
            />
          </Card>
        </>
      ),
    },
    {
      key: 'activity',
      label: 'Activity',
      children: (
        <Card
          title="Activity Timeline"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setActivityModalVisible(true)}
            >
              Add Activity
            </Button>
          }
        >
          <Timeline
            items={mockActivities.map((activity) => ({
              dot: (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#f0f5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1677ff',
                  }}
                >
                  {getActivityIcon(activity.type)}
                </div>
              ),
              children: (
                <div style={{ paddingBottom: 16 }}>
                  <Space direction="vertical" size={4}>
                    <strong>{activity.title}</strong>
                    <span>{activity.description}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      {dayjs(activity.date).format('MMM DD, YYYY')}
                    </span>
                  </Space>
                </div>
              ),
            }))}
          />
        </Card>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      children: (
        <Card
          title="Notes"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setNoteModalVisible(true)}
            >
              Add Note
            </Button>
          }
        >
          <div
            style={{
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <p>{client.notes}</p>
            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
              Added on {dayjs(client.createdAt).format('MMM DD, YYYY')}
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Clients', href: '/clients' },
        { title: `${client.firstName} ${client.lastName}` },
      ]}
    >
      <PageHeader
        title={`${client.firstName} ${client.lastName}`}
        subtitle={client.company}
        showBack
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => router.push(`/clients/${params.id}/edit`)}
            >
              Edit
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        }
      />

      <Row gutter={[24, 24]}>
        {/* Client Info Card */}
        <Col xs={24} lg={8}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {client.avatar ? (
                <Avatar size={80} src={client.avatar} />
              ) : (
                <Avatar size={80} style={{ backgroundColor: '#1677ff' }}>
                  {client.firstName?.[0] || ''}{client.lastName?.[0] || ''}
                </Avatar>
              )}
              <h2 style={{ marginTop: 16, marginBottom: 4 }}>
                {client.firstName} {client.lastName}
              </h2>
              <p style={{ color: '#8c8c8c', margin: 0 }}>{client.jobTitle}</p>
              <Tag
                color={client.status === 'active' ? 'green' : client.status === 'inactive' ? 'red' : 'blue'}
                style={{ marginTop: 8 }}
              >
                {(client.status || 'active').toUpperCase()}
              </Tag>
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><MailOutlined /> Email</>}>
                <a href={`mailto:${client.email}`}>{client.email}</a>
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                <a href={`tel:${client.phone}`}>{client.phone}</a>
              </Descriptions.Item>
              <Descriptions.Item label={<><GlobalOutlined /> Website</>}>
                <a href={client.website} target="_blank" rel="noopener noreferrer">
                  {client.website}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label={<><LinkedinOutlined /> LinkedIn</>}>
                <a href={`https://${client.linkedin}`} target="_blank" rel="noopener noreferrer">
                  {client.linkedin}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label={<><TwitterOutlined /> Twitter</>}>
                {client.twitter}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Company">
                {client.company || client.organization}
              </Descriptions.Item>
              <Descriptions.Item label="Industry">
                {client.industry}
              </Descriptions.Item>
              <Descriptions.Item label="Company Size">
                {client.companySize ? `${client.companySize} employees` : 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Lead Source">
                {client.leadSource}
              </Descriptions.Item>
              <Descriptions.Item label="Est. Value">
                ${(client.estimatedValue || 0).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><EnvironmentOutlined /> Address</>}>
                <div>
                  {client.address}<br />
                  {client.city}, {client.state} {client.zipCode}<br />
                  {client.country}
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Created">
                {dayjs(client.createdAt).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Contact">
                {dayjs(client.lastContact).format('MMM DD, YYYY')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} lg={16}>
          <Tabs items={tabItems} />
        </Col>
      </Row>

      {/* Add Activity Modal */}
      <Modal
        title="Add Activity"
        open={activityModalVisible}
        onCancel={() => {
          setActivityModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddActivity}
        >
          <Form.Item
            name="type"
            label="Activity Type"
            rules={[{ required: true, message: 'Please select activity type' }]}
          >
            <Select placeholder="Select type">
              <Select.Option value="email">Email</Select.Option>
              <Select.Option value="call">Phone Call</Select.Option>
              <Select.Option value="meeting">Meeting</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Activity title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Activity description" />
          </Form.Item>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Activity
              </Button>
              <Button onClick={() => setActivityModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        title="Add Note"
        open={noteModalVisible}
        onCancel={() => {
          setNoteModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddNote}
        >
          <Form.Item
            name="note"
            label="Note"
            rules={[{ required: true, message: 'Please enter a note' }]}
          >
            <TextArea rows={4} placeholder="Enter your note here..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Note
              </Button>
              <Button onClick={() => setNoteModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}

const Divider = () => (
  <div style={{ borderTop: '1px solid #f0f0f0', margin: '16px 0' }} />
);