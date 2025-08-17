// Notification types and interfaces

export type NotificationType = 'user' | 'document' | 'proposal' | 'system' | 'payment' | 'task';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    userId?: string;
    documentId?: string;
    proposalId?: string;
    amount?: number;
    [key: string]: any;
  };
  avatar?: string;
  sender?: {
    name: string;
    avatar?: string;
    role?: string;
  };
}

export interface NotificationGroup {
  date: string;
  notifications: Notification[];
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}