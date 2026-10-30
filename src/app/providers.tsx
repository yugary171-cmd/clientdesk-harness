import { useState, type ReactNode } from 'react';
import { App, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
export function createQueryClient(refetchOnWindowFocus = true) {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 15000, refetchOnWindowFocus },
      mutations: { retry: false },
    },
  });
}
export function AppProviders({
  children,
  motion = true,
  refetchOnWindowFocus = true,
}: {
  children: ReactNode;
  motion?: boolean;
  refetchOnWindowFocus?: boolean;
}) {
  const [client] = useState(() => createQueryClient(refetchOnWindowFocus));
  return (
    <ConfigProvider
      button={{ autoInsertSpace: false }}
      locale={zhCN}
      theme={{
        token: {
          motion,
          colorPrimary: '#175b51',
          borderRadius: 8,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
          colorBgLayout: '#f5f7f8',
          controlHeight: 36,
        },
        components: {
          Table: { headerBg: '#f7f9fa', cellPaddingBlock: 15 },
          Button: { fontWeight: 500 },
        },
      }}
    >
      <App>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </App>
    </ConfigProvider>
  );
}
