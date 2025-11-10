'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Space,
  message,
  Tabs,
  List,
  Tag,
  Row,
  Col,
  Upload,
  Modal,
  Divider,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  CalendarOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CameraOutlined,
  LockOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { motion } from 'framer-motion';
import { supabase, STORAGE_BUCKET } from '@/lib/supabaseClient';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';
import StatCard from '@/components/ui/StatCard';

const { TabPane } = Tabs;

export default function ProfilePage() {
  const { data: session } = useSession();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [profileData, setProfileData] = useState({
    name: session?.user?.name || 'John Doe',
    email: session?.user?.email || 'john.doe@cadgroup.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    position: 'Senior Developer',
    joinDate: '2023-01-15',
    avatar: null as string | null,
  });

  const stats = {
    totalProposals: 42,
    activeClients: 15,
    completedTasks: 128,
    revenue: 125000,
  };

  const recentActivity = [
    { id: 1, action: 'Created proposal', target: 'Website Redesign', timestamp: '2 hours ago', type: 'proposal' },
    { id: 2, action: 'Updated client', target: 'XYZ Industries', timestamp: '5 hours ago', type: 'client' },
    { id: 3, action: 'Uploaded statement', target: 'Bank Statement', timestamp: '1 day ago', type: 'accounting' },
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
        const { path, token, publicUrl, error } = await presign.json();
        if (error) throw new Error(error);
        
        const { error: uploadError } = await supabase
          .storage
          .from(STORAGE_BUCKET)
          .uploadToSignedUrl(path, token, file as File, {
            contentType: ct,
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        const avatarUrl = publicUrl || supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
        
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
    const icons = {
      proposal: { icon: <FileTextOutlined />, color: '#3B82F6' },
      client: { icon: <TeamOutlined />, color: '#10B981' },
      accounting: { icon: <DollarOutlined />, color: '#F59E0B' },
      task: { icon: <CheckCircleOutlined />, color: '#8B5CF6' },
    };
    return icons[type as keyof typeof icons] || icons.task;
  };

  return (
    <ModernDashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          My Profile
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Manage your personal information and account settings
        </p>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="gradient-card mb-6" styles={{ body: { padding: '32px' } }}>
          <Row gutter={24} align="middle">
            <Col xs={24} sm={8} md={6} style={{ textAlign: 'center' }}>
              <Upload {...uploadProps}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
                >
                  <Avatar
                    size={120}
                    icon={<UserOutlined />}
                    src={profileData.avatar}
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      border: '4px solid var(--bg-elevated)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      color: 'white',
                    }}
                  >
                    <CameraOutlined style={{ fontSize: 16 }} />
                  </div>
                </motion.div>
              </Upload>
              <div className="mt-4">
                <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {profileData.name}
                </div>
                <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {profileData.position}
                </div>
                <Tag
                  color={session?.user?.role === 'admin' ? 'gold' : 'blue'}
                  style={{ borderRadius: '12px', padding: '4px 12px', fontWeight: 500 }}
                >
                  {session?.user?.role?.toUpperCase() || 'STAFF'}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={16} md={18}>
              <Row gutter={[16, 16]} className="stagger-children">
                <Col xs={12} md={6}>
                  <StatCard
                    title="Proposals"
                    value={stats.totalProposals}
                    icon={<FileTextOutlined style={{ fontSize: 20 }} />}
                    color="primary"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <StatCard
                    title="Clients"
                    value={stats.activeClients}
                    icon={<TeamOutlined style={{ fontSize: 20 }} />}
                    color="success"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <StatCard
                    title="Tasks"
                    value={stats.completedTasks}
                    icon={<CheckCircleOutlined style={{ fontSize: 20 }} />}
                    color="primary"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <StatCard
                    title="Revenue"
                    value={`$${(stats.revenue / 1000).toFixed(0)}K`}
                    icon={<DollarOutlined style={{ fontSize: 20 }} />}
                    color="warning"
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Tabs Card */}
      <Card className="gradient-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane tab={<span><UserOutlined /> Profile Information</span>} key="1">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={!isEditing}
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Full Name"
                    name="name"
                    rules={[{ required: true, message: 'Please enter your name' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Full Name" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="Email" disabled size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Phone Number"
                    name="phone"
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="Phone Number" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Department"
                    name="department"
                  >
                    <Input prefix={<TeamOutlined />} placeholder="Department" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Position"
                    name="position"
                  >
                    <Input placeholder="Position" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Join Date"
                    name="joinDate"
                  >
                    <Input prefix={<CalendarOutlined />} disabled size="large" />
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
                      size="large"
                      style={{ borderRadius: '24px' }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setIsEditing(false);
                        form.resetFields();
                      }}
                      size="large"
                      style={{ borderRadius: '24px' }}
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
                      size="large"
                      style={{ borderRadius: '24px' }}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      icon={<LockOutlined />}
                      onClick={() => setShowPasswordModal(true)}
                      size="large"
                      style={{ borderRadius: '24px' }}
                    >
                      Change Password
                    </Button>
                  </>
                )}
              </Space>
            </Form>
          </TabPane>

          <TabPane tab={<span><CheckCircleOutlined /> Recent Activity</span>} key="2">
            <List
              dataSource={recentActivity}
              renderItem={(item, index) => {
                const iconConfig = getActivityIcon(item.type);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: `${iconConfig.color}20`, color: iconConfig.color }}
                          >
                            {iconConfig.icon}
                          </div>
                        }
                        title={
                          <div>
                            <span style={{ color: 'var(--text-primary)' }}>{item.action}</span>
                            {' '}
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {item.target}
                            </span>
                          </div>
                        }
                        description={
                          <span style={{ color: 'var(--text-tertiary)' }}>{item.timestamp}</span>
                        }
                      />
                    </List.Item>
                  </motion.div>
                );
              }}
            />
          </TabPane>

          <TabPane tab={<span><SafetyOutlined /> Security</span>} key="3">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Two-Factor Authentication
                </h3>
                <Card
                  className="theme-card"
                  styles={{ body: { padding: '20px' } }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        Enhanced Security
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Add an extra layer of protection to your account
                      </div>
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      style={{ borderRadius: '24px' }}
                    >
                      Enable 2FA
                    </Button>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Login History
                </h3>
                <Card className="theme-card">
                  <List
                    dataSource={[
                      { date: 'Today, 9:15 AM', location: 'San Francisco, CA', device: 'Chrome on MacOS' },
                      { date: 'Yesterday, 2:30 PM', location: 'San Francisco, CA', device: 'Safari on iPhone' },
                      { date: '2 days ago', location: 'New York, NY', device: 'Firefox on Windows' },
                    ]}
                    renderItem={(item, index) => (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: '#10B98120', color: '#10B981' }}
                              >
                                <CheckCircleOutlined />
                              </div>
                            }
                            title={<span style={{ color: 'var(--text-primary)' }}>{item.date}</span>}
                            description={
                              <div style={{ color: 'var(--text-secondary)' }}>
                                {item.location} • {item.device}
                              </div>
                            }
                          />
                        </List.Item>
                      </motion.div>
                    )}
                  />
                </Card>
              </div>
            </div>
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
        width={500}
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
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password' },
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
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{ borderRadius: '24px' }}
              >
                Change Password
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordModal(false);
                  passwordForm.resetFields();
                }}
                size="large"
                style={{ borderRadius: '24px' }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </ModernDashboardLayout>
  );
}
