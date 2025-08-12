import React from 'react';
import { Card, Statistic, Row, Col, Space, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { StatisticProps } from 'antd';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  formatter?: StatisticProps['formatter'];
  decimals?: number;
  info?: string;
  color?: string;
  icon?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  prefix,
  suffix,
  trend,
  trendLabel,
  loading = false,
  formatter,
  decimals = 0,
  info,
  color,
  icon,
}: StatCardProps) {
  const getTrendColor = () => {
    if (!trend) return undefined;
    return trend > 0 ? '#52c41a' : trend < 0 ? '#ff4d4f' : '#8c8c8c';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? <ArrowUpOutlined /> : trend < 0 ? <ArrowDownOutlined /> : null;
  };

  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.3s',
        height: '100%',
      }}
      hoverable
      bodyStyle={{ padding: '20px 24px' }}
    >
      <Row align="middle" justify="space-between" style={{ marginBottom: 12 }}>
        <Col>
          <Space size={8}>
            <span style={{ fontSize: 14, color: '#8c8c8c', fontWeight: 500 }}>
              {title}
            </span>
            {info && (
              <Tooltip title={info}>
                <InfoCircleOutlined style={{ fontSize: 12, color: '#bfbfbf' }} />
              </Tooltip>
            )}
          </Space>
        </Col>
        {icon && (
          <Col>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: color ? `${color}15` : '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: color || '#1677ff',
            }}>
              {icon}
            </div>
          </Col>
        )}
      </Row>
      
      <Statistic
        value={value}
        prefix={prefix}
        suffix={suffix}
        formatter={formatter}
        precision={decimals}
        valueStyle={{
          fontSize: 28,
          fontWeight: 600,
          color: color,
        }}
      />
      
      {trend !== undefined && (
        <Row style={{ marginTop: 12 }}>
          <Col>
            <Space size={4}>
              <span style={{ color: getTrendColor(), fontSize: 14, fontWeight: 500 }}>
                {getTrendIcon()}
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {trendLabel}
                </span>
              )}
            </Space>
          </Col>
        </Row>
      )}
    </Card>
  );
}