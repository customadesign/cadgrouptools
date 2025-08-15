'use client';

import { SessionProvider } from 'next-auth/react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AntdRegistry>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AntdRegistry>
    </SessionProvider>
  );
}
