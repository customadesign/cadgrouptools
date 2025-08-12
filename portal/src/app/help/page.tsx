'use client';

import React, { useState } from 'react';
import {
  Card,
  Collapse,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  List,
  Tag,
  Alert,
  Form,
  message,
  Divider,
  Result,
  Avatar,
  Timeline,
  Select,
  Badge,
} from 'antd';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  BookOutlined,
  MailOutlined,
  PhoneOutlined,
  MessageOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  RocketOutlined,
  SafetyOutlined,
  DollarOutlined,
  TeamOutlined,
  SettingOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
  CustomerServiceOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';

const { Title, Text, Paragraph, Link } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm] = Form.useForm();
  const [sending, setSending] = useState(false);

  const faqs = [
    {
      category: 'Getting Started',
      icon: <RocketOutlined />,
      questions: [
        {
          q: 'How do I create my first proposal?',
          a: 'Navigate to Proposals > New Proposal. Fill in the client details, add line items, and customize the content. You can save as draft or send directly to the client.',
        },
        {
          q: 'How do I add a new client?',
          a: 'Go to Clients > Add Client. Enter the client information including company name, contact details, and address. You can also import clients from CSV.',
        },
        {
          q: 'What file formats are supported for bank statement upload?',
          a: 'We support PDF and image formats (JPG, PNG) for bank statement uploads. Files should be less than 10MB in size.',
        },
      ],
    },
    {
      category: 'Account & Security',
      icon: <SafetyOutlined />,
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link.',
        },
        {
          q: 'How do I enable two-factor authentication?',
          a: 'Go to Settings > Security > Two-Factor Authentication. Toggle the switch to enable and follow the setup instructions.',
        },
        {
          q: 'Can I change my email address?',
          a: 'Contact your administrator to update your email address. For security reasons, this cannot be done directly.',
        },
      ],
    },
    {
      category: 'Billing & Payments',
      icon: <DollarOutlined />,
      questions: [
        {
          q: 'How do I view my billing history?',
          a: 'Navigate to Settings > Billing to view your payment history, invoices, and current subscription details.',
        },
        {
          q: 'Can I export my financial data?',
          a: 'Yes, go to Accounting > Export and select the date range and format (CSV, Excel, or PDF) for your export.',
        },
        {
          q: 'How are transactions categorized?',
          a: 'Our AI automatically categorizes transactions based on merchant information. You can manually adjust categories if needed.',
        },
      ],
    },
    {
      category: 'Team & Collaboration',
      icon: <TeamOutlined />,
      questions: [
        {
          q: 'How do I invite team members?',
          a: 'As an admin, go to Admin > User Management > Add User. Enter their email and role, and they\'ll receive an invitation.',
        },
        {
          q: 'What are the different user roles?',
          a: 'Admin users have full access including user management. Staff users can access all features except admin functions.',
        },
        {
          q: 'Can I set permissions for specific features?',
          a: 'Role-based permissions are currently limited to Admin and Staff. More granular permissions are coming soon.',
        },
      ],
    },
  ];

  const resources = [
    {
      title: 'Video Tutorials',
      icon: <VideoCameraOutlined />,
      description: 'Step-by-step video guides for all features',
      link: '#',
    },
    {
      title: 'User Guide',
      icon: <BookOutlined />,
      description: 'Comprehensive documentation and best practices',
      link: '#',
    },
    {
      title: 'API Documentation',
      icon: <FileTextOutlined />,
      description: 'Developer resources and API reference',
      link: '#',
    },
    {
      title: 'Release Notes',
      icon: <BulbOutlined />,
      description: 'Latest updates and feature announcements',
      link: '#',
    },
  ];

  const handleContactSubmit = async (values: any) => {
    setSending(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('Your message has been sent. We\'ll get back to you soon!');
      contactForm.resetFields();
    } catch (error) {
      message.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Help & Support' },
      ]}
    >
      <PageHeader
        title="Help & Support"
        subtitle="Find answers to your questions and get support"
      />

      {/* Search Bar */}
      <Card style={{ marginBottom: 24 }}>
        <Input
          size="large"
          placeholder="Search for help articles, FAQs, or features..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%' }}
        />
      </Card>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
          >
            <Avatar
              size={64}
              icon={<MessageOutlined />}
              style={{ backgroundColor: '#1677ff', marginBottom: 16 }}
            />
            <Title level={4}>Live Chat</Title>
            <Paragraph type="secondary">
              Chat with our support team in real-time
            </Paragraph>
            <Button type="primary" icon={<CommentOutlined />}>
              Start Chat
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
          >
            <Avatar
              size={64}
              icon={<MailOutlined />}
              style={{ backgroundColor: '#52c41a', marginBottom: 16 }}
            />
            <Title level={4}>Email Support</Title>
            <Paragraph type="secondary">
              Send us an email and we'll respond within 24 hours
            </Paragraph>
            <Button type="primary" icon={<MailOutlined />}>
              support@cadgroup.com
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
          >
            <Avatar
              size={64}
              icon={<PhoneOutlined />}
              style={{ backgroundColor: '#fa8c16', marginBottom: 16 }}
            />
            <Title level={4}>Phone Support</Title>
            <Paragraph type="secondary">
              Call us Mon-Fri, 9am-5pm PST
            </Paragraph>
            <Button type="primary" icon={<PhoneOutlined />}>
              +1 (555) 123-4567
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* FAQs */}
        <Col xs={24} lg={16}>
          <Card title="Frequently Asked Questions">
            {filteredFaqs.length > 0 ? (
              <Collapse accordion>
                {filteredFaqs.map((category, categoryIndex) => (
                  <Panel
                    header={
                      <Space>
                        {category.icon}
                        <Text strong>{category.category}</Text>
                        <Tag>{category.questions.length}</Tag>
                      </Space>
                    }
                    key={categoryIndex}
                  >
                    <List
                      dataSource={category.questions}
                      renderItem={(item, index) => (
                        <List.Item key={index}>
                          <List.Item.Meta
                            title={
                              <Space>
                                <QuestionCircleOutlined />
                                {item.q}
                              </Space>
                            }
                            description={
                              <Paragraph style={{ marginTop: 8 }}>
                                {item.a}
                              </Paragraph>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Panel>
                ))}
              </Collapse>
            ) : (
              <Result
                icon={<SearchOutlined />}
                title="No results found"
                subTitle="Try searching with different keywords"
              />
            )}
          </Card>

          {/* Resources */}
          <Card title="Resources & Documentation" style={{ marginTop: 24 }}>
            <Row gutter={[16, 16]}>
              {resources.map((resource, index) => (
                <Col xs={24} sm={12} key={index}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => message.info(`Opening ${resource.title}...`)}
                  >
                    <Space>
                      <Avatar icon={resource.icon} />
                      <div>
                        <Text strong>{resource.title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {resource.description}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Contact Form & Info */}
        <Col xs={24} lg={8}>
          <Card title="Contact Support">
            <Form
              form={contactForm}
              layout="vertical"
              onFinish={handleContactSubmit}
            >
              <Form.Item
                name="subject"
                label="Subject"
                rules={[{ required: true, message: 'Please enter a subject' }]}
              >
                <Input placeholder="What do you need help with?" />
              </Form.Item>

              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select placeholder="Select a category">
                  <Select.Option value="technical">Technical Issue</Select.Option>
                  <Select.Option value="billing">Billing Question</Select.Option>
                  <Select.Option value="feature">Feature Request</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true, message: 'Please enter your message' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe your issue or question..."
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={sending}
                  icon={<SendOutlined />}
                  block
                >
                  Send Message
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Title level={5}>Support Hours</Title>
            <Timeline>
              <Timeline.Item
                color="green"
                dot={<ClockCircleOutlined />}
              >
                <Text strong>Monday - Friday</Text>
                <br />
                <Text type="secondary">9:00 AM - 6:00 PM PST</Text>
              </Timeline.Item>
              <Timeline.Item
                color="orange"
                dot={<ClockCircleOutlined />}
              >
                <Text strong>Saturday</Text>
                <br />
                <Text type="secondary">10:00 AM - 4:00 PM PST</Text>
              </Timeline.Item>
              <Timeline.Item
                color="gray"
                dot={<ClockCircleOutlined />}
              >
                <Text strong>Sunday</Text>
                <br />
                <Text type="secondary">Closed</Text>
              </Timeline.Item>
            </Timeline>

            <Alert
              message="Average Response Time"
              description="We typically respond within 2-4 hours during business hours"
              type="info"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginTop: 16 }}
            />
          </Card>

          {/* System Status */}
          <Card title="System Status" style={{ marginTop: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Space>
                  <Badge status="success" />
                  <Text>All Systems Operational</Text>
                </Space>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <List
                size="small"
                dataSource={[
                  { service: 'Web Application', status: 'operational' },
                  { service: 'API Services', status: 'operational' },
                  { service: 'Database', status: 'operational' },
                  { service: 'File Storage', status: 'operational' },
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text>{item.service}</Text>
                    <Tag color="green">Operational</Tag>
                  </List.Item>
                )}
              />
              <Link href="#" style={{ fontSize: 12 }}>
                View Status Page →
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </DashboardLayout>
  );
}