'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Descriptions, Button, Space, message, Alert, Modal, Input, Steps } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, MailOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import ModernDashboardLayout from '@/components/layouts/ModernDashboardLayout';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const { TextArea } = Input;

interface ProposalDetail {
  _id: string;
  client: {
    organization: string;
    email: string;
    phone?: string;
    website?: string;
  };
  status: string;
  selectedServices: string[];
  htmlDraft?: string;
  googleSlidesUrl?: string;
  researchJson: any;
  createdAt: string;
  completedAt?: string;
  manusTask: {
    manusTaskId: string;
    status: string;
    outputData?: any;
  };
  ghlSubmission?: {
    submissionData: any;
    submittedAt: string;
  };
}

export default function ESystemsProposalDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && proposalId) {
      fetchProposal();
    }
  }, [status, proposalId]);

  const fetchProposal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposal');
      }

      const data = await response.json();
      setProposal(data.proposal);
    } catch (error: any) {
      message.error(error.message || 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!proposal?.client.email) {
      message.error('Client email not available');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: proposal.client.email,
          message: emailMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      message.success('Proposal sent successfully');
      setEmailModalVisible(false);
      setEmailMessage('');
      fetchProposal();
    } catch (error: any) {
      message.error(error.message || 'Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

  const getStepStatus = (manusStatus?: string, proposalStatus?: string) => {
    const status = manusStatus || proposalStatus || 'draft';
    
    if (status === 'completed' || status === 'finalized') return 2;
    if (status === 'processing') return 1;
    if (status === 'failed') return 1;
    return 0;
  };

  if (status === 'loading' || loading || !proposal) {
    return (
      <ModernDashboardLayout>
        <LoadingSkeleton type="detail" />
      </ModernDashboardLayout>
    );
  }

  const currentStep = getStepStatus(proposal.manusTask?.status, proposal.status);
  const isProcessing = proposal.manusTask?.status === 'processing' || proposal.status === 'processing';
  const isCompleted = proposal.manusTask?.status === 'completed' || proposal.status === 'finalized';
  const isFailed = proposal.manusTask?.status === 'failed' || proposal.status === 'failed';

  return (
    <ModernDashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/proposals/esystems')}
          size="large"
          style={{ marginBottom: 24, borderRadius: '24px' }}
        >
          Back to List
        </Button>

        {/* Header Card */}
        <Card className="gradient-card mb-6" styles={{ body: { padding: '32px' } }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {proposal.client.organization}
              </h1>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                E-Systems Management Proposal
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchProposal}
                size="large"
                style={{ borderRadius: '24px' }}
              >
                Refresh
              </Button>
              {isCompleted && proposal.googleSlidesUrl && (
                <>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    href={proposal.googleSlidesUrl}
                    target="_blank"
                    size="large"
                    style={{ borderRadius: '24px' }}
                  >
                    View Slides
                  </Button>
                  <Button
                    icon={<MailOutlined />}
                    onClick={() => setEmailModalVisible(true)}
                    disabled={!proposal.client.email}
                    size="large"
                    style={{ borderRadius: '24px' }}
                  >
                    Send to Client
                  </Button>
                </>
              )}
            </Space>
          </div>

          {/* Status Timeline */}
          <Steps
            current={currentStep}
            status={isFailed ? 'error' : isProcessing ? 'process' : 'finish'}
            items={[
              {
                title: 'Received',
                description: 'Form submitted',
              },
              {
                title: 'Processing',
                description: 'Product research',
              },
              {
                title: 'Completed',
                description: 'Proposal ready',
              },
            ]}
          />
        </Card>

        {/* Status Alerts */}
        {isProcessing && (
          <Alert
            message="Processing in Progress"
            description="Manus AI is conducting product research and generating your proposal. This may take 3-5 minutes."
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: '12px' }}
          />
        )}

        {isFailed && (
          <Alert
            message="Processing Failed"
            description={proposal.manusTask?.outputData?.error || 'An error occurred while generating the proposal.'}
            type="error"
            showIcon
            style={{ marginBottom: 24, borderRadius: '12px' }}
          />
        )}

        {/* Client Information */}
        <Card title="Client Information" className="gradient-card mb-6">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label="Organization">{proposal.client.organization}</Descriptions.Item>
            <Descriptions.Item label="Email">{proposal.client.email}</Descriptions.Item>
            {proposal.client.phone && (
              <Descriptions.Item label="Phone">{proposal.client.phone}</Descriptions.Item>
            )}
            {proposal.client.website && (
              <Descriptions.Item label="Website">
                <a href={proposal.client.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                  {proposal.client.website}
                </a>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Services" span={2}>
              {proposal.selectedServices?.join(', ') || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(proposal.createdAt).toLocaleString()}
            </Descriptions.Item>
            {proposal.completedAt && (
              <Descriptions.Item label="Completed">
                {new Date(proposal.completedAt).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Google Slides Embed */}
        {isCompleted && proposal.googleSlidesUrl && (
          <Card title="Proposal Preview" className="gradient-card mb-6">
            <div style={{ width: '100%', height: '600px', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                src={proposal.googleSlidesUrl.replace('/edit', '/preview')}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="Proposal Slides"
              />
            </div>
          </Card>
        )}

        {/* Research Data */}
        {proposal.researchJson && Object.keys(proposal.researchJson).length > 0 && (
          <Card title="Research Data" className="gradient-card">
            <pre
              className="p-4 rounded-lg overflow-auto"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                maxHeight: '400px',
              }}
            >
              {JSON.stringify(proposal.researchJson, null, 2)}
            </pre>
          </Card>
        )}
      </motion.div>

      {/* Send Email Modal */}
      <Modal
        title="Send Proposal to Client"
        open={emailModalVisible}
        onOk={handleSendEmail}
        onCancel={() => setEmailModalVisible(false)}
        confirmLoading={sending}
        okText="Send Email"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <strong>To:</strong> {proposal?.client.email}
          </div>
          <div>
            <strong>Subject:</strong> Your E-Systems Management Proposal
          </div>
          <TextArea
            rows={6}
            placeholder="Optional message to include with the proposal..."
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
          />
        </Space>
      </Modal>
    </ModernDashboardLayout>
  );
}
