import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div style={{
      marginBottom: isMobile ? 16 : 24,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: isMobile ? 8 : 12,
      padding: isMobile ? '16px' : '24px 32px',
      color: 'white',
    }}>
      <Row 
        justify="space-between" 
        align={isMobile ? 'top' : 'middle'}
        gutter={[16, 16]}
      >
        <Col xs={24} sm={16} md={18} lg={18}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {showBack && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ 
                  color: 'white', 
                  padding: 0, 
                  marginBottom: 8,
                  fontSize: isMobile ? 14 : 16
                }}
              >
                Back
              </Button>
            )}
            <Title 
              level={isMobile ? 3 : 2} 
              style={{ 
                margin: 0, 
                color: 'white',
                fontSize: isMobile ? 'clamp(20px, 5vw, 28px)' : undefined
              }}
            >
              {title}
            </Title>
            {subtitle && (
              <Text style={{ 
                fontSize: isMobile ? 14 : 16, 
                color: 'rgba(255,255,255,0.85)',
                display: 'block',
                marginTop: 4
              }}>
                {subtitle}
              </Text>
            )}
          </Space>
        </Col>
        {extra && (
          <Col xs={24} sm={8} md={6} lg={6}>
            <div style={{ 
              display: 'flex', 
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: isMobile ? 8 : 0
            }}>
              {extra}
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
}