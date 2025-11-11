'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Tabs,
  message,
  Row,
  Col,
  Divider,
  Space,
  Alert,
  List,
  Radio,
  TimePicker,
  Modal,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  BellOutlined,
  SafetyOutlined,
  SettingOutlined,
  SaveOutlined,
  KeyOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { useTheme } from '@/contexts/ThemeContext';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';
import PushNotificationSettings from '@/components/settings/PushNotificationSettings';

const { TabPane } = Tabs;
const { Option } = Select;

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Profile updated successfully');
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
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernDashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Manage your account settings and preferences
        </p>
      </motion.div>

      <Card className="gradient-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          {/* Profile Tab */}
          <TabPane tab={<span><UserOutlined /> Profile</span>} key="profile">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
              initialValues={{
                name: session?.user?.name,
                email: session?.user?.email,
                phone: '',
                company: 'CADGroup Management',
                department: 'Management',
                jobTitle: 'Administrator',
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your name' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Full Name" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Email Address"
                  >
                    <Input prefix={<MailOutlined />} placeholder="Email" disabled size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="phone" label="Phone Number">
                    <Input placeholder="Phone Number" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="company" label="Company">
                    <Input placeholder="Company Name" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="department" label="Department">
                    <Select placeholder="Select Department" size="large">
                      <Option value="Management">Management</Option>
                      <Option value="Sales">Sales</Option>
                      <Option value="Engineering">Engineering</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="jobTitle" label="Job Title">
                    <Input placeholder="Job Title" size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                  style={{ borderRadius: '24px' }}
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Security Tab */}
          <TabPane tab={<span><LockOutlined /> Security</span>} key="security">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Change Password
                </h3>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                  style={{ maxWidth: 500 }}
                >
                  <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[{ required: true, message: 'Please enter your current password' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Current Password" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                      { required: true, message: 'Please enter a new password' },
                      { min: 8, message: 'Password must be at least 8 characters' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="New Password" size="large" />
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
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<KeyOutlined />}
                      size="large"
                      style={{ borderRadius: '24px' }}
                    >
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </div>

              <Divider />

              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Two-Factor Authentication
                </h3>
                <Card className="theme-card" styles={{ body: { padding: '20px' } }}>
                  <Alert
                    message="Enhanced Security"
                    description="Two-factor authentication adds an extra layer of security to your account."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: '12px' }}
                  />
                  <Button
                    type="primary"
                    icon={<SafetyOutlined />}
                    size="large"
                    style={{ borderRadius: '24px' }}
                  >
                    Enable 2FA
                  </Button>
                </Card>
              </div>
            </div>
          </TabPane>

          {/* Notifications Tab */}
          <TabPane tab={<span><BellOutlined /> Notifications</span>} key="notifications">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Email Notifications
                </h3>
                <List
                  dataSource={[
                    { key: 'proposals', label: 'New proposal submissions', enabled: true },
                    { key: 'clients', label: 'New client registrations', enabled: true },
                    { key: 'transactions', label: 'Transaction updates', enabled: false },
                    { key: 'reports', label: 'Weekly reports', enabled: true },
                    { key: 'security', label: 'Security alerts', enabled: true },
                  ]}
                  renderItem={(item, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <List.Item
                        actions={[
                          <Switch
                            defaultChecked={item.enabled}
                            onChange={(checked) => message.info(`${item.label}: ${checked ? 'Enabled' : 'Disabled'}`)}
                          />,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ background: '#3B82F620', color: '#3B82F6' }}
                            >
                              <MailOutlined />
                            </div>
                          }
                          title={<span style={{ color: 'var(--text-primary)' }}>{item.label}</span>}
                        />
                      </List.Item>
                    </motion.div>
                  )}
                />
              </div>

              <Divider />

              <PushNotificationSettings />
            </div>
          </TabPane>

          {/* Preferences Tab */}
          <TabPane tab={<span><SettingOutlined /> Preferences</span>} key="preferences">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Appearance
                </h3>
                <Card className="theme-card" styles={{ body: { padding: '20px' } }}>
                  <Form layout="vertical">
                    <Form.Item label="Theme Mode">
                      <Radio.Group
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        size="large"
                      >
                        <Radio.Button value="light" style={{ borderRadius: '24px 0 0 24px' }}>
                          <SunOutlined /> Light
                        </Radio.Button>
                        <Radio.Button value="dark">
                          <MoonOutlined /> Dark
                        </Radio.Button>
                        <Radio.Button value="system" style={{ borderRadius: '0 24px 24px 0' }}>
                          <DesktopOutlined /> System
                        </Radio.Button>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item label="Language">
                      <Select defaultValue="en" style={{ width: 200 }} size="large">
                        <Option value="en">English</Option>
                        <Option value="es">Spanish</Option>
                        <Option value="fr">French</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Time Zone">
                      <Select defaultValue="America/Los_Angeles" style={{ width: 300 }} size="large">
                        <Option value="America/Los_Angeles">Pacific Time (PT)</Option>
                        <Option value="America/New_York">Eastern Time (ET)</Option>
                        <Option value="Europe/London">London (GMT)</Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </Card>
              </div>

              <Divider />

              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Data & Privacy
                </h3>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    icon={<DownloadOutlined />}
                    size="large"
                    style={{ borderRadius: '24px' }}
                  >
                    Download My Data
                  </Button>
                  <Button
                    danger
                    icon={<ExclamationCircleOutlined />}
                    size="large"
                    style={{ borderRadius: '24px' }}
                  >
                    Delete Account
                  </Button>
                </Space>
              </div>
            </div>
          </TabPane>

          {/* Admin Tab */}
          {session?.user?.role === 'admin' && (
            <TabPane tab={<span><CrownOutlined /> Admin</span>} key="admin">
              <div className="space-y-6">
                <Alert
                  message="Administrator Access"
                  description="You have full system access. Use these privileges responsibly."
                  type="warning"
                  showIcon
                  style={{ borderRadius: '12px' }}
                />

                <Row gutter={[16, 16]} className="stagger-children">
                  {[
                    {
                      title: 'Manage Users',
                      description: 'View and manage all users',
                      icon: <TeamOutlined style={{ fontSize: 24 }} />,
                      color: '#3B82F6',
                      onClick: () => router.push('/admin/users'),
                    },
                    {
                      title: 'Add New User',
                      description: 'Register new users',
                      icon: <UserAddOutlined style={{ fontSize: 24 }} />,
                      color: '#10B981',
                      onClick: () => router.push('/admin/users?action=add'),
                    },
                    {
                      title: 'Role Management',
                      description: 'Assign roles and permissions',
                      icon: <UserSwitchOutlined style={{ fontSize: 24 }} />,
                      color: '#F59E0B',
                      onClick: () => router.push('/admin/users'),
                    },
                  ].map((item, index) => (
                    <Col xs={24} sm={12} lg={8} key={index}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card
                          className="gradient-card cursor-pointer h-full"
                          onClick={item.onClick}
                          hoverable
                        >
                          <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                              style={{
                                background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`,
                              }}
                            >
                              {item.icon}
                            </div>
                            <div>
                              <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                {item.title}
                              </div>
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {item.description}
                              </div>
                            </div>
                          </Space>
                        </Card>
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              </div>
            </TabPane>
          )}

          {/* Security Tab */}
          <TabPane tab={<span><LockOutlined /> Security</span>} key="security">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Change Password
                </h3>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                  style={{ maxWidth: 500 }}
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
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<KeyOutlined />}
                      size="large"
                      style={{ borderRadius: '24px' }}
                    >
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </div>

              <Divider />

              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Two-Factor Authentication
                </h3>
                <Card className="theme-card">
                  <Alert
                    message="Enhanced Security"
                    description="Two-factor authentication adds an extra layer of security to your account."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: '12px' }}
                  />
                  <Button
                    type="primary"
                    icon={<SafetyOutlined />}
                    size="large"
                    style={{ borderRadius: '24px' }}
                  >
                    Enable 2FA
                  </Button>
                </Card>
              </div>
            </div>
          </TabPane>

          {/* Notifications Tab */}
          <TabPane tab={<span><BellOutlined /> Notifications</span>} key="notifications">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Email Notifications
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Get notified via email for important events in your CAD Group Tools workflow
                </p>
                <List
                  dataSource={[
                    {
                      key: 'proposal_completed',
                      label: 'Proposal Completed',
                      description: 'When Manus AI finishes generating a proposal',
                      icon: '✅',
                      enabled: true,
                    },
                    {
                      key: 'proposal_failed',
                      label: 'Proposal Failed',
                      description: 'When proposal generation encounters an error',
                      icon: '❌',
                      enabled: true,
                    },
                    {
                      key: 'document_processed',
                      label: 'Document Processed',
                      description: 'When accounting document analysis completes',
                      icon: '📄',
                      enabled: true,
                    },
                    {
                      key: 'pl_generated',
                      label: 'P&L Statement Ready',
                      description: 'When monthly profit & loss statement is generated',
                      icon: '📊',
                      enabled: true,
                    },
                    {
                      key: 'system_alerts',
                      label: 'System Alerts',
                      description: 'Important system notifications and security updates',
                      icon: '🔔',
                      enabled: true,
                    },
                  ]}
                  renderItem={(item, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <List.Item
                        actions={[
                          <Switch
                            defaultChecked={item.enabled}
                            onChange={(checked) => message.info(`${item.label}: ${checked ? 'Enabled' : 'Disabled'}`)}
                          />,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ background: '#3B82F620', color: '#3B82F6' }}
                            >
                              <span style={{ fontSize: 20 }}>{item.icon}</span>
                            </div>
                          }
                          title={<span style={{ color: 'var(--text-primary)' }}>{item.label}</span>}
                          description={
                            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                              {item.description}
                            </span>
                          }
                        />
                      </List.Item>
                    </motion.div>
                  )}
                />
              </div>

              <Divider />

              {/* Push Notifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Push Notifications
                </h3>
                <PushNotificationSettings />
              </div>
            </div>
          </TabPane>

          {/* Preferences Tab */}
          <TabPane tab={<span><SettingOutlined /> Preferences</span>} key="preferences">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Appearance
                </h3>
                <Card className="theme-card" styles={{ body: { padding: '20px' } }}>
                  <Form layout="vertical">
                    <Form.Item label="Theme Mode">
                      <Radio.Group
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        size="large"
                      >
                        <Radio.Button value="light" style={{ borderRadius: '24px 0 0 24px', minWidth: '100px' }}>
                          <SunOutlined /> Light
                        </Radio.Button>
                        <Radio.Button value="dark" style={{ minWidth: '100px' }}>
                          <MoonOutlined /> Dark
                        </Radio.Button>
                        <Radio.Button value="system" style={{ borderRadius: '0 24px 24px 0', minWidth: '100px' }}>
                          <DesktopOutlined /> System
                        </Radio.Button>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item label="Language">
                      <Select defaultValue="en" style={{ width: 200 }} size="large">
                        <Option value="en">English</Option>
                        <Option value="es">Spanish</Option>
                        <Option value="fr">French</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Time Zone">
                      <Select defaultValue="America/Los_Angeles" style={{ width: 300 }} size="large">
                        <Option value="America/Los_Angeles">Pacific Time (PT)</Option>
                        <Option value="America/New_York">Eastern Time (ET)</Option>
                        <Option value="Europe/London">London (GMT)</Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </Card>
              </div>

              <Divider />

              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Data & Privacy
                </h3>
                <Space direction="vertical" size="middle">
                  <Button
                    icon={<DownloadOutlined />}
                    size="large"
                    style={{ borderRadius: '24px' }}
                  >
                    Download My Data
                  </Button>
                  <Button
                    danger
                    icon={<ExclamationCircleOutlined />}
                    size="large"
                    style={{ borderRadius: '24px' }}
                  >
                    Delete Account
                  </Button>
                </Space>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </ModernDashboardLayout>
  );
}
