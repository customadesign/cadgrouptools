'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  FloatButton,
  Drawer,
  Input,
  Button,
  Space,
  Typography,
  Avatar,
  Spin,
  message,
  Tag,
} from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  DeleteOutlined,
  DownloadOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AccountingChatWidgetProps {
  context?: {
    company?: string;
    companyName?: string;
    currentPage?: string;
  };
}

export default function AccountingChatWidget({ context }: AccountingChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Load chat history from localStorage
    const savedMessages = localStorage.getItem('accounting-chat-history');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }

    // Fetch quick questions based on context
    fetchQuickQuestions();
  }, []);

  useEffect(() => {
    // Save messages to localStorage whenever they change
    if (messages.length > 0) {
      localStorage.setItem('accounting-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Update context when page changes
    if (open) {
      fetchQuickQuestions();
    }
  }, [pathname, context]);

  const fetchQuickQuestions = async () => {
    try {
      const response = await fetch('/api/accounting/chat/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            ...context,
            currentPage: pathname,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuickQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching quick questions:', error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/accounting/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context: {
            ...context,
            currentPage: pathname,
          },
          conversationHistory: messages.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      message.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem('accounting-chat-history');
    message.success('Conversation cleared');
  };

  const exportConversation = () => {
    const transcript = messages
      .map(msg => `[${msg.role.toUpperCase()}] ${msg.content}`)
      .join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounting-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Conversation exported');
  };

  return (
    <>
      <FloatButton
        icon={<MessageOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={() => setOpen(true)}
        badge={{ count: messages.filter(m => m.role === 'assistant').length }}
        tooltip="Accounting Assistant"
      />

      <Drawer
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>Accounting Assistant</span>
          </Space>
        }
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={450}
        extra={
          <Space>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={exportConversation}
              disabled={messages.length === 0}
            >
              Export
            </Button>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              onClick={clearConversation}
              disabled={messages.length === 0}
              danger
            >
              Clear
            </Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Context Display */}
          {context?.companyName && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Current Context:
              </Text>
              <div>
                <Tag color="blue">{context.companyName}</Tag>
              </div>
            </div>
          )}

          {/* Quick Questions */}
          {messages.length === 0 && quickQuestions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Quick Questions:
              </Text>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    type="dashed"
                    size="small"
                    block
                    onClick={() => handleQuickQuestion(question)}
                    style={{ textAlign: 'left', height: 'auto', whiteSpace: 'normal', padding: '8px 12px' }}
                  >
                    {question}
                  </Button>
                ))}
              </Space>
            </div>
          )}

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: 16,
              padding: '0 4px',
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8c8c8c' }}>
                <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>Ask me anything about your accounting data!</div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: 8,
                  }}
                >
                  <Avatar
                    size="small"
                    icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: msg.role === 'user' ? '#1890ff' : '#52c41a',
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      background: msg.role === 'user' ? '#e6f7ff' : '#f5f5f5',
                      padding: '8px 12px',
                      borderRadius: 8,
                      wordBreak: 'break-word',
                    }}
                  >
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      {msg.content}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#8c8c8c',
                        marginTop: 4,
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Spin />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your accounting data..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputValue);
                  }
                }}
                disabled={loading}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => sendMessage(inputValue)}
                loading={loading}
                disabled={!inputValue.trim()}
              >
                Send
              </Button>
            </Space.Compact>
            <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
              Press Enter to send, Shift+Enter for new line
            </Text>
          </div>
        </div>
      </Drawer>
    </>
  );
}

