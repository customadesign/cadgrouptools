'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Badge,
  Button,
  Dropdown,
  Card,
  List,
  Avatar,
  Space,
  Typography,
  Tabs,
  Empty,
  Spin,
  Tooltip,
  message,
  Divider,
} from 'antd';
import {
  BellOutlined,
  BellFilled,
  CheckOutlined,
  DeleteOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  ReadOutlined,
  TeamOutlined,
  FileDoneOutlined,
  CreditCardOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification, NotificationType } from '@/types/notification';
import styles from './NotificationDropdown.module.css';

dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

interface NotificationDropdownProps {
  isMobile?: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isMobile = false }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isAnimating, setIsAnimating] = useState(false);
  const prevUnreadCount = useRef(unreadCount);

  // Animate badge when new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap = {
      user: <TeamOutlined />,
      document: <FileDoneOutlined />,
      proposal: <FileTextOutlined />,
      system: <SettingOutlined />,
      payment: <CreditCardOutlined />,
      task: <CalendarOutlined />,
    };
    return iconMap[type] || <BellOutlined />;
  };

  const getNotificationColor = (type: NotificationType) => {
    const colorMap = {
      user: '#1677ff',
      document: '#52c41a',
      proposal: '#722ed1',
      system: '#fa8c16',
      payment: '#13c2c2',
      task: '#eb2f96',
    };
    return colorMap[type] || '#8c8c8c';
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'high':
        return <InfoCircleOutlined style={{ color: '#fa8c16' }} />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = dayjs(timestamp);
    const now = dayjs();
    const diffMinutes = now.diff(date, 'minute');
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return date.fromNow();
    if (diffMinutes < 1440) return date.format('h:mm A');
    if (diffMinutes < 2880) return 'Yesterday ' + date.format('h:mm A');
    return date.format('MMM D, h:mm A');
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    message.success('All notifications marked as read');
  };

  const handleClearAll = async () => {
    await clearAll();
    message.success('All notifications cleared');
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const dropdownContent = (
    <Card
      className={styles.notificationCard}
      bodyStyle={{ padding: 0 }}
      style={{
        width: isMobile ? '100vw' : 420,
        maxHeight: '80vh',
        overflow: 'hidden',
        borderRadius: isMobile ? 0 : 12,
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Header */}
      <div className={styles.header}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            Notifications
          </Title>
          <Space size="small">
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ marginRight: 8 }}>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>unread</span>
              </Badge>
            )}
            <Tooltip title="Mark all as read">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              />
            </Tooltip>
            <Tooltip title="Clear all">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                danger
              />
            </Tooltip>
          </Space>
        </Space>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'all' | 'unread')}
        className={styles.tabs}
        style={{ marginBottom: 0 }}
      >
        <TabPane tab={`All (${notifications.length})`} key="all" />
        <TabPane 
          tab={
            <Space>
              <span>Unread</span>
              {unreadCount > 0 && (
                <Badge count={unreadCount} size="small" />
              )}
            </Space>
          } 
          key="unread" 
        />
      </Tabs>

      {/* Notifications List */}
      <div className={styles.notificationList}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Empty
            image={<InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
            description={
              activeTab === 'unread' 
                ? "You're all caught up!"
                : "No notifications yet"
            }
            style={{ padding: '48px 0' }}
          />
        ) : (
          <AnimatePresence>
            <List
              dataSource={filteredNotifications}
              renderItem={(notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <List.Item
                    className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    actions={[
                      <Space key="actions" size="small">
                        {!notification.read && (
                          <Tooltip title="Mark as read">
                            <Button
                              type="text"
                              size="small"
                              icon={<CheckOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          />
                        </Tooltip>
                      </Space>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge dot={!notification.read} offset={[-6, 6]}>
                          <Avatar
                            style={{
                              backgroundColor: getNotificationColor(notification.type),
                              opacity: notification.read ? 0.7 : 1,
                            }}
                            icon={getNotificationIcon(notification.type)}
                            size={40}
                          />
                        </Badge>
                      }
                      title={
                        <Space>
                          <Text strong={!notification.read}>
                            {notification.title}
                          </Text>
                          {getPriorityIcon(notification.priority)}
                        </Space>
                      }
                      description={
                        <div>
                          <Paragraph
                            ellipsis={{ rows: 2 }}
                            style={{ 
                              margin: '4px 0',
                              color: notification.read ? '#8c8c8c' : '#595959',
                            }}
                          >
                            {notification.message}
                          </Paragraph>
                          <Space size="small" style={{ marginTop: 4 }}>
                            <ClockCircleOutlined style={{ fontSize: 12 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatTimestamp(notification.timestamp)}
                            </Text>
                            {notification.sender && (
                              <>
                                <span style={{ color: '#d9d9d9' }}>•</span>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {notification.sender.name}
                                </Text>
                              </>
                            )}
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                </motion.div>
              )}
            />
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div className={styles.footer}>
            <Button type="link" block onClick={() => setOpen(false)}>
              View All Notifications
            </Button>
          </div>
        </>
      )}
    </Card>
  );

  return (
    <Dropdown
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlay={dropdownContent}
      overlayStyle={{ padding: 0 }}
    >
      <Badge 
        count={unreadCount} 
        size="small"
        className={isAnimating ? styles.animateBadge : ''}
      >
        <Button
          type="text"
          shape="circle"
          icon={
            open ? (
              <BellFilled style={{ fontSize: isMobile ? 16 : 18 }} />
            ) : (
              <BellOutlined style={{ fontSize: isMobile ? 16 : 18 }} />
            )
          }
          style={{ 
            width: isMobile ? 36 : 40, 
            height: isMobile ? 36 : 40,
            color: open ? '#1677ff' : undefined,
          }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;