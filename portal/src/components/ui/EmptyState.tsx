'use client';

import { Empty, Button } from 'antd';
import { PlusOutlined, FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    text: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  type?: 'default' | 'proposals' | 'documents' | 'search';
}

const illustrations = {
  default: <InboxOutlined style={{ fontSize: 64, color: 'var(--text-tertiary)' }} />,
  proposals: <FileTextOutlined style={{ fontSize: 64, color: 'var(--text-tertiary)' }} />,
  documents: <FileTextOutlined style={{ fontSize: 64, color: 'var(--text-tertiary)' }} />,
  search: <FileTextOutlined style={{ fontSize: 64, color: 'var(--text-tertiary)' }} />,
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  type = 'default',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-6"
      >
        {icon || illustrations[type]}
      </motion.div>

      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-[var(--text-secondary)] text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            type="primary"
            size="large"
            icon={action.icon || <PlusOutlined />}
            onClick={action.onClick}
            style={{
              borderRadius: '24px',
              height: '48px',
              padding: '0 32px',
              fontWeight: 600,
            }}
          >
            {action.text}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

