'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Descriptions, Badge, Button, Space, message, Spin, Alert, Modal, Input } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, MailOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: 'Draft' },
      processing: { color: 'processing', text: 'Processing' },
      finalized: { color: 'success', text: 'Finalized' },
      sent: { color: 'blue', text: 'Sent' },
      failed: { color: 'error', text: 'Failed' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Badge status={config.color as any} text={config.text} />;
  };

  if (status === 'loading' || loading || !proposal) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const isProcessing = proposal.manusTask?.status === 'processing' || proposal.status === 'processing';
  const isCompleted = proposal.manusTask?.status === 'completed' || proposal.status === 'finalized';
  const isFailed = proposal.manusTask?.status === 'failed' || proposal.status === 'failed';

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/proposals/esystems')}
        >
          Back to List
        </Button>

        <Card
          title={`E-Systems Proposal: ${proposal.client.organization}`}
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchProposal}
                loading={loading}
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
                  >
                    View Slides
                  </Button>
                  <Button
                    icon={<MailOutlined />}
                    onClick={() => setEmailModalVisible(true)}
                    disabled={!proposal.client.email}
                  >
                    Send to Client
                  </Button>
                </>
              )}
            </Space>
          }
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Status" span={2}>
              {getStatusBadge(proposal.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Manus Task Status" span={2}>
              <Badge
                status={
                  proposal.manusTask?.status === 'completed' ? 'success' :
                  proposal.manusTask?.status === 'processing' ? 'processing' :
                  proposal.manusTask?.status === 'failed' ? 'error' : 'default'
                }
                text={proposal.manusTask?.status || 'Unknown'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Client">{proposal.client.organization}</Descriptions.Item>
            <Descriptions.Item label="Email">{proposal.client.email}</Descriptions.Item>
            {proposal.client.phone && (
              <Descriptions.Item label="Phone">{proposal.client.phone}</Descriptions.Item>
            )}
            {proposal.client.website && (
              <Descriptions.Item label="Website">
                <a href={proposal.client.website} target="_blank" rel="noopener noreferrer">
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

          {isProcessing && (
            <Alert
              message="Processing in Progress"
              description="Manus AI is currently researching products and generating your proposal. This may take a few minutes."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}

          {isFailed && (
            <Alert
              message="Processing Failed"
              description={proposal.manusTask?.outputData?.error || 'An error occurred while generating the proposal.'}
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}

          {isCompleted && !proposal.googleSlidesUrl && (
            <Alert
              message="Proposal Completed"
              description="The proposal has been generated but the Google Slides link is not available yet."
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>

        {proposal.ghlSubmission && (
          <Card title="Form Submission Data">
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
              {JSON.stringify(proposal.ghlSubmission.submissionData, null, 2)}
            </pre>
          </Card>
        )}

        {proposal.researchJson && Object.keys(proposal.researchJson).length > 0 && (
          <Card title="Research Data">
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
              {JSON.stringify(proposal.researchJson, null, 2)}
            </pre>
          </Card>
        )}
      </Space>

      <Modal
        title="Send Proposal to Client"
        open={emailModalVisible}
        onOk={handleSendEmail}
        onCancel={() => setEmailModalVisible(false)}
        confirmLoading={sending}
        okText="Send Email"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            <strong>To:</strong> {proposal?.client.email}
          </p>
          <p>
            <strong>Subject:</strong> Your E-Systems Management Proposal
          </p>
          <TextArea
            rows={6}
            placeholder="Optional message to include with the proposal..."
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  );
}

