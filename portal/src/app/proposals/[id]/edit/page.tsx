'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  message,
  Spin,
  DatePicker,
  Switch,
  Divider,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface ProposalFormData {
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  value: number;
  status: string;
  validUntil: any;
  description: string;
  terms: string;
  deliverables: string[];
}

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposal, setProposal] = useState<any>(null);

  useEffect(() => {
    fetchProposal();
  }, [params.id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch proposal');
      }
      const data = await response.json();
      setProposal(data.proposal);
      
      // Set form values
      form.setFieldsValue({
        ...data.proposal,
        validUntil: data.proposal.validUntil ? dayjs(data.proposal.validUntil) : null,
      });
    } catch (error) {
      console.error('Error fetching proposal:', error);
      message.error('Failed to load proposal');
      router.push('/proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: ProposalFormData) => {
    try {
      setSaving(true);
      
      const formData = {
        ...values,
        validUntil: values.validUntil ? values.validUntil.toISOString() : null,
      };

      const response = await fetch(`/api/proposals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update proposal');
      }

      message.success('Proposal updated successfully');
      router.push(`/proposals/${params.id}`);
    } catch (error) {
      console.error('Error updating proposal:', error);
      message.error('Failed to update proposal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/proposals/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete proposal');
      }

      message.success('Proposal deleted successfully');
      router.push('/proposals');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      message.error('Failed to delete proposal');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Proposals', path: '/proposals' },
        { title: proposal?.title || 'Edit Proposal' },
      ]}
    >
      <PageHeader
        title="Edit Proposal"
        subtitle="Update proposal details and information"
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/proposals')}
            >
              Back to Proposals
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'draft',
        }}
      >
        <Row gutter={[24, 0]}>
          <Col xs={24} lg={16}>
            <Card title="Proposal Details" style={{ marginBottom: 24 }}>
              <Form.Item
                label="Proposal Title"
                name="title"
                rules={[{ required: true, message: 'Please enter proposal title' }]}
              >
                <Input placeholder="Enter proposal title" size="large" />
              </Form.Item>

              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: 'Please enter description' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe the proposal scope and objectives"
                />
              </Form.Item>

              <Form.Item
                label="Deliverables"
                name="deliverables"
              >
                <Select
                  mode="tags"
                  placeholder="Add deliverables (press Enter to add)"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Terms & Conditions"
                name="terms"
              >
                <TextArea
                  rows={6}
                  placeholder="Enter terms and conditions"
                />
              </Form.Item>
            </Card>

            <Card title="Client Information" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Client Name"
                    name="clientName"
                    rules={[{ required: true, message: 'Please enter client name' }]}
                  >
                    <Input placeholder="Enter client name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Company"
                    name="clientCompany"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                  >
                    <Input placeholder="Enter company name" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Client Email"
                name="clientEmail"
                rules={[
                  { required: true, message: 'Please enter client email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="client@example.com" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Pricing & Status" style={{ marginBottom: 24 }}>
              <Form.Item
                label="Proposal Value"
                name="value"
                rules={[{ required: true, message: 'Please enter proposal value' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  placeholder="0.00"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status" size="large">
                  <Option value="draft">Draft</Option>
                  <Option value="sent">Sent</Option>
                  <Option value="viewed">Viewed</Option>
                  <Option value="accepted">Accepted</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="expired">Expired</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Valid Until"
                name="validUntil"
                rules={[{ required: true, message: 'Please select validity date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Card>

            <Card>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                  size="large"
                  block
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </DashboardLayout>
  );
}