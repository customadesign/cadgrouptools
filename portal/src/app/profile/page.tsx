'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Tabs,
  List,
  Tag,
  Progress,
  Statistic,
  Alert,
  Upload,
  Modal,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  CalendarOutlined,
  SafetyOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CameraOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function ProfilePage() {
  const { data: session } = useSession();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Mock data - replace with actual API calls
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || 'John Doe',
    email: session?.user?.email || 'john.doe@cadgroup.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    position: 'Senior Developer',
    joinDate: '2023-01-15',
    avatar: null as string | null,
  });

  const [stats, setStats] = useState({
    totalProposals: 42,
    activeClients: 15,
    completedTasks: 128,
    revenue: 125000,
  });

  const recentActivity = [
    {
      id: 1,
      action: 'Created proposal',
      target: 'Website Redesign for ABC Corp',
      timestamp: '2 hours ago',
      type: 'proposal',
    },
    {
      id: 2,
      action: 'Updated client',
      target: 'XYZ Industries',
      timestamp: '5 hours ago',
      type: 'client',
    },
    {
      id: 3,
      action: 'Uploaded statement',
      target: 'Bank Statement - March 2024',
      timestamp: '1 day ago',
      type: 'accounting',
    },
    {
      id: 4,
      action: 'Completed task',
      target: 'Quarterly Report Review',
      timestamp: '2 days ago',
      type: 'task',
    },
    {
      id: 5,
      action: 'Generated report',
      target: 'Monthly Analytics Report',
      timestamp: '3 days ago',
      type: 'report',
    },
  ];

  const loginHistory = [
    { date: '2024-03-20 09:15 AM', location: 'San Francisco, CA', device: 'Chrome on MacOS' },
    { date: '2024-03-19 02:30 PM', location: 'San Francisco, CA', device: 'Safari on iPhone' },
    { date: '2024-03-18 08:45 AM', location: 'San Francisco, CA', device: 'Chrome on MacOS' },
    { date: '2024-03-17 11:20 AM', location: 'New York, NY', device: 'Firefox on Windows' },
    { date: '2024-03-16 03:10 PM', location: 'San Francisco, CA', device: 'Chrome on MacOS' },
  ];

  useEffect(() => {
    form.setFieldsValue(profileData);
  }, [profileData, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, ...values }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setProfileData({ ...profileData, ...data.user });
      message.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Password changed successfully');
      setShowPasswordModal(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
      }
      return isJpgOrPng && isLt2M;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const ext = (file as File).name.split('.').pop();
        const key = `avatars/${session?.user?.id}-${Date.now()}.${ext}`;
        const ct = (file as File).type || 'image/jpeg';
        const presign = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, contentType: ct }),
        });
        const { url, headers: s3Headers, error } = await presign.json();
        if (error) throw new Error(error);
        const uploadHeaders: Record<string, string> = { 'Content-Type': ct };
        if (s3Headers && s3Headers['x-amz-acl']) uploadHeaders['x-amz-acl'] = s3Headers['x-amz-acl'];
        const putRes = await fetch(url, { method: 'PUT', headers: uploadHeaders, body: file as File });
        if (!putRes.ok) throw new Error('Upload failed');
        const avatarUrl = url.split('?')[0];
        // Persist avatar immediately
        await fetch('/api/auth/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: avatarUrl }),
        });
        setProfileData((p) => ({ ...p, avatar: avatarUrl }));
        onSuccess && onSuccess({}, new XMLHttpRequest());
      } catch (e) {
        onError && onError(e as any);
        message.error('Failed to upload avatar');
      }
    },
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'proposal':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'client':
        return <TeamOutlined style={{ color: '#52c41a' }} />;
      case 'accounting':
        return <DollarOutlined style={{ color: '#faad14' }} />;
      case 'task':
        return <CheckCircleOutlined style={{ color: '#13c2c2' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const breadcrumbs = [
    { title: 'Profile' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card
          style={{ marginBottom: 24 }}
          bodyStyle={{ padding: 32 }}
        >
          <Row gutter={24} align="middle">
            <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
              <Space direction="vertical" size={16}>
                <Upload {...uploadProps}>
                  <div style={{ position: 'relative', cursor: 'pointer' }}>
                    <Avatar
                      size={120}
                      icon={<UserOutlined />}
                      src={profileData.avatar}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        background: '#fff',
                        borderRadius: '50%',
                        padding: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      <CameraOutlined style={{ fontSize: 16 }} />
                    </div>
                  </div>
                </Upload>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {profileData.name}
                  </Title>
                  <Text type="secondary">{profileData.position}</Text>
                </div>
                <Tag color={session?.user?.role === 'admin' ? 'gold' : 'blue'}>
                  {session?.user?.role?.toUpperCase() || 'STAFF'}
                </Tag>
              </Space>
            </Col>
            <Col xs={24} sm={18}>
              <Row gutter={[24, 24]}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Proposals"
                    value={stats.totalProposals}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Active Clients"
                    value={stats.activeClients}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Tasks Completed"
                    value={stats.completedTasks}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Revenue Generated"
                    value={stats.revenue}
                    prefix="$"
                    precision={0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Profile Information" key="1">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                disabled={!isEditing}
              >
                <Row gutter={24}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Full Name"
                      name="name"
                      rules={[{ required: true, message: 'Please enter your name' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="Full Name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="Email" disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Phone Number"
                      name="phone"
                      rules={[{ required: true, message: 'Please enter your phone number' }]}
                    >
                      <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Department"
                      name="department"
                    >
                      <Input prefix={<TeamOutlined />} placeholder="Department" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Position"
                      name="position"
                    >
                      <Input placeholder="Position" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Join Date"
                      name="joinDate"
                    >
                      <Input prefix={<CalendarOutlined />} disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Space>
                  {isEditing ? (
                    <>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        htmlType="submit"
                        loading={loading}
                      >
                        Save Changes
                      </Button>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setIsEditing(false);
                          form.resetFields();
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        icon={<LockOutlined />}
                        onClick={() => setShowPasswordModal(true)}
                      >
                        Change Password
                      </Button>
                    </>
                  )}
                </Space>
              </Form>
            </TabPane>

            <TabPane tab="Recent Activity" key="2">
              <List
                itemLayout="horizontal"
                dataSource={recentActivity}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getActivityIcon(item.type)}
                      title={
                        <Space>
                          <Text>{item.action}</Text>
                          <Text strong>{item.target}</Text>
                        </Space>
                      }
                      description={item.timestamp}
                    />
                  </List.Item>
                )}
              />
            </TabPane>

            <TabPane tab="Security" key="3">
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <Alert
                  message="Two-Factor Authentication"
                  description="Enhance your account security by enabling two-factor authentication."
                  type="info"
                  action={
                    <Button size="small" type="primary">
                      Enable 2FA
                    </Button>
                  }
                  showIcon
                  icon={<SafetyOutlined />}
                />

                <div>
                  <Title level={5}>Login History</Title>
                  <List
                    dataSource={loginHistory}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.date}
                          description={
                            <Space>
                              <Text type="secondary">{item.location}</Text>
                              <Text type="secondary">•</Text>
                              <Text type="secondary">{item.device}</Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </Space>
            </TabPane>
          </Tabs>
        </Card>

        <Modal
          title="Change Password"
          open={showPasswordModal}
          onCancel={() => {
            setShowPasswordModal(false);
            passwordForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
          >
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter a new password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Change Password
                </Button>
                <Button onClick={() => {
                  setShowPasswordModal(false);
                  passwordForm.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}