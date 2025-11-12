'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, message, Space, Select, Radio, Tooltip, Input, Button, Tag } from 'antd';
import { FileTextOutlined, EditOutlined, SaveOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ReportLayout from '@/components/reports/ReportLayout';
import CompanySelector from '@/components/reports/CompanySelector';
import { exportReportToCSV } from '@/lib/reports/exportUtils';
import dayjs from 'dayjs';

const { Option } = Select;

export default function CheckRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [sortBy, setSortBy] = useState<'checkNo' | 'date'>('checkNo');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Pre-select company from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('companyId');
    if (companyId) {
      setSelectedCompany(companyId);
    }
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchReport();
    }
  }, [selectedCompany, selectedMonth, selectedYear, sortBy]);

  const fetchReport = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: selectedCompany,
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
        sortBy,
      });

      const response = await fetch(`/api/reports/checks?${params}`);
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

  const handleExportExcel = () => {
    if (!reportData) return;
    
    // Export checks to Excel format
    const checksData = reportData.checks.map((check: any) => ({
      'Check #': check.checkNo,
      'Date': dayjs(check.date).format('MM/DD/YYYY'),
      'Payee': check.vendor,
      'Purpose': check.purpose,
      'Amount': check.amount.toFixed(2),
    }));

    // Add summary row
    checksData.push({
      'Check #': '',
      'Date': '',
      'Payee': '',
      'Purpose': 'TOTAL',
      'Amount': reportData.summary.totalAmount.toFixed(2),
    });

    // Generate filename
    const filename = `Check_Register_${reportData.company.name.replace(/\s+/g, '_')}_${reportData.period.monthName}_${reportData.period.year}`;
    
    // Use CSV export (Excel can open CSV files)
    exportReportToCSV({ checks: checksData }, 'checks', reportData.company.name, reportData.summary.dateRange);
  };

  const columns = [
    {
      title: 'Check #',
      dataIndex: 'checkNo',
      key: 'checkNo',
      width: 150,
      sorter: (a: any, b: any) => {
        // Try numeric sort first
        const aNum = parseInt(a.checkNo);
        const bNum = parseInt(b.checkNo);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        // Fallback to string sort
        return a.checkNo.localeCompare(b.checkNo);
      },
      render: (checkNo: string, record: any) => {
        const isEditing = editingId === record.id;
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEditing ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onPressEnter={() => handleEditSave(record.id)}
                  autoFocus
                  style={{ width: 80 }}
                  size="small"
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={() => handleEditSave(record.id)}
                />
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleEditCancel}
                />
              </>
            ) : (
              <>
                <span style={{ fontWeight: 500 }}>{checkNo}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditStart(record)}
                  style={{ opacity: 0.6 }}
                  title="Edit check number"
                />
              </>
            )}
          </div>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val: string) => dayjs(val).format('MMM DD, YYYY'),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Payee',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 200,
      ellipsis: true,
      sorter: (a: any, b: any) => a.vendor.localeCompare(b.vendor),
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (purpose: string) => (
        <Tooltip placement="topLeft" title={purpose}>
          {purpose}
        </Tooltip>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      width: 120,
      render: (val: number) => (
        <span style={{ fontWeight: 500, color: '#ff4d4f' }}>
          {formatCurrency(val)}
        </span>
      ),
      sorter: (a: any, b: any) => a.amount - b.amount,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: {
        showTitle: false,
      },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          {description}
        </Tooltip>
      ),
    },
  ];

  const handleEditStart = (record: any) => {
    setEditingId(record.id);
    setEditValue(record.checkNo);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleEditSave = async (transactionId: string) => {
    if (!editValue.trim()) {
      message.error('Check number cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkNo: editValue.trim() }),
      });

      if (!response.ok) throw new Error('Failed to update check number');

      message.success('Check number updated successfully');
      setEditingId(null);
      setEditValue('');
      
      // Refresh the report to show updated data
      fetchReport();
    } catch (error: any) {
      message.error(error.message || 'Failed to update check number');
    }
  };

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filters = (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Company</label>
        <CompanySelector
          value={selectedCompany}
          onChange={(val) => setSelectedCompany(val as string)}
          showAllOption={false}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Month</label>
        <Select
          value={selectedMonth}
          onChange={setSelectedMonth}
          style={{ width: '100%' }}
        >
          {monthOptions.map((month, index) => (
            <Option key={index + 1} value={index + 1}>
              {month}
            </Option>
          ))}
        </Select>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Year</label>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          style={{ width: '100%' }}
        >
          {Array.from({ length: 10 }, (_, i) => dayjs().year() - i).map(year => (
            <Option key={year} value={year}>{year}</Option>
          ))}
        </Select>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Sort By</label>
        <Radio.Group
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="checkNo">Check Number</Radio.Button>
          <Radio.Button value="date">Date</Radio.Button>
        </Radio.Group>
      </div>
    </Space>
  );

  return (
    <ReportLayout
      title="Check Register"
      subtitle="Monthly list of all checks written with check numbers and details"
      breadcrumbs={[{ label: 'Check Register' }]}
      companyName={reportData?.company?.name}
      period={reportData?.summary?.dateRange}
      filters={filters}
      onExportCSV={handleExportExcel}
      onExportExcel={handleExportExcel}
      onPrint={() => window.print()}
    >
      {!selectedCompany ? (
        <Card>
          <p>Please select a company to view the check register.</p>
        </Card>
      ) : loading ? (
        <Card loading />
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Total Checks Written"
                  value={reportData.summary.totalChecks}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Total Amount"
                  value={reportData.summary.totalAmount}
                  precision={2}
                  prefix={reportData.company.currency}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Checks Table */}
          <Card 
            title={`Checks for ${reportData.period.monthName} ${reportData.period.year}`}
            extra={
              <span style={{ color: '#8c8c8c' }}>
                Sorted by {sortBy === 'checkNo' ? 'Check Number' : 'Date'}
              </span>
            }
          >
            {reportData.checks.length > 0 ? (
              <Table
                columns={columns}
                dataSource={reportData.checks}
                rowKey={(record: any) => `${record.checkNo}-${record.date}`}
                pagination={{ pageSize: 50, showTotal: (total) => `Total ${total} checks` }}
                scroll={{ x: 1000 }}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        TOTAL
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <span style={{ color: '#ff4d4f', fontSize: 16 }}>
                          {formatCurrency(reportData.summary.totalAmount)}
                        </span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#8c8c8c' }}>
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>No checks found for this period.</p>
                <p style={{ fontSize: 12 }}>
                  Checks are identified by check number in the transaction data.
                </p>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </ReportLayout>
  );
}

