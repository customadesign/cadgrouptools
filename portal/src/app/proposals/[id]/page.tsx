'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Timeline,
  Descriptions,
  Divider,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Modal,
  message,
  Spin,
  Badge,
  Tooltip,
  Dropdown,
  Input,
  Form,
  Avatar,
  List,
  Empty,
  Result,
  Progress,
  Tabs,
} from 'antd';
import {
  SendOutlined,
  EditOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  MoreOutlined,
  ShareAltOutlined,
  CopyOutlined,
  PrinterOutlined,
  ReloadOutlined,
  HistoryOutlined,
  CommentOutlined,
  PaperClipOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ProposalDetail {
  _id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  value: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  description: string;
  services: string[];
  paymentTerms: string;
  projectDuration: string;
  htmlContent?: string;
  pdfUrl?: string;
  shareableLink?: string;
  timeline: TimelineEvent[];
  attachments?: Attachment[];
  notes?: Note[];
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [form] = Form.useForm();
  const [noteForm] = Form.useForm();

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  const fetchProposal = async () => {
    setLoading(true);
    try {
      // const response = await fetch(`/api/proposals/${proposalId}`);
      // const data = await response.json();
      // setProposal(data);
      
      // Mock data for development
      const mockProposal: ProposalDetail = {
        _id: proposalId,
        title: 'Web Development Services for Q1 2024',
        clientName: 'John Smith',
        clientEmail: 'john@techcorp.com',
        clientCompany: 'Tech Corp Solutions',
        value: 45000,
        status: 'sent',
        validUntil: '2024-02-01',
        createdAt: '2024-01-01T10:00:00Z',
        sentAt: '2024-01-02T14:30:00Z',
        description: 'Complete web application development with React and Node.js, including UI/UX design, backend API development, and cloud deployment.',
        services: ['web-dev', 'api-integration', 'cloud-migration'],
        paymentTerms: 'net30',
        projectDuration: '3-4 months',
        shareableLink: `https://portal.cadgroup.com/proposals/view/${proposalId}`,
        timeline: [
          {
            id: '1',
            type: 'created',
            title: 'Proposal Created',
            description: 'Initial proposal draft created',
            timestamp: '2024-01-01T10:00:00Z',
            user: 'admin@cadgroup.com',
          },
          {
            id: '2',
            type: 'edited',
            title: 'Proposal Edited',
            description: 'Updated pricing and services',
            timestamp: '2024-01-01T15:00:00Z',
            user: 'admin@cadgroup.com',
          },
          {
            id: '3',
            type: 'sent',
            title: 'Sent to Client',
            description: 'Proposal sent via email',
            timestamp: '2024-01-02T14:30:00Z',
            user: 'admin@cadgroup.com',
          },
        ],
        attachments: [
          {
            id: '1',
            name: 'Technical_Specifications.pdf',
            size: 2457600,
            url: '/attachments/tech-specs.pdf',
            uploadedAt: '2024-01-01T11:00:00Z',
          },
          {
            id: '2',
            name: 'Portfolio_Samples.pdf',
            size: 5242880,
            url: '/attachments/portfolio.pdf',
            uploadedAt: '2024-01-01T11:30:00Z',
          },
        ],
        notes: [
          {
            id: '1',
            content: 'Client requested faster delivery timeline',
            createdBy: 'admin@cadgroup.com',
            createdAt: '2024-01-01T16:00:00Z',
          },
        ],
        htmlContent: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px;">
            <header style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #1677ff; margin-bottom: 10px;">CADGroup Management</h1>
              <p style="color: #666;">Professional Services Proposal</p>
            </header>
            
            <section style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #1677ff; padding-bottom: 10px;">Executive Summary</h2>
              <p style="line-height: 1.6; color: #555;">
                We are pleased to present this proposal for comprehensive web development services. 
                Our team will deliver a modern, scalable web application built with cutting-edge technologies 
                to meet your business requirements.
              </p>
            </section>
            
            <section style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #1677ff; padding-bottom: 10px;">Proposed Services</h2>
              <ul style="line-height: 1.8; color: #555;">
                <li><strong>Web Application Development:</strong> Custom React-based frontend with responsive design</li>
                <li><strong>Backend API Development:</strong> Node.js/Express RESTful API with MongoDB</li>
                <li><strong>Cloud Infrastructure:</strong> AWS deployment with auto-scaling and monitoring</li>
                <li><strong>UI/UX Design:</strong> Modern, intuitive interface design</li>
                <li><strong>Quality Assurance:</strong> Comprehensive testing and optimization</li>
              </ul>
            </section>
            
            <section style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #1677ff; padding-bottom: 10px;">Project Timeline</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Phase</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Duration</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Deliverables</th>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">Discovery & Planning</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">2 weeks</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">Requirements document, Technical architecture</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">Design & Prototyping</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">3 weeks</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">UI/UX designs, Interactive prototype</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">Development</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">8 weeks</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">Functional application, API documentation</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">Testing & Deployment</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">3 weeks</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">Deployed application, User documentation</td>
                </tr>
              </table>
            </section>
            
            <section style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #1677ff; padding-bottom: 10px;">Investment Summary</h2>
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
                <h3 style="color: #1677ff; margin-top: 0;">Total Project Investment: $45,000</h3>
                <p style="color: #666; margin: 10px 0;">Payment Terms: Net 30</p>
                <p style="color: #666; margin: 10px 0;">Valid Until: February 1, 2024</p>
              </div>
            </section>
            
            <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999;">© 2024 CADGroup Management. All rights reserved.</p>
            </footer>
          </div>
        `,
      };
      
      setTimeout(() => {
        setProposal(mockProposal);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Failed to fetch proposal details');
      setLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      message.success('Proposal sent successfully');
      setSendModalVisible(false);
      form.resetFields();
      
      // Update proposal status
      if (proposal) {
        setProposal({
          ...proposal,
          status: 'sent',
          sentAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to send proposal:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // await fetch(`/api/proposals/${proposalId}`, { method: 'DELETE' });
      message.success('Proposal deleted successfully');
      router.push('/proposals');
    } catch (error) {
      message.error('Failed to delete proposal');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      // await fetch(`/api/proposals/${proposalId}/generate`, { method: 'POST' });
      message.success('Proposal regenerated successfully');
      await fetchProposal();
    } catch (error) {
      message.error('Failed to regenerate proposal');
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddNote = async () => {
    try {
      const values = await noteForm.validateFields();
      message.success('Note added successfully');
      setNoteModalVisible(false);
      noteForm.resetFields();
      
      // Add note to proposal
      if (proposal) {
        const newNote: Note = {
          id: Date.now().toString(),
          content: values.note,
          createdBy: 'admin@cadgroup.com',
          createdAt: new Date().toISOString(),
        };
        setProposal({
          ...proposal,
          notes: [...(proposal.notes || []), newNote],
        });
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      sent: 'blue',
      viewed: 'orange',
      accepted: 'green',
      rejected: 'red',
      expired: 'gray',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      draft: <EditOutlined />,
      sent: <SendOutlined />,
      viewed: <EyeOutlined />,
      accepted: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />,
      expired: <ClockCircleOutlined />,
    };
    return icons[status] || null;
  };

  const getTimelineIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      created: <FileTextOutlined />,
      edited: <EditOutlined />,
      sent: <SendOutlined />,
      viewed: <EyeOutlined />,
      accepted: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />,
    };
    return icons[type] || <ClockCircleOutlined />;
  };

  const actionMenu = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Proposal',
      onClick: () => router.push(`/proposals/${proposalId}/edit`),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Duplicate',
      onClick: () => message.info('Duplicate functionality coming soon'),
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print',
      onClick: () => window.print(),
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: 'Get Shareable Link',
      onClick: () => {
        if (proposal?.shareableLink) {
          navigator.clipboard.writeText(proposal.shareableLink);
          message.success('Link copied to clipboard');
        }
      },
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => setDeleteModalVisible(true),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: 'Proposals', href: '/proposals' },
          { title: 'Loading...' },
        ]}
      >
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (!proposal) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: 'Proposals', href: '/proposals' },
          { title: 'Not Found' },
        ]}
      >
        <Result
          status="404"
          title="Proposal Not Found"
          subTitle="The proposal you're looking for doesn't exist or has been deleted."
          extra={
            <Button type="primary" onClick={() => router.push('/proposals')}>
              Back to Proposals
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  const daysUntilExpiry = dayjs(proposal.validUntil).diff(dayjs(), 'days');
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Proposals', href: '/proposals' },
        { title: proposal.title },
      ]}
    >
      <PageHeader
        title={proposal.title}
        subtitle={`For ${proposal.clientName} at ${proposal.clientCompany}`}
        onBack={() => router.push('/proposals')}
        tags={
          <Space>
            <Tag icon={getStatusIcon(proposal.status)} color={getStatusColor(proposal.status)}>
              {proposal.status.toUpperCase()}
            </Tag>
            {isExpired && <Tag color="error">EXPIRED</Tag>}
            {isExpiringSoon && <Tag color="warning">EXPIRING SOON</Tag>}
          </Space>
        }
        extra={
          <Space>
            {proposal.status === 'draft' && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setSendModalVisible(true)}
              >
                Send to Client
              </Button>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={() => message.info('PDF download coming soon')}
            >
              Download PDF
            </Button>
            <Dropdown menu={{ items: actionMenu }} trigger={['click']}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        }
      />

      {/* Alert Messages */}
      {isExpired && (
        <Alert
          message="This proposal has expired"
          description="The validity period for this proposal has ended. Consider creating a new proposal for the client."
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}
      {isExpiringSoon && (
        <Alert
          message={`This proposal expires in ${daysUntilExpiry} days`}
          description="Consider following up with the client before the proposal expires."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Proposal Value"
              value={proposal.value}
              prefix="$"
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Valid Until"
              value={dayjs(proposal.validUntil).format('MMM DD, YYYY')}
              prefix={<CalendarOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Project Duration"
              value={proposal.projectDuration}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Days Until Expiry"
              value={Math.abs(daysUntilExpiry)}
              suffix={isExpired ? 'days ago' : 'days'}
              valueStyle={{ 
                fontSize: 20,
                color: isExpired ? '#ff4d4f' : isExpiringSoon ? '#fa8c16' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'preview',
              label: (
                <span>
                  <EyeOutlined />
                  Preview
                </span>
              ),
              children: (
                <div>
                  {regenerating ? (
                    <div style={{ textAlign: 'center', padding: 50 }}>
                      <Spin size="large" />
                      <Title level={4} style={{ marginTop: 16 }}>
                        Regenerating proposal...
                      </Title>
                    </div>
                  ) : (
                    <div>
                      <Space style={{ marginBottom: 16 }}>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleRegenerate}
                          loading={regenerating}
                        >
                          Regenerate
                        </Button>
                        <Button icon={<EditOutlined />}>
                          Edit Template
                        </Button>
                      </Space>
                      <div
                        style={{
                          border: '1px solid #d9d9d9',
                          borderRadius: 8,
                          padding: 24,
                          background: '#fff',
                          minHeight: 600,
                        }}
                        dangerouslySetInnerHTML={{ __html: proposal.htmlContent || '' }}
                      />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'details',
              label: (
                <span>
                  <InfoCircleOutlined />
                  Details
                </span>
              ),
              children: (
                <div>
                  <Descriptions
                    title="Proposal Information"
                    bordered
                    column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                  >
                    <Descriptions.Item label="Proposal ID">
                      {proposal._id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag icon={getStatusIcon(proposal.status)} color={getStatusColor(proposal.status)}>
                        {proposal.status.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Client Name">
                      {proposal.clientName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Client Email">
                      <a href={`mailto:${proposal.clientEmail}`}>{proposal.clientEmail}</a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Company">
                      {proposal.clientCompany}
                    </Descriptions.Item>
                    <Descriptions.Item label="Proposal Value">
                      <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                        ${proposal.value.toLocaleString()}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Terms">
                      {proposal.paymentTerms === 'net30' ? 'Net 30' : proposal.paymentTerms}
                    </Descriptions.Item>
                    <Descriptions.Item label="Project Duration">
                      {proposal.projectDuration}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                      {dayjs(proposal.createdAt).format('MMMM DD, YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Valid Until">
                      {dayjs(proposal.validUntil).format('MMMM DD, YYYY')}
                    </Descriptions.Item>
                    {proposal.sentAt && (
                      <Descriptions.Item label="Sent">
                        {dayjs(proposal.sentAt).format('MMMM DD, YYYY HH:mm')}
                      </Descriptions.Item>
                    )}
                    {proposal.viewedAt && (
                      <Descriptions.Item label="First Viewed">
                        {dayjs(proposal.viewedAt).format('MMMM DD, YYYY HH:mm')}
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  <Divider />

                  <Title level={5}>Description</Title>
                  <Paragraph>{proposal.description}</Paragraph>

                  {proposal.shareableLink && (
                    <>
                      <Divider />
                      <Title level={5}>Shareable Link</Title>
                      <Input
                        value={proposal.shareableLink}
                        readOnly
                        addonAfter={
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(proposal.shareableLink);
                              message.success('Link copied to clipboard');
                            }}
                          >
                            Copy
                          </Button>
                        }
                      />
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'timeline',
              label: (
                <span>
                  <HistoryOutlined />
                  Timeline
                </span>
              ),
              children: (
                <Timeline
                  mode="left"
                  items={proposal.timeline.map(event => ({
                    dot: getTimelineIcon(event.type),
                    color: event.type === 'accepted' ? 'green' : event.type === 'rejected' ? 'red' : 'blue',
                    children: (
                      <div>
                        <Text strong>{event.title}</Text>
                        {event.description && (
                          <div>
                            <Text type="secondary">{event.description}</Text>
                          </div>
                        )}
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(event.timestamp).format('MMM DD, YYYY HH:mm')} • {event.user}
                          </Text>
                        </div>
                      </div>
                    ),
                  }))}
                />
              ),
            },
            {
              key: 'attachments',
              label: (
                <span>
                  <PaperClipOutlined />
                  Attachments
                  {proposal.attachments && proposal.attachments.length > 0 && (
                    <Badge count={proposal.attachments.length} style={{ marginLeft: 8 }} />
                  )}
                </span>
              ),
              children: (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <Button icon={<PaperClipOutlined />} type="primary">
                      Add Attachment
                    </Button>
                  </Space>
                  {proposal.attachments && proposal.attachments.length > 0 ? (
                    <List
                      dataSource={proposal.attachments}
                      renderItem={attachment => (
                        <List.Item
                          actions={[
                            <Button
                              key="download"
                              type="link"
                              icon={<DownloadOutlined />}
                              onClick={() => message.info('Download functionality coming soon')}
                            >
                              Download
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={<FileTextOutlined />} />}
                            title={attachment.name}
                            description={`${(attachment.size / 1048576).toFixed(2)} MB • Uploaded ${dayjs(attachment.uploadedAt).fromNow()}`}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="No attachments" />
                  )}
                </div>
              ),
            },
            {
              key: 'notes',
              label: (
                <span>
                  <CommentOutlined />
                  Notes
                  {proposal.notes && proposal.notes.length > 0 && (
                    <Badge count={proposal.notes.length} style={{ marginLeft: 8 }} />
                  )}
                </span>
              ),
              children: (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={() => setNoteModalVisible(true)}
                    >
                      Add Note
                    </Button>
                  </Space>
                  {proposal.notes && proposal.notes.length > 0 ? (
                    <List
                      dataSource={proposal.notes}
                      renderItem={note => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} />}
                            title={note.createdBy}
                            description={
                              <div>
                                <Paragraph>{note.content}</Paragraph>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {dayjs(note.createdAt).format('MMM DD, YYYY HH:mm')}
                                </Text>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="No notes" />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Send Modal */}
      <Modal
        title="Send Proposal to Client"
        open={sendModalVisible}
        onOk={handleSend}
        onCancel={() => setSendModalVisible(false)}
        okText="Send"
        okButtonProps={{ icon: <SendOutlined /> }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="to"
            label="To"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
            initialValue={proposal.clientEmail}
          >
            <Input prefix={<MailOutlined />} placeholder="client@example.com" />
          </Form.Item>
          <Form.Item
            name="cc"
            label="CC"
          >
            <Input prefix={<MailOutlined />} placeholder="Optional CC recipients" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
            initialValue={`Proposal: ${proposal.title}`}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter a message' }]}
            initialValue={`Dear ${proposal.clientName},\n\nPlease find attached our proposal for ${proposal.title}.\n\nWe look forward to working with you.\n\nBest regards,\nCADGroup Team`}
          >
            <TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        title="Delete Proposal"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Delete"
        okType="danger"
        okButtonProps={{ icon: <DeleteOutlined /> }}
      >
        <Alert
          message="Are you sure you want to delete this proposal?"
          description={
            <div>
              <p>This action cannot be undone. The following will be deleted:</p>
              <ul>
                <li>Proposal document</li>
                <li>All attachments</li>
                <li>Timeline history</li>
                <li>Notes and comments</li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
        />
      </Modal>

      {/* Add Note Modal */}
      <Modal
        title="Add Note"
        open={noteModalVisible}
        onOk={handleAddNote}
        onCancel={() => {
          setNoteModalVisible(false);
          noteForm.resetFields();
        }}
        okText="Add Note"
      >
        <Form form={noteForm} layout="vertical">
          <Form.Item
            name="note"
            label="Note"
            rules={[{ required: true, message: 'Please enter a note' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter your note here..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}