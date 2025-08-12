import React from 'react';
import { Row, Col, Space, Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  extra,
  showBack = false,
  onBack,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div style={{
      marginBottom: 24,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 12,
      padding: '24px 32px',
      color: 'white',
    }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space direction="vertical" size={4}>
            {showBack && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ color: 'white', padding: 0, marginBottom: 8 }}
              >
                Back
              </Button>
            )}
            <Title level={2} style={{ margin: 0, color: 'white' }}>
              {title}
            </Title>
            {subtitle && (
              <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>
                {subtitle}
              </Text>
            )}
          </Space>
        </Col>
        {extra && (
          <Col>
            {extra}
          </Col>
        )}
      </Row>
    </div>
  );
}