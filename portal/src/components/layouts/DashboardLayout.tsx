'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  Badge,
  Breadcrumb,
  Spin,
  theme,
  ConfigProvider,
  Switch,
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
  PlusOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ title: string; href?: string }>;
}

export default function DashboardLayout({ children, breadcrumbs = [] }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { token } = theme.useToken();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const handleThemeChange = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  if (status === 'loading') {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: darkMode ? '#000' : '#f5f5f5',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => router.push('/dashboard'),
    },
    {
      key: '/clients',
      icon: <TeamOutlined />,
      label: 'Clients',
      children: [
        {
          key: '/clients',
          label: 'All Clients',
          onClick: () => router.push('/clients'),
        },
        {
          key: '/clients/new',
          label: 'Add New Client',
          icon: <PlusOutlined />,
          onClick: () => router.push('/clients/new'),
        },
      ],
    },
    {
      key: '/proposals',
      icon: <FileTextOutlined />,
      label: 'Proposals',
      children: [
        {
          key: '/proposals',
          label: 'All Proposals',
          onClick: () => router.push('/proposals'),
        },
        {
          key: '/proposals/new',
          label: 'Create Proposal',
          icon: <PlusOutlined />,
          onClick: () => router.push('/proposals/new'),
        },
      ],
    },
    {
      key: '/accounting',
      icon: <CalculatorOutlined />,
      label: 'Accounting',
      children: [
        {
          key: '/accounting',
          label: 'Overview',
          onClick: () => router.push('/accounting'),
        },
        {
          key: '/accounting/transactions',
          label: 'Transactions',
          onClick: () => router.push('/accounting/transactions'),
        },
        {
          key: '/accounting/upload',
          label: 'Upload Statement',
          onClick: () => router.push('/accounting/upload'),
        },
        {
          key: '/accounting/reports',
          label: 'Reports',
          onClick: () => router.push('/accounting/reports'),
        },
      ],
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleSignOut,
      danger: true,
    },
  ];

  const getSelectedKeys = () => {
    // Find exact match first
    if (menuItems.some(item => item?.key === pathname)) {
      return [pathname];
    }
    // Check children
    for (const item of menuItems) {
      if ('children' in item && item.children) {
        const child = item.children.find(c => c?.key === pathname);
        if (child) {
          return [pathname];
        }
      }
    }
    // Default to parent path
    const parentPath = '/' + pathname.split('/')[1];
    return [parentPath];
  };

  const getOpenKeys = () => {
    const parentPath = '/' + pathname.split('/')[1];
    return [parentPath];
  };

  const breadcrumbItems = [
    { title: <HomeOutlined />, href: '/dashboard' },
    ...breadcrumbs,
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontSize: 14,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          breakpoint="md"
          onBreakpoint={(broken) => {
            setCollapsed(broken);
          }}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
          }}>
            <h2 style={{
              color: '#fff',
              margin: 0,
              fontSize: collapsed ? 16 : 20,
              fontWeight: 600,
              transition: 'all 0.3s',
            }}>
              {collapsed ? 'CAD' : 'CADGroup'}
            </h2>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={getSelectedKeys()}
            defaultOpenKeys={getOpenKeys()}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Sider>
        
        <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
          <Header
            style={{
              padding: 0,
              background: darkMode ? token.colorBgContainer : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              position: 'sticky',
              top: 0,
              zIndex: 99,
            }}
          >
            <Space style={{ marginLeft: 24 }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 64,
                  height: 64,
                }}
              />
            </Space>

            <Space style={{ marginRight: 24 }} size="middle">
              <Switch
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                checked={darkMode}
                onChange={handleThemeChange}
              />
              
              <Badge count={5} size="small">
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                />
              </Badge>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar
                    style={{
                      backgroundColor: token.colorPrimary,
                      verticalAlign: 'middle',
                    }}
                    size="default"
                  >
                    {session.user?.email?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <span style={{ 
                    fontWeight: 500,
                    display: isMobile ? 'none' : 'inline',
                  }}>
                    {session.user?.email?.split('@')[0]}
                  </span>
                </Space>
              </Dropdown>
            </Space>
          </Header>

          <Content
            style={{
              margin: 24,
              minHeight: 280,
            }}
          >
            {breadcrumbs.length > 0 && (
              <Breadcrumb
                items={breadcrumbItems}
                style={{ marginBottom: 16 }}
              />
            )}
            <div
              style={{
                background: darkMode ? token.colorBgContainer : '#fff',
                borderRadius: 8,
                padding: 24,
                minHeight: '100%',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            >
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}