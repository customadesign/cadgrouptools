'use client';

import { SessionProvider } from 'next-auth/react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

function AntdThemeWrapper({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  const customTheme = {
    algorithm: resolvedTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      // Brand Colors
      colorPrimary: resolvedTheme === 'dark' ? '#60A5FA' : '#3B82F6',
      colorSuccess: resolvedTheme === 'dark' ? '#34D399' : '#10B981',
      colorWarning: resolvedTheme === 'dark' ? '#FBBF24' : '#F59E0B',
      colorError: resolvedTheme === 'dark' ? '#F87171' : '#EF4444',
      colorInfo: resolvedTheme === 'dark' ? '#60A5FA' : '#3B82F6',
      
      // Background Colors
      colorBgBase: resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF',
      colorBgContainer: resolvedTheme === 'dark' ? '#1E293B' : '#FFFFFF',
      colorBgElevated: resolvedTheme === 'dark' ? '#1E293B' : '#FFFFFF',
      colorBgLayout: resolvedTheme === 'dark' ? '#0F172A' : '#F8FAFB',
      
      // Border Colors
      colorBorder: resolvedTheme === 'dark' ? '#334155' : '#E5E7EB',
      colorBorderSecondary: resolvedTheme === 'dark' ? '#1E293B' : '#F3F4F6',
      
      // Text Colors
      colorText: resolvedTheme === 'dark' ? '#F1F5F9' : '#1F2937',
      colorTextSecondary: resolvedTheme === 'dark' ? '#94A3B8' : '#6B7280',
      colorTextTertiary: resolvedTheme === 'dark' ? '#64748B' : '#9CA3AF',
      
      // Typography
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: 16,
      fontSizeHeading1: 36,
      fontSizeHeading2: 30,
      fontSizeHeading3: 24,
      fontSizeHeading4: 20,
      fontSizeHeading5: 18,
      
      // Spacing
      padding: 16,
      paddingLG: 24,
      paddingXL: 32,
      margin: 16,
      marginLG: 24,
      marginXL: 32,
      
      // Border Radius
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      
      // Transitions
      motionDurationFast: '0.15s',
      motionDurationMid: '0.3s',
      motionDurationSlow: '0.5s',
      motionEaseInOut: 'ease',
      
      // Box Shadow
      boxShadow: resolvedTheme === 'dark' 
        ? '0 1px 2px 0 rgb(0 0 0 / 0.3)'
        : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      boxShadowSecondary: resolvedTheme === 'dark'
        ? '0 4px 6px -1px rgb(0 0 0 / 0.3)'
        : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
    components: {
      Card: {
        borderRadiusLG: 12,
        boxShadowTertiary: resolvedTheme === 'dark'
          ? '0 1px 2px 0 rgb(0 0 0 / 0.3)'
          : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      Button: {
        borderRadius: 24,
        controlHeight: 40,
        fontWeight: 600,
      },
      Table: {
        borderRadius: 8,
        headerBg: resolvedTheme === 'dark' ? '#1E293B' : '#F8FAFB',
      },
      Modal: {
        borderRadiusLG: 12,
      },
      Drawer: {
        borderRadiusLG: 12,
      },
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      {children}
    </ConfigProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AntdRegistry>
          <AntdThemeWrapper>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AntdThemeWrapper>
        </AntdRegistry>
      </ThemeProvider>
    </SessionProvider>
  );
}
