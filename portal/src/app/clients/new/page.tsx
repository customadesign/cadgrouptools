'use client';

import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Row,
  Col,
  Space,
  message,
  Divider,
  DatePicker,
  InputNumber,
  Switch,
  Upload,
  Avatar,
} from 'antd';
import {
  SaveOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  BankOutlined,
  GlobalOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { clientApi } from '@/services/api';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;

// Helper function to upload avatar
const uploadAvatar = async (clientId: string, file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`/api/clients/${clientId}/avatar`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }
    
    const data = await response.json();
    return data.avatarUrl;
  } catch (error) {
    console.error('Avatar upload error:', error);
    message.error('Failed to upload avatar');
    return null;
  }
};

export default function NewClientPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Format the data to match backend schema
      const clientData = {
        organization: values.company || `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        phone: values.phone,
        website: values.website,
        industry: values.industry,
        address: {
          line1: values.address,
          line2: '',
          city: values.city,
          state: values.state,
          country: values.country,
          postalCode: values.zipCode,
        },
        firstName: values.firstName,
        lastName: values.lastName,
        jobTitle: values.jobTitle,
        status: values.status || 'prospect',
        companySize: values.companySize,
        notes: values.notes,
        leadSource: values.leadSource,
        estimatedValue: values.estimatedValue,
        linkedin: values.linkedin,
        twitter: values.twitter,
      };

      // Create the client first
      const response = await clientApi.create(clientData);
      const newClientId = response.data.client._id;
      
      // Upload avatar if a file was selected
      if (avatarFile && newClientId) {
        const uploadedAvatarUrl = await uploadAvatar(newClientId, avatarFile);
        if (uploadedAvatarUrl) {
          message.success('Avatar uploaded successfully!');
        }
      }
      
      message.success('Client created successfully!');
      router.push(`/clients/${newClientId}`);
    } catch (error) {
      console.error('Failed to create client:', error);
      message.error('Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }

    // Store the file for upload after client creation
    setAvatarFile(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    return false; // Prevent automatic upload
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Clients', href: '/clients' },
        { title: 'New Client' },
      ]}
    >
      <PageHeader
        title="Add New Client"
        subtitle="Create a new client profile"
        showBack
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        requiredMark="optional"
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {/* Basic Information */}
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Basic Information</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter first name' }]}
                  >
                    <Input size="large" placeholder="John" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter last name' }]}
                  >
                    <Input size="large" placeholder="Smith" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter a valid email' },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<MailOutlined />}
                      placeholder="john@example.com"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input
                      size="large"
                      prefix={<PhoneOutlined />}
                      placeholder="+1 (555) 123-4567"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Job Title"
                    name="jobTitle"
                  >
                    <Input size="large" placeholder="CEO / Manager / Developer" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Status"
                    name="status"
                    initialValue="prospect"
                  >
                    <Select size="large">
                      <Select.Option value="active">Active</Select.Option>
                      <Select.Option value="inactive">Inactive</Select.Option>
                      <Select.Option value="prospect">Prospect</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Company Information */}
            <Card
              title={
                <Space>
                  <BankOutlined />
                  <span>Company Information</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Company Name"
                    name="company"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                  >
                    <Input size="large" placeholder="Tech Solutions Inc." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Industry"
                    name="industry"
                  >
                    <Select size="large" placeholder="Select industry">
                      <Select.Option value="technology">Technology</Select.Option>
                      <Select.Option value="finance">Finance</Select.Option>
                      <Select.Option value="healthcare">Healthcare</Select.Option>
                      <Select.Option value="retail">Retail</Select.Option>
                      <Select.Option value="manufacturing">Manufacturing</Select.Option>
                      <Select.Option value="other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Company Size"
                    name="companySize"
                  >
                    <Select size="large" placeholder="Select company size">
                      <Select.Option value="1-10">1-10 employees</Select.Option>
                      <Select.Option value="11-50">11-50 employees</Select.Option>
                      <Select.Option value="51-200">51-200 employees</Select.Option>
                      <Select.Option value="201-500">201-500 employees</Select.Option>
                      <Select.Option value="500+">500+ employees</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Website"
                    name="website"
                  >
                    <Input
                      size="large"
                      prefix={<GlobalOutlined />}
                      placeholder="https://example.com"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Address Information */}
            <Card
              title={
                <Space>
                  <HomeOutlined />
                  <span>Address Information</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    label="Street Address"
                    name="address"
                  >
                    <Input size="large" placeholder="123 Business Avenue" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="City"
                    name="city"
                  >
                    <Input size="large" placeholder="New York" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="State/Province"
                    name="state"
                  >
                    <Input size="large" placeholder="NY" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="ZIP/Postal Code"
                    name="zipCode"
                  >
                    <Input size="large" placeholder="10001" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Country"
                    name="country"
                    initialValue="United States"
                  >
                    <Select size="large">
                      <Select.Option value="United States">United States</Select.Option>
                      <Select.Option value="Canada">Canada</Select.Option>
                      <Select.Option value="United Kingdom">United Kingdom</Select.Option>
                      <Select.Option value="Australia">Australia</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Additional Information */}
            <Card
              title="Additional Information"
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    label="Notes"
                    name="notes"
                  >
                    <TextArea
                      rows={4}
                      placeholder="Add any additional notes about this client..."
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Lead Source"
                    name="leadSource"
                  >
                    <Select size="large" placeholder="How did they find you?">
                      <Select.Option value="website">Website</Select.Option>
                      <Select.Option value="referral">Referral</Select.Option>
                      <Select.Option value="social_media">Social Media</Select.Option>
                      <Select.Option value="advertisement">Advertisement</Select.Option>
                      <Select.Option value="cold_call">Cold Call</Select.Option>
                      <Select.Option value="other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Estimated Value"
                    name="estimatedValue"
                  >
                    <InputNumber
                      size="large"
                      style={{ width: '100%' }}
                      prefix="$"
                      placeholder="0.00"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            {/* Profile Picture */}
            <Card style={{ marginBottom: 24, textAlign: 'center' }}>
              <Form.Item label="Profile Picture" name="avatar">
                <Upload
                  name="avatar"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  accept="image/*"
                >
                  {avatarUrl ? (
                    <Avatar size={100} src={avatarUrl} />
                  ) : (
                    <div>
                      <UploadOutlined style={{ fontSize: 24 }} />
                      <div style={{ marginTop: 8 }}>Upload Photo</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Card>

            {/* Social Media */}
            <Card
              title="Social Media"
              style={{ marginBottom: 24 }}
            >
              <Form.Item
                label="LinkedIn"
                name="linkedin"
              >
                <Input
                  prefix={<LinkedinOutlined />}
                  placeholder="linkedin.com/in/username"
                />
              </Form.Item>
              <Form.Item
                label="Twitter"
                name="twitter"
              >
                <Input
                  prefix={<TwitterOutlined />}
                  placeholder="@username"
                />
              </Form.Item>
            </Card>

            {/* Settings */}
            <Card title="Settings">
              <Form.Item
                label="Send Welcome Email"
                name="sendWelcomeEmail"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Email Notifications"
                name="emailNotifications"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* Form Actions */}
        <Card>
          <Space size="middle">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
            >
              Create Client
            </Button>
            <Button
              size="large"
              onClick={() => router.push('/clients')}
            >
              Cancel
            </Button>
            <Button
              type="link"
              onClick={() => form.resetFields()}
            >
              Reset Form
            </Button>
          </Space>
        </Card>
      </Form>
    </DashboardLayout>
  );
}