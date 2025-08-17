'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Typography, Space, Empty, Spin } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

export default function NotificationBell() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestPermission,
  } = useNotifications();

  // Fetch initial notifications on mount
  useEffect(() => {
    fetchNotifications(1, 10);
    
    // Request notification permission
    requestPermission();
  }, []);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setDropdownOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'low':
      default:
        return '#52c41a';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return '👤';
      case 'statement_upload':
        return '📄';
      case 'proposal_creation':
        return '📝';
      case 'system':
        return '⚙️';
      default:
        return 'ℹ️';
    }
  };

  const dropdownContent = (
    <div style={{ width: 400, maxHeight: 500, overflow: 'auto' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 1,
      }}>
        <Title level={5} style={{ margin: 0 }}>Notifications</Title>
        {notifications.length > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          description="No notifications"
          style={{ padding: 40 }}
        />
      ) : (
        <List
          dataSource={notifications.slice(0, 10)}
          renderItem={(notification) => (
            <List.Item
              key={notification.id}
              style={{
                padding: '12px 16px',
                cursor: notification.actionUrl ? 'pointer' : 'default',
                background: notification.read ? '#fff' : '#f6ffed',
                borderBottom: '1px solid #f0f0f0',
              }}
              onClick={() => handleNotificationClick(notification)}
              actions={[
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDelete(e, notification.id)}
                  danger
                />,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ fontSize: 24 }}>
                    {getTypeIcon(notification.type)}
                  </div>
                }
                title={
                  <Space>
                    <Text strong={!notification.read}>
                      {notification.title}
                    </Text>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: getPriorityColor(notification.priority),
                      }}
                    />
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">{notification.message}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(notification.createdAt).fromNow()}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      {notifications.length > 10 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
        }}>
          <Button
            type="link"
            onClick={() => {
              router.push('/notifications');
              setDropdownOpen(false);
            }}
          >
            View all notifications
          </Button>
        </div>
      )}

      {!isConnected && (
        <div style={{
          padding: '8px 16px',
          background: '#fff2e8',
          borderTop: '1px solid #ffbb96',
          textAlign: 'center',
        }}>
          <Text type="warning" style={{ fontSize: 12 }}>
            Real-time updates disconnected
          </Text>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      trigger={['click']}
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      dropdownRender={() => dropdownContent}
      placement="bottomRight"
      overlayStyle={{
        boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 20 }} />}
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Badge>
    </Dropdown>
  );
}