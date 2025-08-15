'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  Steps,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Card,
  Space,
  Checkbox,
  Radio,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
  Tag,
  Avatar,
  Result,
  message,
  Spin,
  List,
  Tooltip,
  DatePicker,
  ConfigProvider,
  theme,
  Empty,
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  BuildOutlined,
  TeamOutlined,
  RocketOutlined,
  SafetyOutlined,
  CloudOutlined,
  ApiOutlined,
  MobileOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  CodeOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  GlobalOutlined,
  ShareAltOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Client {
  _id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  address?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  basePrice: number;
  category: string;
}

const services: Service[] = [
  // Websites
  {
    id: 'website-starter',
    name: 'Website Starter Package',
    description: '5 Pages, Premium Theme, Mobile Responsive, SEO Tools Built-in',
    icon: <DesktopOutlined />,
    basePrice: 750,
    category: 'Websites',
  },
  {
    id: 'website-bronze',
    name: 'Website Bronze Package',
    description: '1-3 Pages, 100% Custom Theme, Mobile Responsive, Site Speed Optimization',
    icon: <DesktopOutlined />,
    basePrice: 900,
    category: 'Websites',
  },
  {
    id: 'website-silver',
    name: 'Website Silver Package',
    description: 'Up to 5 Pages, Custom Theme, Social Feeds, 1 Interior Page Design',
    icon: <DesktopOutlined />,
    basePrice: 1200,
    category: 'Websites',
  },
  {
    id: 'website-gold',
    name: 'Website Gold Package',
    description: 'Up to 10 Pages, Custom Theme, Media Gallery, Event Calendar',
    icon: <DesktopOutlined />,
    basePrice: 1900,
    category: 'Websites',
  },

  // E-commerce
  {
    id: 'shopify',
    name: 'E-commerce (Shopify) Package',
    description: 'Shopify Theme Customization, 20 Products, PayPal/Stripe Integration',
    icon: <ShoppingCartOutlined />,
    basePrice: 2200,
    category: 'E‑commerce',
  },
  {
    id: 'woocommerce',
    name: 'E-commerce (WooCommerce) Package',
    description: '100% Custom Theme, 20 Products, Full Checkout Control',
    icon: <ShoppingCartOutlined />,
    basePrice: 2500,
    category: 'E‑commerce',
  },
  {
    id: 'wp-landing',
    name: 'WordPress Landing Page',
    description: 'Single Page Layout, Custom Design, WordPress Development, Email Capture Form',
    icon: <ApiOutlined />,
    basePrice: 600,
    category: 'Websites',
  },
  {
    id: 'ghl-funnel',
    name: 'HighLevel Sales Funnel',
    description: 'Single Page Layout, Custom Design, HighLevel Development, Email Capture Form',
    icon: <CloudOutlined />,
    basePrice: 500,
    category: 'Websites',
  },

  // Design
  {
    id: 'logo-design',
    name: 'Logo Design Package',
    description: '3 Logo Concepts, 2 Revision Rounds, Vector AI & SVG Files, Photoshop PSD File',
    icon: <EditOutlined />,
    basePrice: 200,
    category: 'Design',
  },
  {
    id: 'business-card',
    name: 'Business Card Design Package',
    description: 'Custom Single-Sided Design, 2 Revision Rounds, Print-Ready AI & PSD Files, Optional Double-Sided for +$75',
    icon: <EditOutlined />,
    basePrice: 250,
    category: 'Design',
  },
  {
    id: 'homepage-mock',
    name: 'Homepage Design Mockup',
    description: '1 Custom Homepage Design, 2 Revision Rounds, Layered Photoshop PSD File',
    icon: <DesktopOutlined />,
    basePrice: 200,
    category: 'Design',
  },
  {
    id: 'interior-mock',
    name: 'Interior Page Design Mockup',
    description: '1 Custom Interior Page Design, 2 Revision Rounds, Layered Photoshop PSD File',
    icon: <DesktopOutlined />,
    basePrice: 100,
    category: 'Design',
  },

  // Content
  {
    id: 'website-content',
    name: 'Website Content',
    description: '700-800 Words, SEO Optimized, Professionally Written, 1 Revision, .doc/.pdf Delivery',
    icon: <FileTextOutlined />,
    basePrice: 50,
    category: 'Content',
  },
  {
    id: 'blog-content',
    name: 'Blog Content',
    description: '800-1200 Words, SEO Optimized, Media-Rich (Images/Videos), 1 Revision, Posted to Your Blog',
    icon: <FileTextOutlined />,
    basePrice: 60,
    category: 'Content',
  },

  // SEO / Local
  {
    id: 'seo-foundation',
    name: 'SEO Foundation Package (Monthly)',
    description: 'On-Page SEO Audit, Keyword Research (15), Technical Fixes, Monthly Link Building, GA & GSC Setup, Monthly Reporting',
    icon: <GlobalOutlined />,
    basePrice: 700,
    category: 'SEO',
  },
  {
    id: 'gmb-management',
    name: 'Google My Business Management (Monthly)',
    description: 'Listing Optimization, Review/Spam Management, Weekly Posts, Monthly Insights, 100+ Directory Citations',
    icon: <ShopOutlined />,
    basePrice: 250,
    category: 'Local SEO',
  },

  // Ads – Google
  {
    id: 'google-ads-bronze',
    name: 'Google Ads - Bronze (Monthly)',
    description: 'Ad Spend up to $1,500/mo • Up to 10 Core Keywords • Search Campaign • Ad Copy • Conversion Tracking • Monthly Reporting',
    icon: <GlobalOutlined />,
    basePrice: 395,
    category: 'Ads - Google',
  },
  {
    id: 'google-ads-silver',
    name: 'Google Ads - Silver (Monthly)',
    description: 'Ad Spend up to $3,500/mo • Up to 20 Keywords • Search + Shopping/Display • A/B Testing • Daily Monitoring • Reporting',
    icon: <GlobalOutlined />,
    basePrice: 595,
    category: 'Ads - Google',
  },
  {
    id: 'google-ads-gold',
    name: 'Google Ads - Gold (Monthly)',
    description: 'Ad Spend up to $6,000/mo • Up to 35 Keywords • Multi-Channel (Search, Shopping, YouTube) • Weekly Optimization • Reporting',
    icon: <GlobalOutlined />,
    basePrice: 895,
    category: 'Ads - Google',
  },

  // Ads – Meta/IG
  {
    id: 'meta-ads-bronze',
    name: 'Meta/IG Ads - Bronze (Monthly)',
    description: 'Ad Spend up to $1,500/mo • Pixel & Conversions • 2 Image Ads & 1 Video • Monthly Reporting',
    icon: <ShareAltOutlined />,
    basePrice: 395,
    category: 'Ads - Meta/IG',
  },
  {
    id: 'meta-ads-silver',
    name: 'Meta/IG Ads - Silver (Monthly)',
    description: 'Ad Spend up to $3,500/mo • 4 Image Ads & 2 Video Ads • New Creatives Monthly • Audience Testing & Optimization',
    icon: <ShareAltOutlined />,
    basePrice: 695,
    category: 'Ads - Meta/IG',
  },
  {
    id: 'meta-ads-gold',
    name: 'Meta/IG Ads - Gold (Monthly)',
    description: 'Ad Spend up to $6,000/mo • 4 Image Ads & 4 Video Ads • New Creatives Monthly • Advanced Scaling & Automation Rules',
    icon: <ShareAltOutlined />,
    basePrice: 995,
    category: 'Ads - Meta/IG',
  },

  // Social Media
  {
    id: 'social-basic',
    name: 'Social Media - Basic (Monthly)',
    description: '3 Scheduled Posts/Week • 1 Platform • Unique Content • Engagement Monitoring',
    icon: <ShareAltOutlined />,
    basePrice: 260,
    category: 'Social Media',
  },
  {
    id: 'social-pro',
    name: 'Social Media - Pro (Monthly)',
    description: '5 Posts/Week • 2 Platforms • Unique Content • Engagement & Inbox Management',
    icon: <ShareAltOutlined />,
    basePrice: 495,
    category: 'Social Media',
  },
  {
    id: 'social-ultimate',
    name: 'Social Media - Ultimate (Monthly)',
    description: 'Daily Posts • 4 Platforms • Unique Content • Full Engagement & Inbox Management',
    icon: <ShareAltOutlined />,
    basePrice: 650,
    category: 'Social Media',
  },

  // VA Services
  {
    id: 'va-services',
    name: 'Virtual Assistant (VA) Services',
    description: 'Dedicated VA support. Equivalent to $10/hr for 160 hours (monthly retainer).',
    icon: <UserOutlined />,
    basePrice: 1600,
    category: 'VA Services',
  },

  // Custom
  {
    id: 'custom-project',
    name: 'Custom Project (Get Estimate)',
    description: 'Tailored to client needs. A free, custom estimate is available on our website.',
    icon: <TeamOutlined />,
    basePrice: 0,
    category: 'Custom',
  },
];

export default function CreateProposalPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [proposalData, setProposalData] = useState<any>({});
  const [generating, setGenerating] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const { token } = theme.useToken();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100');
      const data = await response.json();
      
      // Map the clients from the API response
      const mappedClients = data.clients?.map((client: any) => ({
        _id: client._id,
        name: client.organization,
        email: client.email || '',
        company: client.organization,
        phone: client.phone,
        address: client.address,
      })) || [];
      
      // If no clients from API, use mock data
      if (mappedClients.length === 0) {
        setClients([
          { _id: '1', name: 'John Smith', email: 'john@techcorp.com', company: 'Tech Corp Solutions' },
          { _id: '2', name: 'Sarah Johnson', email: 'sarah@innovate.io', company: 'Innovate IO' },
          { _id: '3', name: 'Michael Chen', email: 'michael@global.com', company: 'Global Ventures Ltd' },
        ]);
      } else {
        setClients(mappedClients);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      // Mock data for development
      setClients([
        { _id: '1', name: 'John Smith', email: 'john@techcorp.com', company: 'Tech Corp Solutions' },
        { _id: '2', name: 'Sarah Johnson', email: 'sarah@innovate.io', company: 'Innovate IO' },
        { _id: '3', name: 'Michael Chen', email: 'michael@global.com', company: 'Global Ventures Ltd' },
      ]);
    }
  };

  const calculateTotalPrice = () => {
    const selectedServicesList = services.filter(s => selectedServices.includes(s.id));
    const baseTotal = selectedServicesList.reduce((sum, service) => sum + service.basePrice, 0);
    const murphyRate = form.getFieldValue('murphyRate') || 150;
    const clientRate = form.getFieldValue('clientRate') || 200;
    const margin = ((clientRate - murphyRate) / clientRate) * 100;
    
    return {
      baseTotal,
      murphyTotal: baseTotal * (murphyRate / 150), // Adjust based on rate
      clientTotal: baseTotal * (clientRate / 150), // Adjust based on rate
      margin: margin.toFixed(1),
      profit: baseTotal * ((clientRate - murphyRate) / 150),
    };
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setProposalData({ ...proposalData, ...values });
      
      if (currentStep === 3) {
        // Final step - create proposal
        await handleCreateProposal();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Please fill in all required fields');
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreateProposal = async () => {
    setGenerating(true);
    try {
      const formData = form.getFieldsValue();
      const pricing = calculateTotalPrice();
      
      const proposalPayload = {
        ...proposalData,
        ...formData,
        services: selectedServices,
        pricing,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };

      // Create proposal
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalPayload),
      });

      if (response.ok) {
        const { id } = await response.json();
        setProposalId(id);
        
        // Trigger generation
        await fetch(`/api/proposals/${id}/generate`, {
          method: 'POST',
        });
        
        setCurrentStep(4); // Success step
      } else {
        throw new Error('Failed to create proposal');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      message.error('Failed to create proposal');
    } finally {
      setGenerating(false);
    }
  };

  const steps = [
    {
      title: 'Client',
      icon: <UserOutlined />,
    },
    {
      title: 'Services',
      icon: <BuildOutlined />,
    },
    {
      title: 'Pricing',
      icon: <DollarOutlined />,
    },
    {
      title: 'Review',
      icon: <FileTextOutlined />,
    },
  ];

  const renderClientStep = () => (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 24 }}>
          Select or Create Client
        </Title>
        
        <Form.Item
          name="clientType"
          label="Client Type"
          rules={[{ required: true, message: 'Please select client type' }]}
        >
          <Radio.Group size="large" style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card 
                hoverable 
                style={{ cursor: 'pointer' }}
                bodyStyle={{ padding: 16 }}
              >
                <Radio value="existing">
                  <Space>
                    <TeamOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                    <div>
                      <Text strong>Existing Client</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Choose from your client database
                      </Text>
                    </div>
                  </Space>
                </Radio>
              </Card>
              
              <Card 
                hoverable 
                style={{ cursor: 'pointer' }}
                bodyStyle={{ padding: 16 }}
              >
                <Radio value="new">
                  <Space>
                    <PlusOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
                    <div>
                      <Text strong>New Client</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Add a new client to the system
                      </Text>
                    </div>
                  </Space>
                </Radio>
              </Card>
            </Space>
          </Radio.Group>
        </Form.Item>

        {form.getFieldValue('clientType') === 'existing' && (
          <Form.Item
            name="clientId"
            label="Select Client"
            rules={[{ required: true, message: 'Please select a client' }]}
          >
            <Select
              size="large"
              placeholder="Choose a client"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={clients.map(client => ({
                value: client._id,
                label: `${client.name} - ${client.company}`,
              }))}
              notFoundContent={
                clients.length === 0 ? (
                  <Spin size="small" />
                ) : (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="No clients found" 
                  />
                )
              }
            />
          </Form.Item>
        )}

        {form.getFieldValue('clientType') === 'new' && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="clientName"
                  label="Client Name"
                  rules={[{ required: true, message: 'Please enter client name' }]}
                >
                  <Input size="large" placeholder="John Smith" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="clientEmail"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input size="large" placeholder="john@company.com" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="clientCompany"
                  label="Company"
                  rules={[{ required: true, message: 'Please enter company name' }]}
                >
                  <Input size="large" placeholder="Tech Corp Solutions" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="clientPhone" label="Phone">
                  <Input size="large" placeholder="+1 (555) 123-4567" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Card>

      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>
          Proposal Details
        </Title>
        
        <Form.Item
          name="title"
          label="Proposal Title"
          rules={[{ required: true, message: 'Please enter proposal title' }]}
        >
          <Input 
            size="large" 
            placeholder="Web Development Services for Q1 2024"
            prefix={<FileTextOutlined />}
          />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Project Description"
          rules={[{ required: true, message: 'Please enter project description' }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Describe the project scope and objectives..."
            showCount
            maxLength={500}
          />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="validUntil"
              label="Valid Until"
              rules={[{ required: true, message: 'Please select validity date' }]}
            >
              <DatePicker
                size="large"
                style={{ width: '100%' }}
                disabledDate={(current) => current && current < dayjs().endOf('day')}
                format="MMMM DD, YYYY"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="projectDuration"
              label="Project Duration"
              rules={[{ required: true, message: 'Please enter project duration' }]}
            >
              <Input size="large" placeholder="3-4 months" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderServicesStep = () => {
    const categories = [...new Set(services.map(s => s.category))];
    
    return (
      <div>
        <Alert
          message="Select Services"
          description="Choose the services you want to include in this proposal. You can select multiple services."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        {categories.map(category => (
          <Card key={category} style={{ marginBottom: 16 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              {category}
            </Title>
            <Row gutter={[16, 16]}>
              {services
                .filter(service => service.category === category)
                .map(service => (
                  <Col key={service.id} xs={24} sm={12} lg={8}>
                    <Card
                      hoverable
                      style={{
                        height: '100%',
                        borderColor: selectedServices.includes(service.id) 
                          ? token.colorPrimary 
                          : token.colorBorder,
                        borderWidth: selectedServices.includes(service.id) ? 2 : 1,
                        background: selectedServices.includes(service.id)
                          ? token.colorPrimaryBg
                          : 'transparent',
                      }}
                      onClick={() => {
                        if (selectedServices.includes(service.id)) {
                          setSelectedServices(selectedServices.filter(s => s !== service.id));
                        } else {
                          setSelectedServices([...selectedServices, service.id]);
                        }
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Avatar
                            icon={service.icon}
                            style={{
                              backgroundColor: selectedServices.includes(service.id)
                                ? token.colorPrimary
                                : token.colorTextQuaternary,
                            }}
                          />
                          <Text strong>{service.name}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {service.description}
                        </Text>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Text strong style={{ color: token.colorSuccess }}>
                            ${service.basePrice.toLocaleString()}
                          </Text>
                          <Checkbox
                            checked={selectedServices.includes(service.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                ))}
            </Row>
          </Card>
        ))}
        
        {selectedServices.length > 0 && (
          <Card style={{ marginTop: 24, background: token.colorPrimaryBg }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>Selected Services: {selectedServices.length}</Text>
              <Text strong style={{ fontSize: 18 }}>
                Base Total: ${services
                  .filter(s => selectedServices.includes(s.id))
                  .reduce((sum, s) => sum + s.basePrice, 0)
                  .toLocaleString()}
              </Text>
            </Space>
          </Card>
        )}
      </div>
    );
  };

  const renderPricingStep = () => {
    const pricing = calculateTotalPrice();
    
    return (
      <div>
        <Row gutter={24}>
          <Col span={12}>
            <Card>
              <Title level={4} style={{ marginBottom: 24 }}>
                Rate Configuration
              </Title>
              
              <Form.Item
                name="murphyRate"
                label={
                  <Space>
                    <span>Murphy Rate (Internal)</span>
                    <Tooltip title="The internal rate charged by Murphy">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: 'Please enter Murphy rate' }]}
                initialValue={150}
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  min={50}
                  max={500}
                  step={10}
                  addonAfter="/ hour"
                />
              </Form.Item>
              
              <Form.Item
                name="clientRate"
                label={
                  <Space>
                    <span>Client Rate</span>
                    <Tooltip title="The rate charged to the client">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: 'Please enter client rate' }]}
                initialValue={200}
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  min={50}
                  max={500}
                  step={10}
                  addonAfter="/ hour"
                />
              </Form.Item>
              
              <Form.Item
                name="paymentTerms"
                label="Payment Terms"
                rules={[{ required: true, message: 'Please select payment terms' }]}
                initialValue="net30"
              >
                <Select size="large">
                  <Option value="net15">Net 15</Option>
                  <Option value="net30">Net 30</Option>
                  <Option value="net45">Net 45</Option>
                  <Option value="net60">Net 60</Option>
                  <Option value="milestone">Milestone-based</Option>
                  <Option value="upfront">50% Upfront, 50% on Completion</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="discount"
                label="Discount (%)"
                initialValue={0}
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                  max={50}
                  step={5}
                  formatter={value => `${value}%`}
                  parser={value => value!.replace('%', '')}
                />
              </Form.Item>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card style={{ background: token.colorPrimaryBg }}>
              <Title level={4} style={{ marginBottom: 24 }}>
                Pricing Summary
              </Title>
              
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ 
                  padding: 16, 
                  background: token.colorBgContainer, 
                  borderRadius: 8 
                }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text type="secondary">Base Total</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 16 }}>
                        ${pricing.baseTotal.toLocaleString()}
                      </Text>
                    </Col>
                  </Row>
                </div>
                
                <div style={{ 
                  padding: 16, 
                  background: token.colorBgContainer, 
                  borderRadius: 8 
                }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text type="secondary">Murphy Cost</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text style={{ fontSize: 16 }}>
                        ${pricing.murphyTotal.toLocaleString()}
                      </Text>
                    </Col>
                  </Row>
                </div>
                
                <div style={{ 
                  padding: 16, 
                  background: token.colorSuccessBg, 
                  borderRadius: 8,
                  border: `1px solid ${token.colorSuccessBorder}`
                }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Client Total</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 20, color: token.colorSuccess }}>
                        ${pricing.clientTotal.toLocaleString()}
                      </Text>
                    </Col>
                  </Row>
                </div>
                
                <Divider />
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small">
                      <Text type="secondary">Margin</Text>
                      <Title level={3} style={{ margin: '8px 0 0 0', color: token.colorPrimary }}>
                        {pricing.margin}%
                      </Title>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Text type="secondary">Profit</Text>
                      <Title level={3} style={{ margin: '8px 0 0 0', color: token.colorSuccess }}>
                        ${pricing.profit.toLocaleString()}
                      </Title>
                    </Card>
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderReviewStep = () => {
    const formData = form.getFieldsValue();
    const pricing = calculateTotalPrice();
    const selectedServicesList = services.filter(s => selectedServices.includes(s.id));
    
    return (
      <div>
        <Alert
          message="Review Your Proposal"
          description="Please review all the details before generating the proposal document."
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={24}>
          <Col span={12}>
            <Card title="Client Information">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Name</Text>
                  <br />
                  <Text strong>{formData.clientName || 'Selected Client'}</Text>
                </div>
                <div>
                  <Text type="secondary">Company</Text>
                  <br />
                  <Text strong>{formData.clientCompany || 'Company Name'}</Text>
                </div>
                <div>
                  <Text type="secondary">Email</Text>
                  <br />
                  <Text strong>{formData.clientEmail || 'client@email.com'}</Text>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Proposal Details">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Title</Text>
                  <br />
                  <Text strong>{formData.title}</Text>
                </div>
                <div>
                  <Text type="secondary">Valid Until</Text>
                  <br />
                  <Text strong>
                    {formData.validUntil ? dayjs(formData.validUntil).format('MMMM DD, YYYY') : 'Not set'}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Duration</Text>
                  <br />
                  <Text strong>{formData.projectDuration}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
        
        <Card title="Selected Services" style={{ marginTop: 16 }}>
          <List
            dataSource={selectedServicesList}
            renderItem={service => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={service.icon} />}
                  title={service.name}
                  description={service.description}
                />
                <Text strong>${service.basePrice.toLocaleString()}</Text>
              </List.Item>
            )}
          />
        </Card>
        
        <Card title="Financial Summary" style={{ marginTop: 16, background: token.colorPrimaryBg }}>
          <Row gutter={16}>
            <Col span={6}>
              <Text type="secondary">Services Total</Text>
              <br />
              <Text strong style={{ fontSize: 18 }}>${pricing.baseTotal.toLocaleString()}</Text>
            </Col>
            <Col span={6}>
              <Text type="secondary">Murphy Cost</Text>
              <br />
              <Text strong style={{ fontSize: 18 }}>${pricing.murphyTotal.toLocaleString()}</Text>
            </Col>
            <Col span={6}>
              <Text type="secondary">Client Price</Text>
              <br />
              <Text strong style={{ fontSize: 18, color: token.colorSuccess }}>
                ${pricing.clientTotal.toLocaleString()}
              </Text>
            </Col>
            <Col span={6}>
              <Text type="secondary">Profit Margin</Text>
              <br />
              <Text strong style={{ fontSize: 18, color: token.colorPrimary }}>
                {pricing.margin}%
              </Text>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  const renderSuccess = () => (
    <Result
      status="success"
      title="Proposal Created Successfully!"
      subTitle={`Proposal ID: ${proposalId || 'PROP-2024-001'}`}
      extra={[
        <Button 
          type="primary" 
          key="view"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/proposals/${proposalId || '1'}`)}
        >
          View Proposal
        </Button>,
        <Button 
          key="list"
          onClick={() => router.push('/proposals')}
        >
          Back to Proposals
        </Button>,
      ]}
    >
      <div style={{ 
        background: token.colorPrimaryBg, 
        padding: 24, 
        borderRadius: 8,
        marginTop: 24 
      }}>
        <Title level={5}>What&apos;s Next?</Title>
        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
          <Text>
            <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
            Review the generated proposal document
          </Text>
          <Text>
            <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
            Make any necessary edits or adjustments
          </Text>
          <Text>
            <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
            Send the proposal to your client
          </Text>
        </Space>
      </div>
    </Result>
  );

  const renderStepContent = () => {
    if (currentStep === 4) {
      return renderSuccess();
    }
    
    switch (currentStep) {
      case 0:
        return renderClientStep();
      case 1:
        return renderServicesStep();
      case 2:
        return renderPricingStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Proposals', href: '/proposals' },
        { title: 'Create New' },
      ]}
    >
      <PageHeader
        title="Create New Proposal"
        subtitle="Follow the steps to create a professional proposal"
        onBack={() => router.push('/proposals')}
      />
      
      {currentStep < 4 && (
        <Card style={{ marginBottom: 24 }}>
          <Steps current={currentStep} items={steps} />
        </Card>
      )}
      
      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleCreateProposal}
      >
        {generating ? (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: 24 }}>
              Generating Proposal...
            </Title>
            <Text type="secondary">
              Please wait while we create your proposal document
            </Text>
          </Card>
        ) : (
          renderStepContent()
        )}
      </Form>
      
      {currentStep < 4 && !generating && (
        <Card style={{ marginTop: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              size="large"
              onClick={handlePrev}
              disabled={currentStep === 0}
              icon={<ArrowLeftOutlined />}
            >
              Previous
            </Button>
            
            <Button
              type="primary"
              size="large"
              onClick={handleNext}
              loading={loading}
              disabled={currentStep === 1 && selectedServices.length === 0}
              icon={currentStep === 3 ? <CheckCircleOutlined /> : <ArrowRightOutlined />}
              iconPosition="end"
            >
              {currentStep === 3 ? 'Generate Proposal' : 'Next'}
            </Button>
          </Space>
        </Card>
      )}
    </DashboardLayout>
  );
}