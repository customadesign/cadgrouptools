'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, message, Space, Select, Button, Descriptions } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import dayjs from 'dayjs';

const { Option } = Select;

export default function TaxSummaryPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState(dayjs().quarter());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  useEffect(() => {
    if (selectedCompany) {
      fetchReport();
    }
  }, [selectedCompany, selectedQuarter, selectedYear]);

  const fetchReport = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: selectedCompany,
        quarter: selectedQuarter.toString(),
        year: selectedYear.toString(),
      });

      const response = await fetch(`/api/reports/tax-summary?${params}`);
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
      currency: reportData?.company?.currency || 'PHP',
    }).format(val);
  };

  const categoryColumns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Transactions',
      dataIndex: 'count',
      key: 'count',
      align: 'right' as const,
    },
  ];

  const filters = (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Company</label>
        <CompanySelector
          value={selectedCompany}
          onChange={(val) => setSelectedCompany(val as string)}
          showAllOption={false}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Quarter</label>
        <Select
          value={selectedQuarter}
          onChange={setSelectedQuarter}
          style={{ width: '100%' }}
        >
          <Option value={1}>Q1 (Jan - Mar)</Option>
          <Option value={2}>Q2 (Apr - Jun)</Option>
          <Option value={3}>Q3 (Jul - Sep)</Option>
          <Option value={4}>Q4 (Oct - Dec)</Option>
        </Select>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8 }}>Year</label>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          style={{ width: '100%' }}
        >
          {Array.from({ length: 5 }, (_, i) => dayjs().year() - i).map(year => (
            <Option key={year} value={year}>{year}</Option>
          ))}
        </Select>
      </div>
    </Space>
  );

  const handleDownloadBIR = () => {
    if (!reportData) return;
    
    // Generate a simple text summary for BIR
    const birData = `
BIR TAX SUMMARY
===============

Company: ${reportData.company.legalName}
TIN: ${reportData.company.taxId || 'N/A'}
Period: Q${reportData.period.quarter} ${reportData.period.year}
Date Range: ${reportData.period.startDate} to ${reportData.period.endDate}

FINANCIAL SUMMARY
-----------------
Gross Income: ${formatCurrency(reportData.quarterlyIncome)}
Allowable Deductions: ${formatCurrency(reportData.deductibleExpenses.total)}
Net Taxable Income: ${formatCurrency(reportData.taxableIncome)}

DEDUCTIBLE EXPENSES
-------------------
${reportData.deductibleExpenses.categories.map((cat: any) => 
  `${cat.name}: ${formatCurrency(cat.amount)}`
).join('\n')}

NON-DEDUCTIBLE EXPENSES
-----------------------
${reportData.nonDeductibleExpenses.categories.map((cat: any) => 
  `${cat.name}: ${formatCurrency(cat.amount)}`
).join('\n')}

Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
    `.trim();

    const blob = new Blob([birData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BIR_Tax_Summary_Q${reportData.period.quarter}_${reportData.period.year}_${reportData.company.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <ReportLayout
      title="Tax Summary Report"
      subtitle="Quarterly tax summary with BIR-ready data"
      breadcrumbs={[{ label: 'Tax & Compliance' }, { label: 'Tax Summary' }]}
      companyName={reportData?.company?.name}
      period={reportData ? `Q${reportData.period.quarter} ${reportData.period.year}` : ''}
      filters={filters}
      onExportPDF={() => message.info('PDF export coming soon')}
      onPrint={() => window.print()}
    >
      {!selectedCompany ? (
        <Card>
          <p>Please select a company to view the report.</p>
        </Card>
      ) : loading ? (
        <Card loading />
      ) : reportData ? (
        <>
          {/* BIR Information */}
          <Card style={{ marginBottom: 24 }}>
            <Descriptions title="BIR Information" bordered column={2}>
              <Descriptions.Item label="Legal Name">{reportData.company.legalName}</Descriptions.Item>
              <Descriptions.Item label="TIN">{reportData.company.taxId || 'Not Set'}</Descriptions.Item>
              <Descriptions.Item label="Period">Q{reportData.period.quarter} {reportData.period.year}</Descriptions.Item>
              <Descriptions.Item label="Date Range">
                {dayjs(reportData.period.startDate).format('MMM DD, YYYY')} - {dayjs(reportData.period.endDate).format('MMM DD, YYYY')}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadBIR}
              >
                Download BIR Summary
              </Button>
            </div>
          </Card>

          {/* Tax Calculation Summary */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Quarterly Income"
                  value={reportData.quarterlyIncome}
                  precision={2}
                  prefix="PHP"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Deductible Expenses"
                  value={reportData.deductibleExpenses.total}
                  precision={2}
                  prefix="PHP"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Taxable Income"
                  value={reportData.taxableIncome}
                  precision={2}
                  prefix="PHP"
                  valueStyle={{ color: reportData.taxableIncome >= 0 ? '#722ed1' : '#ff4d4f', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Deductible Expenses */}
          <Card title="Deductible Expenses" style={{ marginBottom: 24 }}>
            <Table
              columns={categoryColumns}
              dataSource={reportData.deductibleExpenses.categories}
              rowKey="categoryId"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0}>Total Deductible</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {formatCurrency(reportData.deductibleExpenses.total)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      {reportData.deductibleExpenses.categories.reduce((sum: number, c: any) => sum + c.count, 0)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Non-Deductible Expenses */}
          {reportData.nonDeductibleExpenses.categories.length > 0 && (
            <Card title="Non-Deductible Expenses">
              <Table
                columns={categoryColumns}
                dataSource={reportData.nonDeductibleExpenses.categories}
                rowKey="categoryId"
                pagination={false}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                      <Table.Summary.Cell index={0}>Total Non-Deductible</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(reportData.nonDeductibleExpenses.total)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        {reportData.nonDeductibleExpenses.categories.reduce((sum: number, c: any) => sum + c.count, 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          )}
        </>
      ) : null}
    </ReportLayout>
  );
}

