'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, message, Typography, List } from 'antd';
import { BankOutlined, WalletOutlined } from '@ant-design/icons';
import ReportLayout from '@/components/reports/ReportLayout';
import { ExpensePieChart } from '@/components/reports/ReportCharts';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function CashPositionPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/consolidated/cash');
      if (!response.ok) throw new Error('Failed to fetch report');
      
      const data = await response.json();
      setReportData(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(val);
  };

  const accountTypeColors: Record<string, string> = {
    checking: '#1890ff',
    savings: '#52c41a',
    credit: '#ff4d4f',
    investment: '#722ed1',
  };

  const accountTypeLabels: Record<string, string> = {
    checking: 'Checking',
    savings: 'Savings',
    credit: 'Credit',
    investment: 'Investment',
  };

  return (
    <ReportLayout
      title="Consolidated Cash Position"
      subtitle="Total cash across all companies and accounts"
      breadcrumbs={[{ label: 'Consolidated Reports' }, { label: 'Cash Position' }]}
      period={`As of ${dayjs(reportData?.timestamp).format('MMM DD, YYYY HH:mm')}`}
      onExportPDF={() => message.info('PDF export coming soon')}
      onExportCSV={() => message.info('CSV export coming soon')}
      onPrint={() => window.print()}
    >
      {loading ? (
        <Card loading />
      ) : reportData ? (
        <>
          {/* Total Cash Hero Card */}
          <Card style={{ marginBottom: 24, textAlign: 'center', backgroundColor: '#f0f5ff' }}>
            <Statistic
              title={<Title level={3} style={{ margin: 0 }}>Total Cash Position</Title>}
              value={reportData.totalCash}
              precision={2}
              prefix="PHP"
              valueStyle={{ 
                color: reportData.totalCash >= 0 ? '#52c41a' : '#ff4d4f',
                fontSize: 48,
                fontWeight: 700
              }}
            />
          </Card>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            {/* Cash by Account Type */}
            <Col xs={24} lg={10}>
              <Card title="Cash by Account Type" style={{ height: '100%' }}>
                <ExpensePieChart
                  data={{
                    labels: Object.keys(reportData.byAccountType).map(type => accountTypeLabels[type]),
                    datasets: [
                      {
                        data: Object.values(reportData.byAccountType),
                        backgroundColor: Object.keys(reportData.byAccountType).map(type => accountTypeColors[type]),
                        borderWidth: 1,
                      },
                    ],
                  }}
                  height={300}
                />
                <div style={{ marginTop: 16 }}>
                  {Object.entries(reportData.byAccountType).map(([type, amount]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            backgroundColor: accountTypeColors[type],
                            marginRight: 8,
                            borderRadius: 2,
                          }}
                        />
                        {accountTypeLabels[type]}
                      </span>
                      <strong>{formatCurrency(amount as number)}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Company Breakdown */}
            <Col xs={24} lg={14}>
              <Card title="Cash by Company" style={{ height: '100%' }}>
                {reportData.companies.map((company: any) => (
                  <Card
                    key={company.companyId}
                    type="inner"
                    title={company.name}
                    extra={
                      <Statistic
                        value={company.cash}
                        precision={2}
                        prefix={company.currency}
                        valueStyle={{ 
                          fontSize: 18,
                          color: company.cash >= 0 ? '#52c41a' : '#ff4d4f' 
                        }}
                      />
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <List
                      size="small"
                      dataSource={company.accounts}
                      renderItem={(account: any) => (
                        <List.Item>
                          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                            <span>
                              <BankOutlined style={{ marginRight: 8 }} />
                              {account.name} - {account.bankName}
                              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                                ({account.type})
                              </Typography.Text>
                            </span>
                            <strong>{formatCurrency(account.balance)}</strong>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                ))}
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </ReportLayout>
  );
}

