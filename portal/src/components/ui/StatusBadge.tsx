'use client';

import { Badge } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'draft' | 'sent' | 'finalized';
  size?: 'small' | 'default' | 'large';
  showIcon?: boolean;
  animated?: boolean;
}

const statusConfig = {
  pending: {
    color: '#F59E0B',
    bg: '#FEF3C7',
    darkBg: '#78350F',
    text: 'Pending',
    icon: <ClockCircleOutlined />,
  },
  processing: {
    color: '#3B82F6',
    bg: '#DBEAFE',
    darkBg: '#1E3A8A',
    text: 'Processing',
    icon: <SyncOutlined spin />,
  },
  completed: {
    color: '#10B981',
    bg: '#D1FAE5',
    darkBg: '#064E3B',
    text: 'Completed',
    icon: <CheckCircleOutlined />,
  },
  failed: {
    color: '#EF4444',
    bg: '#FEE2E2',
    darkBg: '#7F1D1D',
    text: 'Failed',
    icon: <CloseCircleOutlined />,
  },
  draft: {
    color: '#6B7280',
    bg: '#F3F4F6',
    darkBg: '#374151',
    text: 'Draft',
    icon: <ExclamationCircleOutlined />,
  },
  sent: {
    color: '#3B82F6',
    bg: '#DBEAFE',
    darkBg: '#1E3A8A',
    text: 'Sent',
    icon: <CheckCircleOutlined />,
  },
  finalized: {
    color: '#10B981',
    bg: '#D1FAE5',
    darkBg: '#064E3B',
    text: 'Finalized',
    icon: <CheckCircleOutlined />,
  },
};

export default function StatusBadge({
  status,
  size = 'default',
  showIcon = true,
  animated = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  
  const sizeStyles = {
    small: { padding: '2px 8px', fontSize: '12px' },
    default: { padding: '4px 12px', fontSize: '14px' },
    large: { padding: '6px 16px', fontSize: '16px' },
  };

  const BadgeContent = (
    <div
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        ...sizeStyles[size],
        color: config.color,
        background: `var(--color-${status === 'completed' || status === 'finalized' ? 'success' : status === 'failed' ? 'error' : status === 'processing' ? 'info' : 'warning'}-light)`,
      }}
    >
      {showIcon && <span style={{ fontSize: sizeStyles[size].fontSize }}>{config.icon}</span>}
      <span>{config.text}</span>
    </div>
  );

  if (!animated) {
    return BadgeContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.05 }}
    >
      {BadgeContent}
    </motion.div>
  );
}

