'use client';

import { Breadcrumb, Button, Card, Drawer, Space, Typography } from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FilterOutlined,
  HomeOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';

const { Title, Text } = Typography;

interface ReportLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ href?: string; label: string }>;
  companyName?: string;
  period?: string;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  filters?: ReactNode;
  children: ReactNode;
}

export default function ReportLayout({
  title,
  subtitle,
  breadcrumbs = [],
  companyName,
  period,
  onExportPDF,
  onExportCSV,
  onExportExcel,
  onPrint,
  filters,
  children,
}: ReportLayoutProps) {
  const [filtersVisible, setFiltersVisible] = useState(false);

  const defaultBreadcrumbs = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/reports', label: 'Reports' },
    ...breadcrumbs,
  ];

  return (
    <ModernDashboardLayout>
      <div style={{ padding: '24px' }}>
        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          {defaultBreadcrumbs.map((crumb, index) => (
            <Breadcrumb.Item key={index}>
              {crumb.href ? (
                <Link href={crumb.href}>
                  {index === 0 && <HomeOutlined style={{ marginRight: 4 }} />}
                  {crumb.label}
                </Link>
              ) : (
                crumb.label
              )}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>

        {/* Header */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Title level={2} style={{ marginBottom: 4 }}>
                {title}
              </Title>
              {subtitle && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {subtitle}
                </Text>
              )}
              {companyName && (
                <Text strong style={{ display: 'block' }}>
                  Company: {companyName}
                </Text>
              )}
              {period && (
                <Text type="secondary" style={{ display: 'block' }}>
                  Period: {period}
                </Text>
              )}
            </div>

            {/* Action Buttons */}
            <Space>
              {filters && (
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFiltersVisible(true)}
                >
                  Filters
                </Button>
              )}

              {onExportPDF && (
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={onExportPDF}
                >
                  PDF
                </Button>
              )}

              {onExportCSV && (
                <Button
                  icon={<FileTextOutlined />}
                  onClick={onExportCSV}
                >
                  CSV
                </Button>
              )}

              {onExportExcel && (
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={onExportExcel}
                >
                  Excel
                </Button>
              )}

              {onPrint && (
                <Button
                  icon={<PrinterOutlined />}
                  onClick={onPrint}
                >
                  Print
                </Button>
              )}
            </Space>
          </div>
        </Card>

        {/* Report Content */}
        <div id="report-content">{children}</div>

        {/* Filters Drawer */}
        {filters && (
          <Drawer
            title="Report Filters"
            placement="right"
            open={filtersVisible}
            onClose={() => setFiltersVisible(false)}
            width={400}
          >
            {filters}
          </Drawer>
        )}
      </div>
    </ModernDashboardLayout>
  );
}

