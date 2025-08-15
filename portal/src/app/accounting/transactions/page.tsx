'use client';

import React, { useState, useEffect, Suspense } from 'react';

// Force dynamic rendering to prevent static generation issues with theme context
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { useSearchParams } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  Statistic,
  Typography,
  Drawer,
  Descriptions,
  Timeline,
  Avatar,
  Dropdown,
  Checkbox,
  Radio,
  InputNumber,
  message,
  Tooltip,
  Badge,
  Empty,
  Alert,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  CalendarOutlined,
  DollarOutlined,
  BankOutlined,
  TagOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  ShoppingCartOutlined,
  HomeOutlined,
  CarOutlined,
  CoffeeOutlined,
  TeamOutlined,
  ShopOutlined,
  WalletOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined,
  SyncOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface Transaction {
  _id: string;
  id?: string;
  statement?: {
    _id: string;
    accountName: string;
    bankName?: string;
    month: number;
    year: number;
  };
  txnDate: string;
  date?: string;
  description: string;
  vendor?: string;
  amount: number;
  direction: 'debit' | 'credit';
  type?: 'income' | 'expense' | 'transfer';
  checkNo?: string;
  balance?: number;
  category?: string;
  subcategory?: string;
  confidence?: number;
  account?: string;
  status?: 'completed' | 'pending' | 'failed';
  reference?: string;
  notes?: string;
  tags?: string[];
  attachments?: number;
  reconciled?: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = {
  income: [
    { value: 'client_payment', label: 'Client Payment', icon: <TeamOutlined /> },
    { value: 'investment', label: 'Investment Income', icon: <DollarOutlined /> },
    { value: 'refund', label: 'Refund', icon: <SwapOutlined /> },
    { value: 'other_income', label: 'Other Income', icon: <WalletOutlined /> },
  ],
  expense: [
    { value: 'technology', label: 'Technology', icon: <ShopOutlined /> },
    { value: 'rent', label: 'Rent & Utilities', icon: <HomeOutlined /> },
    { value: 'transport', label: 'Transportation', icon: <CarOutlined /> },
    { value: 'meals', label: 'Meals & Entertainment', icon: <CoffeeOutlined /> },
    { value: 'office', label: 'Office Supplies', icon: <ShoppingCartOutlined /> },
    { value: 'payroll', label: 'Payroll', icon: <TeamOutlined /> },
    { value: 'other_expense', label: 'Other Expense', icon: <WalletOutlined /> },
  ],
};

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statementId = searchParams.get('statement');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [form] = Form.useForm();
  const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [accounts, setAccounts] = useState<Array<{ _id: string; name: string; bankName: string }>>([]);

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, [statementId, dateRange, filterCategory, filterType, filterAccount]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts?status=active');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (statementId) params.append('statement', statementId);
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory);
      if (searchText) params.append('search', searchText);
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Transform API data to match frontend interface
        const transformedTransactions = data.data.map((txn: any) => ({
          ...txn,
          id: txn._id,
          date: txn.txnDate,
          type: txn.direction === 'credit' ? 'income' : 'expense',
          account: txn.statement?.accountName || 'Unknown Account',
          status: 'completed',
          vendor: txn.description.split(' - ')[0] || txn.description,
          reconciled: false,
        }));
        setTransactions(transformedTransactions);
      } else {
        // If no data from API, show empty state
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Transaction) => {
    setSelectedTransaction(record);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date || record.txnDate),
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      const updatedTransaction = {
        ...selectedTransaction,
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        updatedAt: new Date().toISOString(),
      };
      
      setTransactions(transactions.map(t => 
        t.id === updatedTransaction.id ? updatedTransaction : t
      ));
      
      message.success('Transaction updated successfully');
      setEditModalVisible(false);
      form.resetFields();
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = (record: Transaction) => {
    Modal.confirm({
      title: 'Delete Transaction',
      content: `Are you sure you want to delete this transaction for $${record.amount.toLocaleString()}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/api/transactions/${record._id || record.id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setTransactions(transactions.filter(t => (t._id || t.id) !== (record._id || record.id)));
            message.success('Transaction deleted successfully');
          } else {
            throw new Error('Failed to delete transaction');
          }
        } catch (error) {
          console.error('Error deleting transaction:', error);
          message.error('Failed to delete transaction. Please try again.');
        }
      },
    });
  };

  const handleBulkAction = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select transactions first');
      return;
    }
    setBulkActionModalVisible(true);
  };

  const executeBulkAction = () => {
    const action = form.getFieldValue('bulkAction');
    const selectedTransactions = transactions.filter(t => selectedRowKeys.includes(t.id));
    
    switch (action) {
      case 'reconcile':
        setTransactions(transactions.map(t => 
          selectedRowKeys.includes(t.id) ? { ...t, reconciled: true } : t
        ));
        message.success(`${selectedRowKeys.length} transactions reconciled`);
        break;
      case 'categorize':
        const category = form.getFieldValue('bulkCategory');
        setTransactions(transactions.map(t => 
          selectedRowKeys.includes(t.id) ? { ...t, category } : t
        ));
        message.success(`${selectedRowKeys.length} transactions categorized`);
        break;
      case 'delete':
        Modal.confirm({
          title: 'Delete Selected Transactions',
          content: `Are you sure you want to delete ${selectedRowKeys.length} transactions?`,
          okText: 'Delete',
          okType: 'danger',
          onOk: () => {
            setTransactions(transactions.filter(t => !selectedRowKeys.includes(t.id)));
            message.success(`${selectedRowKeys.length} transactions deleted`);
            setSelectedRowKeys([]);
          },
        });
        break;
      case 'export':
        message.info('Exporting selected transactions...');
        break;
    }
    
    setBulkActionModalVisible(false);
    setSelectedRowKeys([]);
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      message.warning('No transactions to export');
      return;
    }

    // Prepare CSV data
    const headers = [
      'Date',
      'Description',
      'Vendor',
      'Type',
      'Category',
      'Amount',
      'Account',
      'Reference',
      'Status',
      'Reconciled',
      'Notes'
    ];

    const rows = filteredTransactions.map(txn => [
      dayjs(txn.date || txn.txnDate).format('YYYY-MM-DD'),
      txn.description,
      txn.vendor || '',
      txn.type || txn.direction,
      txn.category || '',
      txn.amount.toString(),
      txn.account || '',
      txn.reference || '',
      txn.status || '',
      txn.reconciled ? 'Yes' : 'No',
      txn.notes || ''
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = cell.replace(/"/g, '""');
        return cell.includes(',') ? `"${escaped}"` : escaped;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('Transactions exported successfully');
  };

  const getCategoryIcon = (category: string) => {
    const allCategories = [...categories.income, ...categories.expense];
    const cat = allCategories.find(c => c.value === category);
    return cat?.icon || <TagOutlined />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
      case 'expense':
        return <ArrowUpOutlined style={{ color: '#ff4d4f' }} />;
      case 'transfer':
        return <SwapOutlined style={{ color: '#1677ff' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.vendor?.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.checkNo?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesAccount = filterAccount === 'all' || transaction.account === filterAccount;
    
    const transactionDate = transaction.date || transaction.txnDate;
    const matchesDate = !dateRange || 
      (dayjs(transactionDate).isAfter(dateRange[0]) && 
       dayjs(transactionDate).isBefore(dateRange[1]));
    
    return matchesSearch && matchesCategory && matchesType && matchesAccount && matchesDate;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netAmount = totalIncome - totalExpenses;

  const getActionMenu = (record: Transaction): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => {
        setSelectedTransaction(record);
        setDetailDrawerVisible(true);
      },
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => handleEdit(record),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Duplicate',
      onClick: () => message.info('Duplicate functionality coming soon'),
    },
    record.attachments && record.attachments > 0 && {
      key: 'attachments',
      icon: <FileTextOutlined />,
      label: `View Attachments (${record.attachments})`,
      onClick: () => message.info('Attachments viewer coming soon'),
    },
    {
      type: 'divider',
    },
    {
      key: 'reconcile',
      icon: record.reconciled ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
      label: record.reconciled ? 'Unreconcile' : 'Reconcile',
      onClick: () => {
        setTransactions(transactions.map(t => 
          t.id === record.id ? { ...t, reconciled: !t.reconciled } : t
        ));
        message.success(record.reconciled ? 'Transaction unreconciled' : 'Transaction reconciled');
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => handleDelete(record),
    },
  ].filter(Boolean);

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Description',
      key: 'description',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.description}</Text>
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.vendor}
            </Text>
            {record.reference && (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>•</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.reference}
                </Text>
              </>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      filters: [...categories.income, ...categories.expense].map(c => ({
        text: c.label,
        value: c.value,
      })),
      onFilter: (value, record) => record.category === value,
      render: (category) => {
        const cat = [...categories.income, ...categories.expense].find(c => c.value === category);
        return (
          <Tag icon={getCategoryIcon(category)} color="blue">
            {cat?.label || category}
          </Tag>
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount, record) => (
        <Space>
          {getTypeIcon(record.type)}
          <Text
            strong
            style={{
              color: record.type === 'income' ? '#52c41a' : 
                     record.type === 'expense' ? '#ff4d4f' : '#1677ff',
              fontSize: 14,
            }}
          >
            ${amount.toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      width: 150,
      filters: accounts.map(account => ({
        text: `${account.name} - ${account.bankName}`,
        value: `${account.name} - ${account.bankName}`,
      })),
      onFilter: (value, record) => record.account === value,
      render: (account) => (
        <Space>
          {account.includes('Credit') ? <CreditCardOutlined /> : <BankOutlined />}
          <Text>{account}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'Pending', value: 'pending' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'indicators',
      width: 80,
      render: (_, record) => (
        <Space>
          {record.reconciled && (
            <Tooltip title="Reconciled">
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
          {record.attachments && record.attachments > 0 && (
            <Tooltip title={`${record.attachments} attachment(s)`}>
              <Badge count={record.attachments} size="small">
                <FileTextOutlined />
              </Badge>
            </Tooltip>
          )}
          {record.tags && record.tags.length > 0 && (
            <Tooltip title={record.tags.join(', ')}>
              <TagOutlined />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionMenu(record) }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Accounting', href: '/accounting' },
        { title: 'Transactions' },
      ]}
    >
      <PageHeader
        title="Transactions"
        subtitle="View and manage all your financial transactions"
        onBack={() => router.push('/accounting')}
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={fetchTransactions}>
              Refresh
            </Button>
            <Button icon={<ExportOutlined />} onClick={exportToCSV}>
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedTransaction(null);
                form.resetFields();
                setEditModalVisible(true);
              }}
            >
              Add Transaction
            </Button>
          </Space>
        }
      />

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Income"
              value={totalIncome}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={totalExpenses}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Net Amount"
              value={netAmount}
              precision={2}
              valueStyle={{ color: netAmount >= 0 ? '#1677ff' : '#ff4d4f' }}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="Search transactions..."
              allowClear
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Type"
              value={filterType}
              onChange={setFilterType}
            >
              <Option value="all">All Types</Option>
              <Option value="income">Income</Option>
              <Option value="expense">Expense</Option>
              <Option value="transfer">Transfer</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Category"
              value={filterCategory}
              onChange={setFilterCategory}
            >
              <Option value="all">All Categories</Option>
              <Select.OptGroup label="Income">
                {categories.income.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select.OptGroup>
              <Select.OptGroup label="Expense">
                {categories.expense.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select.OptGroup>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Account"
              value={filterAccount}
              onChange={setFilterAccount}
            >
              <Option value="all">All Accounts</Option>
              {accounts.map(account => (
                <Option key={account._id} value={`${account.name} - ${account.bankName}`}>
                  {account.name} - {account.bankName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange([dates[0], dates[1]])}
              style={{ width: '100%' }}
              format="MMM DD, YYYY"
            />
          </Col>
        </Row>
        
        {selectedRowKeys.length > 0 && (
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Alert
                message={
                  <Space>
                    <Text>{selectedRowKeys.length} transaction(s) selected</Text>
                    <Button size="small" onClick={handleBulkAction}>
                      Bulk Actions
                    </Button>
                    <Button size="small" onClick={() => setSelectedRowKeys([])}>
                      Clear Selection
                    </Button>
                  </Space>
                }
                type="info"
                showIcon
              />
            </Col>
          </Row>
        )}
      </Card>

      {/* Transactions Table */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredTransactions}
          rowKey={(record) => record._id || record.id || ''}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transactions`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No transactions found"
              >
                <Button type="primary" onClick={() => setEditModalVisible(true)}>
                  Add First Transaction
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Edit/Add Modal */}
      <Modal
        title={selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setSelectedTransaction(null);
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Radio.Group>
                  <Radio.Button value="income">Income</Radio.Button>
                  <Radio.Button value="expense">Expense</Radio.Button>
                  <Radio.Button value="transfer">Transfer</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="Transaction description" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vendor"
                label="Vendor/Payee"
                rules={[{ required: true, message: 'Please enter vendor' }]}
              >
                <Input placeholder="Vendor or payee name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  <Select.OptGroup label="Income">
                    {categories.income.map(cat => (
                      <Option key={cat.value} value={cat.value}>
                        {cat.label}
                      </Option>
                    ))}
                  </Select.OptGroup>
                  <Select.OptGroup label="Expense">
                    {categories.expense.map(cat => (
                      <Option key={cat.value} value={cat.value}>
                        {cat.label}
                      </Option>
                    ))}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="account"
                label="Account"
                rules={[{ required: true, message: 'Please select account' }]}
              >
                <Select placeholder="Select account">
                  {accounts.map(account => (
                    <Option key={account._id} value={`${account.name} - ${account.bankName}`}>
                      {account.name} - {account.bankName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="reference"
            label="Reference Number"
          >
            <Input placeholder="Invoice, check, or reference number" />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select
              mode="tags"
              placeholder="Add tags"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="reconciled"
            valuePropName="checked"
          >
            <Checkbox>Mark as reconciled</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        title="Bulk Actions"
        open={bulkActionModalVisible}
        onOk={executeBulkAction}
        onCancel={() => {
          setBulkActionModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="bulkAction"
            label="Select Action"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="reconcile">Mark as Reconciled</Radio>
                <Radio value="categorize">Change Category</Radio>
                <Radio value="export">Export Selected</Radio>
                <Radio value="delete">Delete Selected</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          
          {form.getFieldValue('bulkAction') === 'categorize' && (
            <Form.Item
              name="bulkCategory"
              label="New Category"
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select placeholder="Select category">
                <Select.OptGroup label="Income">
                  {categories.income.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select.OptGroup>
                <Select.OptGroup label="Expense">
                  {categories.expense.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select.OptGroup>
              </Select>
            </Form.Item>
          )}
        </Form>
        
        <Alert
          message={`This action will affect ${selectedRowKeys.length} transaction(s)`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="Transaction Details"
        placement="right"
        width={500}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedTransaction(null);
        }}
        open={detailDrawerVisible}
      >
        {selectedTransaction && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Date">
                {dayjs(selectedTransaction.date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={
                  selectedTransaction.type === 'income' ? 'green' :
                  selectedTransaction.type === 'expense' ? 'red' : 'blue'
                }>
                  {selectedTransaction.type.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong style={{ 
                  fontSize: 18,
                  color: selectedTransaction.type === 'income' ? '#52c41a' : 
                         selectedTransaction.type === 'expense' ? '#ff4d4f' : '#1677ff'
                }}>
                  ${selectedTransaction.amount.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedTransaction.description}
              </Descriptions.Item>
              <Descriptions.Item label="Vendor/Payee">
                {selectedTransaction.vendor}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag icon={getCategoryIcon(selectedTransaction.category)} color="blue">
                  {[...categories.income, ...categories.expense]
                    .find(c => c.value === selectedTransaction.category)?.label || 
                    selectedTransaction.category}
                </Tag>
              </Descriptions.Item>
              {selectedTransaction.subcategory && (
                <Descriptions.Item label="Subcategory">
                  {selectedTransaction.subcategory}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Account">
                <Space>
                  {selectedTransaction.account.includes('Credit') ? 
                    <CreditCardOutlined /> : <BankOutlined />}
                  {selectedTransaction.account}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedTransaction.status)}>
                  {selectedTransaction.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              {selectedTransaction.reference && (
                <Descriptions.Item label="Reference">
                  {selectedTransaction.reference}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Reconciled">
                {selectedTransaction.reconciled ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">Yes</Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="default">No</Tag>
                )}
              </Descriptions.Item>
              {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                <Descriptions.Item label="Tags">
                  <Space wrap>
                    {selectedTransaction.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              {selectedTransaction.notes && (
                <Descriptions.Item label="Notes">
                  {selectedTransaction.notes}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created">
                {dayjs(selectedTransaction.createdAt).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {dayjs(selectedTransaction.updatedAt).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
            
            {selectedTransaction.attachments && selectedTransaction.attachments > 0 && (
              <>
                <Divider />
                <Title level={5}>Attachments ({selectedTransaction.attachments})</Title>
                <List
                  dataSource={[...Array(selectedTransaction.attachments)].map((_, i) => ({
                    id: i,
                    name: `Document_${i + 1}.pdf`,
                  }))}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button key="view" type="link" icon={<EyeOutlined />}>
                          View
                        </Button>,
                        <Button key="download" type="link" icon={<DownloadOutlined />}>
                          Download
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<FileTextOutlined />} />}
                        title={item.name}
                        description="Uploaded 2 days ago"
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
            
            <Divider />
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => handleEdit(selectedTransaction)}>
                Edit Transaction
              </Button>
              <Button
                danger
                onClick={() => {
                  handleDelete(selectedTransaction);
                  setDetailDrawerVisible(false);
                }}
              >
                Delete
              </Button>
            </Space>
          </div>
        )}
      </Drawer>
    </DashboardLayout>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout breadcrumbs={[{ title: 'Accounting', href: '/accounting' }, { title: 'Transactions' }]}>
        <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
      </DashboardLayout>
    }>
      <TransactionsContent />
    </Suspense>
  );
}