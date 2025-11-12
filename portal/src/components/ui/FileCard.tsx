'use client';

import { Card, Space } from 'antd';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FileCardProps {
  type: 'slides' | 'pdf' | 'document' | string;
  name: string;
  url: string;
  icon: ReactNode;
  color: string;
}

export default function FileCard({ type, name, url, icon, color }: FileCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <Card className="theme-card h-full cursor-pointer" hoverable>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <span style={{ fontSize: 24 }}>{icon}</span>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {name}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Click to open →
              </div>
            </div>
          </Space>
        </Card>
      </a>
    </motion.div>
  );
}

