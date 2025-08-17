'use client';

import React from 'react';
import { Button, Card, Space, Typography, Form, Input, Select, Radio, message } from 'antd';
import {
  BellOutlined,
  SendOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  SettingOutlined,
  CalendarOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification, NotificationType } from '@/types/notification';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TestNotificationsPage() {
  const { addNotification } = useNotifications();
  const [form] = Form.useForm();

  const notificationTypes: { value: NotificationType; label: string; icon: React.ReactNode }[] = [
    { value: 'user', label: 'User', icon: <TeamOutlined /> },
    { value: 'document', label: 'Document', icon: <FileDoneOutlined /> },
    { value: 'proposal', label: 'Proposal', icon: <FileTextOutlined /> },
    { value: 'payment', label: 'Payment', icon: <DollarOutlined /> },
    { value: 'task', label: 'Task', icon: <CalendarOutlined /> },
    { value: 'system', label: 'System', icon: <SettingOutlined /> },
  ];

  const sampleNotifications = [
    {
      type: 'proposal' as NotificationType,
      title: 'Proposal Accepted',
      message: 'Your proposal for "Mobile App Development" has been accepted!',
      priority: 'high',
    },
    {
      type: 'payment' as NotificationType,
      title: 'Payment Received',
      message: 'Payment of $25,000 has been received for Invoice #INV-2024-089',
      priority: 'medium',
    },
    {
      type: 'user' as NotificationType,
      title: 'New Team Member',
      message: 'Alex Chen has joined your team as a UI/UX Designer',
      priority: 'low',
    },
    {
      type: 'task' as NotificationType,
      title: 'Task Deadline',
      message: 'Project review meeting scheduled for tomorrow at 2:00 PM',
      priority: 'urgent',
    },
    {
      type: 'document' as NotificationType,
      title: 'Document Shared',
      message: 'Annual report 2024.pdf has been shared with you',
      priority: 'low',
    },
    {
      type: 'system' as NotificationType,
      title: 'System Update',
      message: 'New features have been added to the dashboard',
      priority: 'low',
    },
  ];

  const handleSubmit = (values: any) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: values.type,
      title: values.title,
      message: values.message,
      timestamp: new Date(),
      read: false,
      priority: values.priority,
      actionUrl: values.actionUrl,
      sender: values.senderName ? {
        name: values.senderName,
        role: values.senderRole,
      } : undefined,
    };

    addNotification(notification);
    message.success('Notification sent!');
    form.resetFields();
  };

  const sendSampleNotification = (sample: any) => {
    const notification: Notification = {
      id: Date.now().toString(),
      ...sample,
      timestamp: new Date(),
      read: false,
      actionUrl: '#',
      sender: {
        name: 'Test System',
        role: 'Demo',
      },
    };

    addNotification(notification);
    message.success('Sample notification sent!');
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              <BellOutlined /> Test Notification System
            </Title>
            <Paragraph>
              Use this page to test the notification system. Send custom notifications or use the sample templates.
            </Paragraph>
          </div>

          <Card title="Quick Sample Notifications" bordered={false}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {sampleNotifications.map((sample, index) => (
                <Card
                  key={index}
                  hoverable
                  onClick={() => sendSampleNotification(sample)}
                  style={{ cursor: 'pointer', borderColor: '#d9d9d9' }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space>
                      {notificationTypes.find(t => t.value === sample.type)?.icon}
                      <Text strong>{sample.title}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {sample.message}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Priority: {sample.priority}
                    </Text>
                  </Space>
                </Card>
              ))}
            </div>
          </Card>

          <Card title="Custom Notification Builder" bordered={false}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                type: 'proposal',
                priority: 'medium',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                <Form.Item
                  name="type"
                  label="Notification Type"
                  rules={[{ required: true }]}
                >
                  <Select>
                    {notificationTypes.map(type => (
                      <Select.Option key={type.value} value={type.value}>
                        <Space>
                          {type.icon}
                          {type.label}
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="priority"
                  label="Priority"
                  rules={[{ required: true }]}
                >
                  <Radio.Group>
                    <Radio value="low">Low</Radio>
                    <Radio value="medium">Medium</Radio>
                    <Radio value="high">High</Radio>
                    <Radio value="urgent">Urgent</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>

              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Please enter a title' }]}
              >
                <Input placeholder="Enter notification title" />
              </Form.Item>

              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true, message: 'Please enter a message' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Enter notification message"
                />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                <Form.Item
                  name="senderName"
                  label="Sender Name (Optional)"
                >
                  <Input placeholder="John Doe" />
                </Form.Item>

                <Form.Item
                  name="senderRole"
                  label="Sender Role (Optional)"
                >
                  <Input placeholder="Manager" />
                </Form.Item>

                <Form.Item
                  name="actionUrl"
                  label="Action URL (Optional)"
                >
                  <Input placeholder="/dashboard" />
                </Form.Item>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  size="large"
                >
                  Send Custom Notification
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="Testing Instructions" bordered={false}>
            <Space direction="vertical">
              <Text>
                <strong>1. Real-time Updates:</strong> Click on any sample notification or create a custom one to see it appear instantly in the notification dropdown.
              </Text>
              <Text>
                <strong>2. Unread Badge:</strong> The bell icon will show a badge with the count of unread notifications.
              </Text>
              <Text>
                <strong>3. Mark as Read:</strong> Click on any notification in the dropdown to mark it as read.
              </Text>
              <Text>
                <strong>4. Clear All:</strong> Use the trash icon in the notification panel to clear all notifications.
              </Text>
              <Text>
                <strong>5. WebSocket:</strong> If WebSocket server is running, notifications will sync across all open tabs/windows.
              </Text>
              <Text>
                <strong>6. Browser Notifications:</strong> Allow browser notifications when prompted for desktop alerts.
              </Text>
            </Space>
          </Card>
        </Space>
      </div>
    </DashboardLayout>
  );
}