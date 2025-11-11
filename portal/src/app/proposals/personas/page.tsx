'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Row,
  Col,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface Persona {
  _id: string;
  name: string;
  company: string;
  promptText: string;
  ghlFormId: string;
  ghlFormName: string;
  isActive: boolean;
  createdAt: string;
}

export default function PersonasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [murphyPersonas, setMurphyPersonas] = useState<Persona[]>([]);
  const [esystemsPersonas, setESystemsPersonas] = useState<Persona[]>([]);
  const [activeTab, setActiveTab] = useState('murphy');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPersonas();
    }
  }, [status]);

  const fetchPersonas = async () => {
    setLoading(true);
    try {
      const [murphyRes, esystemsRes] = await Promise.all([
        fetch('/api/personas?company=murphy'),
        fetch('/api/personas?company=esystems'),
      ]);

      if (murphyRes.ok) {
        const data = await murphyRes.json();
        setMurphyPersonas(data.personas || []);
      }

      if (esystemsRes.ok) {
        const data = await esystemsRes.json();
        setESystemsPersonas(data.personas || []);
      }
    } catch (error) {
      message.error('Failed to load personas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEdit = async (values: any) => {
    setSubmitting(true);
    try {
      const url = editingPersona
        ? `/api/personas/${editingPersona._id}`
        : '/api/personas';
      
      const method = editingPersona ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save persona');
      }

      message.success(editingPersona ? 'Persona updated successfully' : 'Persona created successfully');
      setModalVisible(false);
      setEditingPersona(null);
      form.resetFields();
      fetchPersonas();
    } catch (error: any) {
      message.error(error.message || 'Failed to save persona');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (persona: Persona) => {
    try {
      const response = await fetch(`/api/personas/${persona._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate persona');
      }

      message.success('Persona activated successfully');
      fetchPersonas();
    } catch (error: any) {
      message.error(error.message || 'Failed to activate persona');
    }
  };

  const handleDelete = async (personaId: string) => {
    try {
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete persona');
      }

      message.success('Persona deleted successfully');
      fetchPersonas();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete persona');
    }
  };

  const openCreateModal = () => {
    setEditingPersona(null);
    form.resetFields();
    form.setFieldsValue({ company: activeTab });
    setModalVisible(true);
  };

  const openEditModal = (persona: Persona) => {
    setEditingPersona(persona);
    form.setFieldsValue({
      name: persona.name,
      company: persona.company,
      promptText: persona.promptText,
      ghlFormId: persona.ghlFormId,
      ghlFormName: persona.ghlFormName,
      isActive: persona.isActive,
    });
    setModalVisible(true);
  };

  const renderPersonaCard = (persona: Persona, index: number) => (
    <Col xs={24} key={persona._id}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card
          className={`gradient-card ${persona.isActive ? 'ring-2 ring-green-500' : ''}`}
          styles={{ body: { padding: '24px' } }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
                  {persona.name}
                </h3>
                {persona.isActive && (
                  <Tag
                    color="success"
                    icon={<CheckCircleOutlined />}
                    style={{ borderRadius: '12px' }}
                  >
                    ACTIVE
                  </Tag>
                )}
              </div>
              {persona.ghlFormName && (
                <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <FormOutlined /> Form: {persona.ghlFormName}
                </div>
              )}
              <div
                className="text-sm p-3 rounded-lg mb-4"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  maxHeight: '100px',
                  overflow: 'auto',
                }}
              >
                {persona.promptText.substring(0, 200)}
                {persona.promptText.length > 200 && '...'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Created {new Date(persona.createdAt).toLocaleDateString()}
              </div>
            </div>
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => openEditModal(persona)}
                style={{ borderRadius: '20px' }}
              >
                Edit
              </Button>
              {!persona.isActive && (
                <Button
                  type="primary"
                  onClick={() => handleActivate(persona)}
                  style={{ borderRadius: '20px' }}
                >
                  Activate
                </Button>
              )}
              <Popconfirm
                title="Delete this persona?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(persona._id)}
                disabled={persona.isActive}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={persona.isActive}
                  style={{ borderRadius: '20px' }}
                >
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </Card>
      </motion.div>
    </Col>
  );

  if (status === 'loading') {
    return (
      <ModernDashboardLayout>
        <LoadingSkeleton type="list" count={3} />
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              AI Personas
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              Customize AI behavior for each GoHighLevel form
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            size="large"
            style={{ borderRadius: '24px' }}
          >
            Create Persona
          </Button>
        </div>
      </motion.div>

      {/* Info Card */}
      <Card
        className="gradient-card mb-6"
        style={{
          background: 'linear-gradient(135deg, #3B82F620 0%, #8B5CF620 100%)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
          >
            <RobotOutlined style={{ fontSize: 24, color: 'white' }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              🤖 How Personas Work
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Personas are custom instructions prepended to every Manus AI task for a specific GoHighLevel form.
              This allows you to control the tone, style, and approach for different forms without changing code.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs for Murphy vs E-Systems */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane tab="Murphy Consulting" key="murphy">
          <Row gutter={[0, 16]}>
            {loading ? (
              <LoadingSkeleton type="list" count={3} />
            ) : murphyPersonas.length === 0 ? (
              <Col xs={24}>
                <EmptyState
                  title="No personas created yet"
                  description="Create your first persona to customize Murphy Consulting proposals"
                  action={{
                    text: 'Create Persona',
                    onClick: openCreateModal,
                    icon: <PlusOutlined />,
                  }}
                />
              </Col>
            ) : (
              murphyPersonas.map((persona, index) => renderPersonaCard(persona, index))
            )}
          </Row>
        </TabPane>

        <TabPane tab="E-Systems Management" key="esystems">
          <Row gutter={[0, 16]}>
            {loading ? (
              <LoadingSkeleton type="list" count={3} />
            ) : esystemsPersonas.length === 0 ? (
              <Col xs={24}>
                <EmptyState
                  title="No personas created yet"
                  description="Create your first persona to customize E-Systems Management proposals"
                  action={{
                    text: 'Create Persona',
                    onClick: openCreateModal,
                    icon: <PlusOutlined />,
                  }}
                />
              </Col>
            ) : (
              esystemsPersonas.map((persona, index) => renderPersonaCard(persona, index))
            )}
          </Row>
        </TabPane>
      </Tabs>

      {/* Create/Edit Modal */}
      <Modal
        title={editingPersona ? 'Edit Persona' : 'Create New Persona'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPersona(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateEdit}
        >
          <Form.Item
            name="name"
            label="Persona Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., Professional Web Services Expert" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="company"
                label="Company"
                rules={[{ required: true, message: 'Please select company' }]}
              >
                <Select placeholder="Select company" size="large">
                  <Option value="murphy">Murphy Consulting</Option>
                  <Option value="esystems">E-Systems Management</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ghlFormId"
                label="GoHighLevel Form ID"
                rules={[{ required: true, message: 'Please enter form ID' }]}
              >
                <Input placeholder="e.g., Dencs4XQEHrrOmkLPuCz" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="ghlFormName"
            label="Form Name (Optional)"
          >
            <Input placeholder="e.g., Get Estimate - Web Design" size="large" />
          </Form.Item>

          <Form.Item
            name="promptText"
            label="Persona Instructions"
            rules={[
              { required: true, message: 'Please enter persona instructions' },
              { min: 50, message: 'Instructions must be at least 50 characters' },
            ]}
            extra="These instructions will be prepended to every Manus AI task for this form"
          >
            <TextArea
              rows={12}
              placeholder={`Example:

You are an expert web services consultant specializing in small to medium businesses.

Your approach:
- Focus on practical, cost-effective solutions
- Emphasize ROI and business value
- Professional but approachable tone
- Detailed technical recommendations
- Clear timelines and pricing at $35/hour

When analyzing websites:
1. Identify immediate issues (performance, security, UX)
2. Highlight SEO opportunities
3. Suggest modern technology upgrades
4. Provide competitor comparisons
5. Create actionable roadmap`}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            valuePropName="checked"
            extra="Only one persona can be active per form. Activating this will deactivate others for the same form."
          >
            <Space>
              <input type="checkbox" id="isActive" />
              <label htmlFor="isActive" style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>
                Set as active persona for this form
              </label>
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                style={{ borderRadius: '24px' }}
              >
                {editingPersona ? 'Update Persona' : 'Create Persona'}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingPersona(null);
                  form.resetFields();
                }}
                size="large"
                style={{ borderRadius: '24px' }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </ModernDashboardLayout>
  );
}

