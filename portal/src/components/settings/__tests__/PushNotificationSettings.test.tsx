import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PushNotificationSettings from '../PushNotificationSettings';
import clientPushNotificationService from '@/services/clientPushNotificationService';

// Mock the push notification service
jest.mock('@/services/clientPushNotificationService', () => ({
  default: {
    isSupported: jest.fn(() => true),
    getPermissionStatus: jest.fn(() => 'default'),
    isSubscribed: jest.fn(() => false),
    getUserSubscriptions: jest.fn(() => []),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    showLocalNotification: jest.fn(),
    sendCustomNotification: jest.fn(() => ({ success: true, successCount: 1, failureCount: 0 })),
  },
}));

// Mock Ant Design message
jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    message: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
    },
  };
});

describe('PushNotificationSettings', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when notifications are supported', async () => {
    render(<PushNotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByText('Enable Push Notifications')).toBeInTheDocument();
    });
  });

  it('shows unsupported message when notifications are not supported', async () => {
    (clientPushNotificationService.isSupported as jest.Mock).mockReturnValueOnce(false);

    render(<PushNotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText('Push Notifications Not Supported')).toBeInTheDocument();
    });
  });

  it('enables notifications when toggle is clicked', async () => {
    (clientPushNotificationService.subscribe as jest.Mock).mockResolvedValueOnce({});

    render(<PushNotificationSettings />);

    await waitFor(() => {
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    await waitFor(() => {
      expect(clientPushNotificationService.subscribe).toHaveBeenCalled();
    });
  });

  it('disables notifications when toggle is clicked off', async () => {
    (clientPushNotificationService.isSubscribed as jest.Mock).mockResolvedValueOnce(true);
    (clientPushNotificationService.getUserSubscriptions as jest.Mock).mockResolvedValueOnce([
      {
        endpoint: 'https://example.com/push/123',
        userAgent: 'Mozilla/5.0 Chrome',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<PushNotificationSettings />);

    await waitFor(() => {
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    await waitFor(() => {
      expect(clientPushNotificationService.unsubscribe).toHaveBeenCalled();
    });
  });

  it('sends test notification when button is clicked', async () => {
    (clientPushNotificationService.isSubscribed as jest.Mock).mockResolvedValueOnce(true);

    render(<PushNotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText('Send Test Notification')).toBeInTheDocument();
    });

    const testButton = screen.getByText('Send Test Notification');
    await user.click(testButton);

    await waitFor(() => {
      expect(clientPushNotificationService.showLocalNotification).toHaveBeenCalledWith(
        'Test Notification',
        'This is a test notification from CADGroup Tools Portal',
        expect.any(Object)
      );
    });
  });

  it('shows device list when subscribed', async () => {
    const mockSubscriptions = [
      {
        endpoint: 'https://example.com/push/123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        createdAt: '2023-01-01T00:00:00Z',
        lastUsed: '2023-01-02T00:00:00Z',
      },
      {
        endpoint: 'https://example.com/push/456',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) Mobile/15E148',
        createdAt: '2023-01-01T00:00:00Z',
      },
    ];

    (clientPushNotificationService.isSubscribed as jest.Mock).mockResolvedValueOnce(true);
    (clientPushNotificationService.getUserSubscriptions as jest.Mock).mockResolvedValueOnce(mockSubscriptions);

    render(<PushNotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText('Registered Devices')).toBeInTheDocument();
      expect(screen.getByText('Windows')).toBeInTheDocument();
      expect(screen.getByText('iPhone')).toBeInTheDocument();
    });
  });

  it('opens send notification modal for admin users', async () => {
    // Mock admin session
    const { useSession } = require('next-auth/react');
    useSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
      },
      status: 'authenticated',
    });

    (clientPushNotificationService.isSubscribed as jest.Mock).mockResolvedValueOnce(true);

    render(<PushNotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText('Send Custom Notification')).toBeInTheDocument();
    });

    const sendButton = screen.getByText('Send Custom Notification');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Target Recipients')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Notification title')).toBeInTheDocument();
    });
  });

  it('handles notification send errors gracefully', async () => {
    const { useSession } = require('next-auth/react');
    useSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-id',
          role: 'admin',
        },
      },
      status: 'authenticated',
    });

    (clientPushNotificationService.isSubscribed as jest.Mock).mockResolvedValueOnce(true);
    (clientPushNotificationService.sendCustomNotification as jest.Mock).mockResolvedValueOnce({
      success: false,
    });

    render(<PushNotificationSettings />);

    await waitFor(() => {
      const sendButton = screen.getByText('Send Custom Notification');
      fireEvent.click(sendButton);
    });

    // Fill and submit form
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('Notification title');
      const messageInput = screen.getByPlaceholderText('Notification message');
      
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(messageInput, { target: { value: 'Test Message' } });
    });

    const submitButton = screen.getByRole('button', { name: /ok/i });
    await user.click(submitButton);

    const { message } = require('antd');
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to send notification');
    });
  });
});
