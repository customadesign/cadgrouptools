'use client';

import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

const colorMap = {
  primary: {
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    lightBg: '#DBEAFE',
    darkBg: '#1E3A8A',
  },
  success: {
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    lightBg: '#D1FAE5',
    darkBg: '#064E3B',
  },
  warning: {
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    lightBg: '#FEF3C7',
    darkBg: '#78350F',
  },
  error: {
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    lightBg: '#FEE2E2',
    darkBg: '#7F1D1D',
  },
};

export default function StatCard({
  title,
  value,
  prefix,
  suffix,
  trend,
  icon,
  color = 'primary',
  loading = false,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
    >
      <Card
        loading={loading}
        className="gradient-card h-full"
        styles={{
          body: {
            padding: '24px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">
              {title}
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {prefix}{value}{suffix}
            </div>
          </div>
          
          {icon && (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
              style={{ background: colors.gradient }}
            >
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-1 mt-auto">
            {trend.isPositive ? (
              <ArrowUpOutlined style={{ color: 'var(--color-success)', fontSize: '14px' }} />
            ) : (
              <ArrowDownOutlined style={{ color: 'var(--color-error)', fontSize: '14px' }} />
            )}
            <span
              className="text-sm font-medium"
              style={{
                color: trend.isPositive ? 'var(--color-success)' : 'var(--color-error)',
              }}
            >
              {Math.abs(trend.value)}%
            </span>
            <span className="text-sm text-[var(--text-tertiary)] ml-1">
              vs last month
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

