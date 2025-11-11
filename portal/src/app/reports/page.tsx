'use client';

import { Card, Col, Row, Typography } from 'antd';
import {
  DollarOutlined,
  FundOutlined,
  PieChartOutlined,
  RiseOutlined,
  UnorderedListOutlined,
  GlobalOutlined,
  CompareOutlined,
  WalletOutlined,
  FileTextOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';

const { Title, Paragraph } = Typography;

const reportCategories = [
  {
    title: 'Individual Company Reports',
    reports: [
      {
        title: 'Profit & Loss Statement',
        description: 'Revenue and expense breakdown with net income analysis',
        icon: <DollarOutlined style={{ fontSize: 32 }} />,
        href: '/reports/pl',
        color: '#52c41a',
      },
      {
        title: 'Cash Flow Statement',
        description: 'Track cash inflows, outflows, and ending cash position',
        icon: <FundOutlined style={{ fontSize: 32 }} />,
        href: '/reports/cashflow',
        color: '#1890ff',
      },
      {
        title: 'Expense Analysis',
        description: 'Detailed expense breakdown by category and vendor',
        icon: <PieChartOutlined style={{ fontSize: 32 }} />,
        href: '/reports/expenses',
        color: '#ff4d4f',
      },
      {
        title: 'Revenue Analysis',
        description: 'Revenue sources and month-over-month trends',
        icon: <RiseOutlined style={{ fontSize: 32 }} />,
        href: '/reports/revenue',
        color: '#722ed1',
      },
      {
        title: 'Transaction Ledger',
        description: 'Complete transaction register with advanced filtering',
        icon: <UnorderedListOutlined style={{ fontSize: 32 }} />,
        href: '/reports/transactions',
        color: '#fa8c16',
      },
      {
        title: 'Check Register',
        description: 'Monthly list of all checks written with check numbers',
        icon: <FileTextOutlined style={{ fontSize: 32 }} />,
        href: '/reports/checks',
        color: '#13c2c2',
      },
    ],
  },
  {
    title: 'Consolidated Reports',
    reports: [
      {
        title: 'Consolidated P&L',
        description: 'Combined profit & loss across multiple companies',
        icon: <GlobalOutlined style={{ fontSize: 32 }} />,
        href: '/reports/consolidated/pl',
        color: '#13c2c2',
      },
      {
        title: 'Company Comparison',
        description: 'Side-by-side performance comparison',
        icon: <CompareOutlined style={{ fontSize: 32 }} />,
        href: '/reports/consolidated/comparison',
        color: '#eb2f96',
      },
      {
        title: 'Cash Position',
        description: 'Total cash across all companies and accounts',
        icon: <WalletOutlined style={{ fontSize: 32 }} />,
        href: '/reports/consolidated/cash',
        color: '#faad14',
      },
    ],
  },
  {
    title: 'Tax & Compliance',
    reports: [
      {
        title: 'Tax Summary',
        description: 'Quarterly tax summary with BIR-ready data',
        icon: <FileTextOutlined style={{ fontSize: 32 }} />,
        href: '/reports/tax-summary',
        color: '#2f54eb',
      },
      {
        title: 'Data Quality',
        description: 'Uncategorized transactions and categorization rate',
        icon: <WarningOutlined style={{ fontSize: 32 }} />,
        href: '/reports/uncategorized',
        color: '#fa541c',
      },
    ],
  },
];

export default function ReportsPage() {
  return (
    <ModernDashboardLayout>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Financial Reports</Title>
        <Paragraph type="secondary" style={{ marginBottom: 32 }}>
          Comprehensive financial reporting for single and multi-company analysis
        </Paragraph>

        {reportCategories.map((category, index) => (
          <div key={index} style={{ marginBottom: 48 }}>
            <Title level={3} style={{ marginBottom: 16 }}>
              {category.title}
            </Title>
            <Row gutter={[16, 16]}>
              {category.reports.map((report, reportIndex) => (
                <Col key={reportIndex} xs={24} sm={12} lg={8}>
                  <Link href={report.href} style={{ textDecoration: 'none' }}>
                    <Card
                      hoverable
                      style={{ height: '100%' }}
                      bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <div
                          style={{
                            backgroundColor: `${report.color}15`,
                            color: report.color,
                            padding: 16,
                            borderRadius: 8,
                            marginRight: 16,
                          }}
                        >
                          {report.icon}
                        </div>
                        <Title level={4} style={{ margin: 0, flex: 1 }}>
                          {report.title}
                        </Title>
                      </div>
                      <Paragraph type="secondary" style={{ margin: 0 }}>
                        {report.description}
                      </Paragraph>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </div>
    </ModernDashboardLayout>
  );
}
