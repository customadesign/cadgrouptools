'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Switch,
  Button,
  List,
  Space,
  Typography,
  Divider,
  Alert,
  Spin,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Radio,
  Select,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MobileOutlined,
  DesktopOutlined,
  ChromeOutlined,
  WindowsOutlined,
  AppleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import clientPushNotificationService from '@/services/clientPushNotificationService';
import { useSession } from 'next-auth/react';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function PushNotificationSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    setLoading(true);
    try {
      const supported = clientPushNotificationService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const perm = clientPushNotificationService.getPermissionStatus();
        setPermission(perm);
        
        const subscribed = await clientPushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);

        if (subscribed) {
          await fetchSubscriptions();
        }
      }
    } catch (error) {
      console.error('Error checking push notification support:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const subs = await clientPushNotificationService.getUserSubscriptions();
      setSubscriptions(subs);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleToggleSubscription = async (checked: boolean) => {
    setLoading(true);
    try {
      if (checked) {
        await clientPushNotificationService.subscribe();
        setIsSubscribed(true);
        setPermission('granted');
        await fetchSubscriptions();
        message.success('Push notifications enabled');
      } else {
        await clientPushNotificationService.unsubscribe();
        setIsSubscribed(false);
        setSubscriptions([]);
        message.success('Push notifications disabled');
      }
    } catch (error: any) {
      console.error('Error toggling subscription:', error);
      message.error(error.message || 'Failed to update notification settings');
      // Reset the state
      setIsSubscribed(!checked);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await clientPushNotificationService.showLocalNotification(
        'Test Notification',
        'This is a test notification from CADGroup Tools Portal',
        {
          tag: 'test-notification',
          requireInteraction: true,
          actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        }
      );
      message.success('Test notification sent');
    } catch (error: any) {
      message.error(error.message || 'Failed to send test notification');
    }
  };

  const handleRemoveSubscription = async (endpoint: string) => {
    Modal.confirm({
      title: 'Remove Device',
      content: 'Are you sure you want to remove this device from push notifications?',
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
            method: 'DELETE',
          });
          await fetchSubscriptions();
          message.success('Device removed');
        } catch (error) {
          message.error('Failed to remove device');
        }
      },
    });
  };

  const handleSendNotification = async () => {
    try {
      const values = await form.validateFields();
      const result = await clientPushNotificationService.sendCustomNotification(
        values.targetUsers,
        values.title,
        values.body,
        {
          requireInteraction: values.requireInteraction,
        }
      );

      if (result.success) {
        message.success(
          `Notification sent successfully (${result.successCount} delivered, ${result.failureCount} failed)`
        );
        setSendModalVisible(false);
        form.resetFields();
      } else {
        message.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      message.error('Failed to send notification');
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (!userAgent) return <DesktopOutlined />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android')) return <MobileOutlined />;
    if (ua.includes('chrome')) return <ChromeOutlined />;
    if (ua.includes('safari')) return <GlobalOutlined />;
    if (ua.includes('windows')) return <WindowsOutlined />;
    if (ua.includes('mac')) return <AppleOutlined />;
    return <DesktopOutlined />;
  };

  const getDeviceType = (userAgent: string) => {
    if (!userAgent) return 'Unknown Device';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return 'Mobile';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'Mac';
    if (ua.includes('linux')) return 'Linux';
    return 'Desktop';
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>Loading notification settings...</p>
        </div>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <Alert
          message="Push Notifications Not Supported"
          description="Your browser does not support push notifications. Please use a modern browser like Chrome, Firefox, or Edge."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={4}>Push Notifications</Title>
            <Paragraph type="secondary">
              Receive real-time notifications about important events and updates
            </Paragraph>
          </div>

          <div>
            <Space align="center" size="large">
              <Switch
                checked={isSubscribed}
                onChange={handleToggleSubscription}
                loading={loading}
                checkedChildren={<CheckCircleOutlined />}
                unCheckedChildren={<CloseCircleOutlined />}
              />
              <div>
                <Text strong>Enable Push Notifications</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {permission === 'granted'
                    ? 'Notifications are enabled'
                    : permission === 'denied'
                    ? 'Notifications are blocked. Please enable in browser settings.'
                    : 'Click to enable notifications'}
                </Text>
              </div>
            </Space>
          </div>

          {isSubscribed && (
            <>
              <Divider />
              <Space>
                <Button
                  icon={<BellOutlined />}
                  onClick={handleTestNotification}
                >
                  Send Test Notification
                </Button>
                {session?.user?.role === 'admin' && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => setSendModalVisible(true)}
                  >
                    Send Custom Notification
                  </Button>
                )}
              </Space>
            </>
          )}
        </Space>
      </Card>

      {isSubscribed && subscriptions.length > 0 && (
        <Card title="Registered Devices" extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSubscriptions}
            size="small"
          >
            Refresh
          </Button>
        }>
          <List
            dataSource={subscriptions}
            renderItem={(sub) => (
              <List.Item
                actions={[
                  sub.endpoint !== subscriptions[0]?.endpoint && (
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveSubscription(sub.endpoint)}
                    >
                      Remove
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getDeviceIcon(sub.userAgent)}
                  title={
                    <Space>
                      {getDeviceType(sub.userAgent)}
                      {sub.endpoint === subscriptions[0]?.endpoint && (
                        <Tag color="green">Current Device</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Added: {new Date(sub.createdAt).toLocaleDateString()}
                      </Text>
                      {sub.lastUsed && (
                        <>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Last used: {new Date(sub.lastUsed).toLocaleDateString()}
                          </Text>
                        </>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Send Notification Modal (Admin Only) */}
      <Modal
        title="Send Custom Notification"
        open={sendModalVisible}
        onOk={handleSendNotification}
        onCancel={() => {
          setSendModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            targetUsers: 'all',
            requireInteraction: false,
          }}
        >
          <Form.Item
            name="targetUsers"
            label="Target Recipients"
            rules={[{ required: true, message: 'Please select recipients' }]}
          >
            <Radio.Group>
              <Radio value="all">All Users</Radio>
              <Radio value="admins">Admins Only</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter notification title' }]}
          >
            <Input placeholder="Notification title" />
          </Form.Item>

          <Form.Item
            name="body"
            label="Message"
            rules={[{ required: true, message: 'Please enter notification message' }]}
          >
            <TextArea
              rows={3}
              placeholder="Notification message"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="requireInteraction"
            label="Options"
            valuePropName="checked"
          >
            <Switch checkedChildren="Require Interaction" unCheckedChildren="Auto Dismiss" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
