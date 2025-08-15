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
  Avatar,
  Upload,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Space,
  Alert,
  Badge,
  List,
  Tag,
  Modal,
  TimePicker,
  Radio,
  Spin,
  Table,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  BellOutlined,
  SafetyOutlined,
  SettingOutlined,
  CameraOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  MobileOutlined,
  KeyOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  DownloadOutlined,
  CrownOutlined,
  UserSwitchOutlined,
  UserAddOutlined,
  UploadOutlined,
  ChromeOutlined,
  SendOutlined,
  HistoryOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs from 'dayjs';
import clientPushNotificationService from '@/services/clientPushNotificationService';
import PushNotificationSettings from '@/components/settings/PushNotificationSettings';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [loadingPush, setLoadingPush] = useState(false);
  const [sendNotificationModal, setSendNotificationModal] = useState(false);

  // Check push notification support and status on mount
  useEffect(() => {
    checkPushNotificationStatus();
  }, []);

  const checkPushNotificationStatus = async () => {
    if (clientPushNotificationService.isSupported()) {
      setPushSupported(true);
      setPushPermission(clientPushNotificationService.getPermissionStatus());
      
      // Check if user is subscribed
      const isSubscribed = await clientPushNotificationService.isSubscribed();
      setPushNotifications(isSubscribed);
      
      if (isSubscribed) {
        // Fetch user subscriptions
        const subs = await clientPushNotificationService.getUserSubscriptions();
        setUserSubscriptions(subs);
      }
      
      // Fetch notification history
      const history = await clientPushNotificationService.getNotificationHistory();
      setNotificationHistory(history);
    }
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (!pushSupported) {
      message.error('Push notifications are not supported in this browser');
      return;
    }

    setLoadingPush(true);
    try {
      if (enabled) {
        // Subscribe to push notifications
        await clientPushNotificationService.subscribe();
        setPushNotifications(true);
        setPushPermission('granted');
        message.success('Push notifications enabled successfully');
        
        // Refresh subscriptions list
        const subs = await clientPushNotificationService.getUserSubscriptions();
        setUserSubscriptions(subs);
      } else {
        // Unsubscribe from push notifications
        await clientPushNotificationService.unsubscribe();
        setPushNotifications(false);
        message.success('Push notifications disabled');
        setUserSubscriptions([]);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to update push notification settings');
      setPushNotifications(!enabled); // Revert the toggle
    } finally {
      setLoadingPush(false);
    }
  };

  const testPushNotification = async () => {
    try {
      await clientPushNotificationService.showLocalNotification(
        'Test Notification',
        'This is a test notification from CADGroup Tools Portal',
        {
          requireInteraction: true,
          actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        }
      );
      message.success('Test notification sent');
    } catch (error: any) {
      message.error(error.message || 'Failed to send test notification');
    }
  };

  const sendCustomNotification = async (values: any) => {
    setLoading(true);
    try {
      const result = await clientPushNotificationService.sendCustomNotification(
        values.targetUsers,
        values.title,
        values.body,
        {
          requireInteraction: values.requireInteraction,
          data: values.data
        }
      );
      
      if (result.success) {
        message.success(`Notification sent successfully (${result.successCount} sent, ${result.failureCount} failed)`);
        setSendNotificationModal(false);
        notificationForm.resetFields();
        
        // Refresh history
        const history = await clientPushNotificationService.getNotificationHistory();
        setNotificationHistory(history);
      } else {
        message.error('Failed to send notification');
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const removeSubscription = async (endpoint: string) => {
    try {
      await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
        method: 'DELETE',
      });
      message.success('Device removed successfully');
      
      // Refresh subscriptions list
      const subs = await clientPushNotificationService.getUserSubscriptions();
      setUserSubscriptions(subs);
    } catch (error) {
      message.error('Failed to remove device');
    }
  };

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = () => {
    Modal.confirm({
      title: 'Enable Two-Factor Authentication',
      icon: <SafetyOutlined />,
      content: 'This will add an extra layer of security to your account. You will need an authenticator app to complete the setup.',
      onOk: () => {
        setTwoFactorEnabled(true);
        message.success('Two-factor authentication enabled');
      },
    });
  };

  const activityLog = [
    {
      id: 1,
      action: 'Login from new device',
      device: 'Chrome on MacOS',
      location: 'Manila, Philippines',
      time: '2 hours ago',
      ip: '192.168.1.1',
    },
    {
      id: 2,
      action: 'Password changed',
      device: 'Safari on iPhone',
      location: 'Manila, Philippines',
      time: '3 days ago',
      ip: '192.168.1.2',
    },
    {
      id: 3,
      action: 'Profile updated',
      device: 'Chrome on Windows',
      location: 'Quezon City, Philippines',
      time: '1 week ago',
      ip: '192.168.1.3',
    },
  ];


  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Settings' },
      ]}
    >
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences"
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={6}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Badge
                count={<CameraOutlined style={{ fontSize: 20, color: '#fff' }} />}
                offset={[-10, 80]}
                style={{ backgroundColor: '#1677ff', cursor: 'pointer' }}
              >
                <Avatar
                  size={100}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1677ff' }}
                />
              </Badge>
              <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                {session?.user?.name || 'User Name'}
              </Title>
              <Text type="secondary">{session?.user?.email}</Text>
              <br />
              <Tag color="blue" style={{ marginTop: 8 }}>
                {session?.user?.role?.toUpperCase() || 'ADMIN'}
              </Tag>
            </div>

            <Divider />

            <List
              size="small"
              dataSource={[
                { icon: <CalendarOutlined />, label: 'Member Since', value: 'Jan 2024' },
                { icon: <TeamOutlined />, label: 'Department', value: 'Management' },
                { icon: <GlobalOutlined />, label: 'Timezone', value: 'Asia/Manila' },
                { icon: <DollarOutlined />, label: 'Plan', value: 'Premium' },
              ]}
              renderItem={item => (
                <List.Item>
                  <Space>
                    {item.icon}
                    <Text type="secondary">{item.label}:</Text>
                    <Text strong>{item.value}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane
                tab={
                  <span>
                    <UserOutlined />
                    Profile
                  </span>
                }
                key="profile"
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                  initialValues={{
                    name: session?.user?.name,
                    email: session?.user?.email,
                    phone: '+63 917 123 4567',
                    company: 'CADGroup Management',
                    department: 'Management',
                    jobTitle: 'Administrator',
                    bio: 'System administrator for CADGroup Tools Portal',
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter your name' }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="Full Name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                          { required: true, message: 'Please enter your email' },
                          { type: 'email', message: 'Please enter a valid email' },
                        ]}
                      >
                        <Input prefix={<MailOutlined />} placeholder="Email" disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="phone" label="Phone Number">
                        <Input placeholder="Phone Number" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="company" label="Company">
                        <Input placeholder="Company Name" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="department" label="Department">
                        <Select placeholder="Select Department">
                          <Option value="Management">Management</Option>
                          <Option value="Sales">Sales</Option>
                          <Option value="Marketing">Marketing</Option>
                          <Option value="Engineering">Engineering</Option>
                          <Option value="Support">Support</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="jobTitle" label="Job Title">
                        <Input placeholder="Job Title" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="bio" label="Bio">
                    <Input.TextArea rows={4} placeholder="Tell us about yourself" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                      Save Changes
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <LockOutlined />
                    Security
                  </span>
                }
                key="security"
              >
                <Title level={5}>Change Password</Title>
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
                    <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                      { required: true, message: 'Please enter a new password' },
                      { min: 8, message: 'Password must be at least 8 characters' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
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
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<KeyOutlined />}>
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>

                <Divider />

                <Title level={5}>Two-Factor Authentication</Title>
                <Alert
                  message="Enhanced Security"
                  description="Two-factor authentication adds an extra layer of security to your account."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Space>
                  <Switch
                    checked={twoFactorEnabled}
                    onChange={handleEnable2FA}
                    checkedChildren="Enabled"
                    unCheckedChildren="Disabled"
                  />
                  <Text>{twoFactorEnabled ? 'Two-factor authentication is enabled' : 'Enable two-factor authentication'}</Text>
                </Space>

                <Divider />

                <Title level={5}>Recent Activity</Title>
                <List
                  dataSource={activityLog}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title={item.action}
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">{item.device}</Text>
                            <Text type="secondary">{item.location} • {item.ip}</Text>
                          </Space>
                        }
                      />
                      <Text type="secondary">{item.time}</Text>
                    </List.Item>
                  )}
                />
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <BellOutlined />
                    Notifications
                  </span>
                }
                key="notifications"
              >
                <Title level={5}>Email Notifications</Title>
                <List
                  dataSource={[
                    { key: 'proposals', label: 'New proposal submissions', enabled: true },
                    { key: 'clients', label: 'New client registrations', enabled: true },
                    { key: 'transactions', label: 'Transaction updates', enabled: false },
                    { key: 'reports', label: 'Weekly reports', enabled: true },
                    { key: 'security', label: 'Security alerts', enabled: true },
                  ]}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Switch
                          defaultChecked={item.enabled}
                          onChange={(checked) => message.info(`${item.label}: ${checked ? 'Enabled' : 'Disabled'}`)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.label}
                        avatar={<MailOutlined />}
                      />
                    </List.Item>
                  )}
                />

                <Divider />

                <PushNotificationSettings />
                  <>
                    <Alert
                      message="Browser Notifications"
                      description="Get real-time notifications in your browser when important events occur."
                      type={pushPermission === 'denied' ? 'error' : 'info'}
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    {pushPermission === 'denied' && (
                      <Alert
                        message="Permission Denied"
                        description="You have blocked notifications for this site. Please enable them in your browser settings to receive push notifications."
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Switch
                          checked={pushNotifications}
                          onChange={handlePushNotificationToggle}
                          checkedChildren="Enabled"
                          unCheckedChildren="Disabled"
                          loading={loadingPush}
                          disabled={pushPermission === 'denied'}
                        />
                        <Text>{pushNotifications ? 'Push notifications are enabled' : 'Enable push notifications'}</Text>
                        {pushNotifications && (
                          <Button size="small" onClick={testPushNotification}>
                            Test Notification
                          </Button>
                        )}
                      </Space>

                      {userSubscriptions.length > 0 && (
                        <>
                          <Title level={5} style={{ marginTop: 16 }}>Registered Devices</Title>
                          <List
                            dataSource={userSubscriptions}
                            renderItem={(sub: any) => (
                              <List.Item
                                actions={[
                                  <Tooltip title="Remove this device">
                                    <Button
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => removeSubscription(sub.endpoint)}
                                    />
                                  </Tooltip>
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={<ChromeOutlined />}
                                  title={sub.userAgent ? sub.userAgent.substring(0, 50) + '...' : 'Unknown Device'}
                                  description={
                                    <Space direction="vertical" size={0}>
                                      <Text type="secondary">
                                        Added: {new Date(sub.createdAt).toLocaleDateString()}
                                      </Text>
                                      {sub.lastUsed && (
                                        <Text type="secondary">
                                          Last used: {new Date(sub.lastUsed).toLocaleDateString()}
                                        </Text>
                                      )}
                                    </Space>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        </>
                      )}
                    </Space>
                  </>
                )}

                <Divider />

                {session?.user?.role === 'admin' && (
                  <>
                    <Title level={5}>Send Custom Notification</Title>
                    <Alert
                      message="Admin Feature"
                      description="As an admin, you can send custom push notifications to users."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={() => setSendNotificationModal(true)}
                    >
                      Send Custom Notification
                    </Button>

                    <Divider />

                    <Title level={5}>Notification History</Title>
                    <Table
                      dataSource={notificationHistory}
                      columns={[
                        {
                          title: 'Type',
                          dataIndex: 'type',
                          key: 'type',
                          render: (type: string) => (
                            <Tag color={
                              type === 'user_registration' ? 'green' :
                              type === 'report_complete' ? 'blue' :
                              type === 'login_attempt' ? 'orange' :
                              type === 'system_alert' ? 'red' :
                              'default'
                            }>
                              {type.replace('_', ' ').toUpperCase()}
                            </Tag>
                          )
                        },
                        {
                          title: 'Title',
                          dataIndex: 'title',
                          key: 'title',
                        },
                        {
                          title: 'Body',
                          dataIndex: 'body',
                          key: 'body',
                          ellipsis: true,
                        },
                        {
                          title: 'Sent To',
                          dataIndex: 'sentTo',
                          key: 'sentTo',
                          render: (sentTo: string[]) => `${sentTo?.length || 0} users`
                        },
                        {
                          title: 'Status',
                          key: 'status',
                          render: (record: any) => (
                            <Space>
                              <Tag color="green">{record.successCount} sent</Tag>
                              {record.failureCount > 0 && (
                                <Tag color="red">{record.failureCount} failed</Tag>
                              )}
                            </Space>
                          )
                        },
                        {
                          title: 'Date',
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          render: (date: string) => new Date(date).toLocaleString()
                        }
                      ]}
                      pagination={{ pageSize: 5 }}
                      size="small"
                    />

                    <Modal
                      title="Send Custom Notification"
                      open={sendNotificationModal}
                      onCancel={() => setSendNotificationModal(false)}
                      footer={null}
                      width={600}
                    >
                      <Form
                        form={notificationForm}
                        layout="vertical"
                        onFinish={sendCustomNotification}
                      >
                        <Form.Item
                          name="targetUsers"
                          label="Target Users"
                          rules={[{ required: true, message: 'Please select target users' }]}
                        >
                          <Select>
                            <Option value="all">All Users</Option>
                            <Option value="admins">Admins Only</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="title"
                          label="Notification Title"
                          rules={[{ required: true, message: 'Please enter a title' }]}
                        >
                          <Input placeholder="Enter notification title" />
                        </Form.Item>

                        <Form.Item
                          name="body"
                          label="Notification Body"
                          rules={[{ required: true, message: 'Please enter notification body' }]}
                        >
                          <Input.TextArea
                            rows={3}
                            placeholder="Enter notification message"
                          />
                        </Form.Item>

                        <Form.Item
                          name="requireInteraction"
                          valuePropName="checked"
                        >
                          <Switch /> Require user interaction (notification won't auto-dismiss)
                        </Form.Item>

                        <Form.Item>
                          <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                              Send Notification
                            </Button>
                            <Button onClick={() => setSendNotificationModal(false)}>
                              Cancel
                            </Button>
                          </Space>
                        </Form.Item>
                      </Form>
                    </Modal>
                  </>
                )}

                <Divider />

                <Title level={5}>Notification Schedule</Title>
                <Form layout="vertical" style={{ maxWidth: 400 }}>
                  <Form.Item label="Quiet Hours">
                    <TimePicker.RangePicker
                      format="HH:mm"
                      defaultValue={[dayjs('22:00', 'HH:mm'), dayjs('08:00', 'HH:mm')]}
                    />
                  </Form.Item>
                  <Form.Item label="Summary Frequency">
                    <Radio.Group defaultValue="daily">
                      <Radio value="realtime">Real-time</Radio>
                      <Radio value="hourly">Hourly</Radio>
                      <Radio value="daily">Daily</Radio>
                      <Radio value="weekly">Weekly</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <SettingOutlined />
                    Preferences
                  </span>
                }
                key="preferences"
              >
                <Title level={5}>Appearance</Title>
                <Form layout="vertical">
                  <Form.Item label="Theme">
                    <Radio.Group value={darkMode ? 'dark' : 'light'} onChange={(e) => setDarkMode(e.target.value === 'dark')}>
                      <Radio.Button value="light">
                        <SunOutlined /> Light
                      </Radio.Button>
                      <Radio.Button value="dark">
                        <MoonOutlined /> Dark
                      </Radio.Button>
                      <Radio.Button value="auto">
                        <DesktopOutlined /> System
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item label="Language">
                    <Select defaultValue="en" style={{ width: 200 }}>
                      <Option value="en">English</Option>
                      <Option value="es">Spanish</Option>
                      <Option value="fr">French</Option>
                      <Option value="de">German</Option>
                      <Option value="zh">Chinese</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Date Format">
                    <Select defaultValue="MM/DD/YYYY" style={{ width: 200 }}>
                      <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                      <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                      <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Time Zone">
                    <Select defaultValue="Asia/Manila" style={{ width: 200 }}>
                      <Option value="Asia/Manila">Asia/Manila (GMT+8)</Option>
                      <Option value="America/New_York">America/New York (EST)</Option>
                      <Option value="Europe/London">Europe/London (GMT)</Option>
                      <Option value="Asia/Tokyo">Asia/Tokyo (JST)</Option>
                    </Select>
                  </Form.Item>
                </Form>

                <Divider />

                <Title level={5}>Data & Privacy</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button icon={<DownloadOutlined />}>Download My Data</Button>
                  <Button danger icon={<ExclamationCircleOutlined />}>Delete Account</Button>
                </Space>
              </TabPane>

              {/* Admin Tab - Only visible to admins */}
              {session?.user?.role === 'admin' && (
                <TabPane
                  tab={
                    <span>
                      <CrownOutlined />
                      Admin
                    </span>
                  }
                  key="admin"
                >
                  <Title level={5}>User Management</Title>
                  <Paragraph type="secondary">
                    Manage user accounts, roles, and permissions for the CADGroup Tools portal.
                  </Paragraph>
                  
                  <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col xs={24} md={12} lg={8}>
                      <Card
                        hoverable
                        onClick={() => router.push('/admin/users')}
                        style={{ cursor: 'pointer' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <TeamOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                          <Title level={5} style={{ margin: 0 }}>Manage Users</Title>
                          <Text type="secondary">
                            View, add, edit, and manage all registered users in the system
                          </Text>
                          <Button type="primary" icon={<TeamOutlined />}>
                            Open User Management
                          </Button>
                        </Space>
                      </Card>
                    </Col>

                    <Col xs={24} md={12} lg={8}>
                      <Card
                        hoverable
                        onClick={() => router.push('/admin/users?action=add')}
                        style={{ cursor: 'pointer' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <UserAddOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                          <Title level={5} style={{ margin: 0 }}>Add New User</Title>
                          <Text type="secondary">
                            Register a new user and send them login credentials
                          </Text>
                          <Button type="primary" icon={<UserAddOutlined />} style={{ backgroundColor: '#52c41a' }}>
                            Add User
                          </Button>
                        </Space>
                      </Card>
                    </Col>

                    <Col xs={24} md={12} lg={8}>
                      <Card
                        hoverable
                        onClick={() => router.push('/admin/users')}
                        style={{ cursor: 'pointer' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <UserSwitchOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
                          <Title level={5} style={{ margin: 0 }}>Role Management</Title>
                          <Text type="secondary">
                            Assign roles and permissions to users
                          </Text>
                          <Button 
                            type="primary"
                            icon={<UserSwitchOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/admin/users');
                            }}
                          >
                            Manage Roles
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  </Row>

                  <Divider />

                  <Title level={5}>Quick Actions</Title>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
                    dataSource={[
                      {
                        title: 'Reset User Password',
                        description: 'Send password reset email to users',
                        icon: <KeyOutlined />,
                        action: () => message.info('Password reset functionality'),
                      },
                      {
                        title: 'Bulk User Import',
                        description: 'Import multiple users from CSV',
                        icon: <UploadOutlined />,
                        action: () => message.info('Bulk import functionality'),
                      },
                      {
                        title: 'Export Users',
                        description: 'Export user data to CSV',
                        icon: <DownloadOutlined />,
                        action: () => message.info('Export functionality'),
                      },
                      {
                        title: 'Activate/Deactivate Users',
                        description: 'Manage user account status',
                        icon: <LockOutlined />,
                        action: () => router.push('/admin/users'),
                      },
                      {
                        title: 'View Activity Logs',
                        description: 'Monitor user activities',
                        icon: <CheckCircleOutlined />,
                        action: () => message.info('Activity logs'),
                      },
                      {
                        title: 'Email All Users',
                        description: 'Send broadcast messages',
                        icon: <MailOutlined />,
                        action: () => message.info('Email broadcast'),
                      },
                    ]}
                    renderItem={item => (
                      <List.Item>
                        <Card
                          hoverable
                          size="small"
                          onClick={item.action}
                          style={{ cursor: 'pointer' }}
                        >
                          <Space>
                            <span style={{ fontSize: 24, color: '#1677ff' }}>{item.icon}</span>
                            <div>
                              <Text strong>{item.title}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.description}
                              </Text>
                            </div>
                          </Space>
                        </Card>
                      </List.Item>
                    )}
                  />

                  <Divider />

                  <Alert
                    message="Admin Access"
                    description="As an administrator, you have full access to manage users, roles, and system settings. Please use these privileges responsibly."
                    type="warning"
                    showIcon
                    icon={<SafetyOutlined />}
                  />
                </TabPane>
              )}
            </Tabs>
          </Card>
        </Col>
      </Row>
    </DashboardLayout>
  );
}