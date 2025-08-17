'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Card, Statistic, Row, Col, Space, Typography, Button, notification } from 'antd';
import { WifiOutlined, DisconnectOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useActivityWebSocket } from '@/services/activityWebSocket';
import { useSession } from 'next-auth/react';

const { Text, Title } = Typography;

interface WebSocketHealth {
  status: string;
  message: string;
  stats?: {
    totalConnections: number;
    rooms: {
      activities: number;
      notifications: number;
      presence: number;
      users: number;
    };
  };
  timestamp: string;
}

export default function WebSocketStatus() {
  const { data: session } = useSession();
  const { isConnected, latestActivity, activityStats, onlineUsers } = useActivityWebSocket();
  const [health, setHealth] = useState<WebSocketHealth | null>(null);
  const [loading, setLoading] = useState(false);

  // Check WebSocket health
  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/websocket/health');
      const data = await response.json();
      setHealth(data);
      
      if (data.status === 'healthy') {
        notification.success({
          message: 'WebSocket Healthy',
          description: 'Real-time connection is working properly',
          duration: 3,
        });
      } else {
        notification.warning({
          message: 'WebSocket Issues',
          description: data.message,
          duration: 5,
        });
      }
    } catch (error) {
      notification.error({
        message: 'Health Check Failed',
        description: 'Could not check WebSocket status',
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  // Test notification sending
  const testNotification = async () => {
    if (!session?.user?.id) {
      notification.warning({
        message: 'Not Authenticated',
        description: 'Please sign in to test notifications',
      });
      return;
    }

    try {
      const response = await fetch('/api/websocket/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'notification',
          targetUserId: session.user.id,
          data: {
            title: 'Test Notification',
            message: 'This is a test WebSocket notification',
            type: 'info',
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        notification.info({
          message: 'Test Sent',
          description: 'Check if you received the WebSocket notification',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Test Failed',
        description: 'Could not send test notification',
      });
    }
  };

  useEffect(() => {
    // Initial health check
    checkHealth();
    
    // Set up periodic health checks
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Listen for notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleNotification = (data: any) => {
      notification.open({
        message: data.title || 'New Notification',
        description: data.message || 'You have a new notification',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
    };

    // Listen for notification events
    window.addEventListener('notification:new', handleNotification as any);
    
    return () => {
      window.removeEventListener('notification:new', handleNotification as any);
    };
  }, []);

  return (
    <Card 
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>WebSocket Status</Title>
          <Badge 
            status={isConnected ? 'success' : 'error'} 
            text={isConnected ? 'Connected' : 'Disconnected'}
          />
        </Space>
      }
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={checkHealth}
            loading={loading}
          >
            Check Health
          </Button>
          <Button 
            type="primary"
            onClick={testNotification}
            disabled={!isConnected}
          >
            Test Notification
          </Button>
        </Space>
      }
    >
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="Connection"
            value={isConnected ? 'Active' : 'Inactive'}
            prefix={isConnected ? <WifiOutlined /> : <DisconnectOutlined />}
            valueStyle={{ color: isConnected ? '#52c41a' : '#cf1322' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Online Users"
            value={onlineUsers.length}
            suffix="users"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Total Connections"
            value={health?.stats?.totalConnections || 0}
            suffix="sockets"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Active Rooms"
            value={
              health?.stats 
                ? Object.values(health.stats.rooms).reduce((a, b) => a + b, 0)
                : 0
            }
            suffix="rooms"
          />
        </Col>
      </Row>

      {health && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Room Statistics</Title>
          <Row gutter={16}>
            <Col span={6}>
              <Text type="secondary">Activities:</Text> {health.stats?.rooms.activities || 0}
            </Col>
            <Col span={6}>
              <Text type="secondary">Notifications:</Text> {health.stats?.rooms.notifications || 0}
            </Col>
            <Col span={6}>
              <Text type="secondary">Presence:</Text> {health.stats?.rooms.presence || 0}
            </Col>
            <Col span={6}>
              <Text type="secondary">Users:</Text> {health.stats?.rooms.users || 0}
            </Col>
          </Row>
        </div>
      )}

      {latestActivity && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Latest Activity</Title>
          <Text>{JSON.stringify(latestActivity, null, 2)}</Text>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Text type="secondary">
          Last checked: {health ? new Date(health.timestamp).toLocaleTimeString() : 'Never'}
        </Text>
      </div>
    </Card>
  );
}