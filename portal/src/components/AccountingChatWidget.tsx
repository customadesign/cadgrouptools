'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  FloatButton,
  Drawer,
  Input,
  Button,
  Space,
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
  SparklesOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { TextArea } = Input;

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
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
        style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000 }}
      >
        <FloatButton
          icon={<MessageOutlined />}
          type="primary"
          onClick={() => setOpen(true)}
          badge={{ count: messages.filter(m => m.role === 'assistant').length }}
          tooltip="AI Accounting Assistant"
          style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          }}
        />
      </motion.div>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
            >
              <SparklesOutlined style={{ fontSize: 20 }} />
            </div>
            <div>
              <div className="font-semibold">AI Accounting Assistant</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                Powered by Claude 3.5
              </div>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={450}
        styles={{
          body: { padding: 0 },
          header: {
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-primary)',
          },
        }}
        extra={
          <Space>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={exportConversation}
              disabled={messages.length === 0}
              style={{ borderRadius: '20px' }}
            >
              Export
            </Button>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              onClick={clearConversation}
              disabled={messages.length === 0}
              danger
              style={{ borderRadius: '20px' }}
            >
              Clear
            </Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Context Display */}
          {context?.companyName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-3 m-4 rounded-xl"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                Current Context:
              </div>
              <Tag
                color="blue"
                style={{
                  borderRadius: '12px',
                  padding: '4px 12px',
                  fontWeight: 500,
                }}
              >
                {context.companyName}
              </Tag>
            </motion.div>
          )}

          {/* Quick Questions */}
          {messages.length === 0 && quickQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="px-4 mb-4"
            >
              <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                Quick Questions:
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {quickQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="dashed"
                      size="small"
                      block
                      onClick={() => handleQuickQuestion(question)}
                      style={{
                        textAlign: 'left',
                        height: 'auto',
                        whiteSpace: 'normal',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      <SparklesOutlined style={{ marginRight: 8, color: 'var(--color-primary)' }} />
                      {question}
                    </Button>
                  </motion.div>
                ))}
              </Space>
            </motion.div>
          )}

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: 'var(--bg-primary)',
            }}
          >
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
                >
                  <SparklesOutlined style={{ fontSize: 40, color: 'white' }} />
                </div>
                <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  AI Accounting Assistant
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Ask me anything about your financial data!
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 flex"
                  style={{
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    className="max-w-[80%] flex gap-2"
                    style={{
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      size="small"
                      icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      style={{
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                          : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        flexShrink: 0,
                      }}
                    />
                    <div
                      className="px-4 py-2 rounded-2xl"
                      style={{
                        background: msg.role === 'user' ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                        {msg.content}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-4"
              >
                <div className="flex items-center gap-2">
                  <Spin size="small" />
                  <span style={{ color: 'var(--text-secondary)' }}>AI is thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="p-4"
            style={{
              borderTop: '1px solid var(--border-primary)',
              background: 'var(--bg-elevated)',
            }}
          >
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
                style={{
                  borderRadius: '20px 0 0 20px',
                  background: 'var(--bg-primary)',
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => sendMessage(inputValue)}
                loading={loading}
                disabled={!inputValue.trim()}
                style={{
                  borderRadius: '0 20px 20px 0',
                  height: 'auto',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  border: 'none',
                }}
              />
            </Space.Compact>
            <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}

