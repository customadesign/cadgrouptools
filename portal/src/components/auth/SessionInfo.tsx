'use client';

import { useSession } from 'next-auth/react';
import { Card, Descriptions, Tag, Spin } from 'antd';

/**
 * Component to display current session information.
 * Demonstrates stateless JWT session data available on the client.
 */
export default function SessionInfo() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Spin size="large" />;
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <Card title="Session Status">
        <p>No active session. Please sign in.</p>
      </Card>
    );
  }

  // Calculate time until token expiry
  const expiryDate = new Date(session.expires);
  const now = new Date();
  const hoursUntilExpiry = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <Card title="Session Information (Stateless JWT)">
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="User ID">
          {session.user.id}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {session.user.email}
        </Descriptions.Item>
        <Descriptions.Item label="Role">
          <Tag color={session.user.role === 'admin' ? 'red' : 'blue'}>
            {session.user.role?.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Session Expires">
          {expiryDate.toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Time Until Expiry">
          <Tag color={hoursUntilExpiry < 2 ? 'warning' : 'success'}>
            {hoursUntilExpiry} hours
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Session Type">
          <Tag color="green">Stateless JWT Cookie</Tag>
        </Descriptions.Item>
      </Descriptions>
      
      <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
        <strong>How it works:</strong>
        <ul style={{ marginTop: 8, fontSize: 12 }}>
          <li>Session data is stored in a JWT token within an HTTP-only cookie</li>
          <li>No server-side session storage or database lookups required</li>
          <li>Token is verified using cryptographic signatures</li>
          <li>Cookie is automatically sent with every request</li>
          <li>Session expires after 24 hours and requires re-authentication</li>
        </ul>
      </div>
    </Card>
  );
}