import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { AppProviders } from './providers';
import { App } from './App';
import type { DemoRuntime } from '../shared/demo';
const enabled =
  import.meta.env.VITE_ENABLE_MOCK === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK !== 'false');
async function cleanMockWorker() {
  if (!('serviceWorker' in navigator)) return;
  const ownPath = new URL('/mockServiceWorker.js', location.origin).href;
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    if (
      [registration.active, registration.waiting, registration.installing].some(
        (worker) => worker?.scriptURL === ownPath,
      )
    )
      await registration.unregister();
  }
  if (navigator.serviceWorker.controller?.scriptURL === ownPath) {
    if (sessionStorage.getItem('clientdesk.worker-reload'))
      throw new Error('旧演示服务仍控制此页面，请关闭此标签页后重新打开。');
    sessionStorage.setItem('clientdesk.worker-reload', '1');
    location.reload();
    await new Promise(() => {});
  }
  sessionStorage.removeItem('clientdesk.worker-reload');
}
function Startup() {
  const [runtime, setRuntime] = useState<DemoRuntime | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const start = useCallback(async (mode: 'stored' | 'memory' | 'reset' = 'stored') => {
    setBusy(true);
    setError('');
    try {
      if (enabled) {
        const { initializeDemo } = await import('../mocks/browser');
        setRuntime(await initializeDemo(mode));
      } else {
        await cleanMockWorker();
        setRuntime(null);
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : '应用初始化失败');
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void start();
  }, [start]);
  if (runtime !== undefined) return <App runtime={runtime} />;
  return (
    <div className="startup">
      <Card>
        <Typography.Title level={3}>ClientDesk</Typography.Title>
        {error ? (
          <Space orientation="vertical">
            <Alert
              type="error"
              showIcon
              title="无法载入演示数据"
              description={`${error}。现有数据没有被覆盖。`}
            />
            {enabled && (
              <>
                <Button loading={busy} onClick={() => void start('memory')}>
                  使用临时内存模式
                </Button>
                <Button
                  danger
                  loading={busy}
                  onClick={() => {
                    if (window.confirm('确认替换已有演示数据并恢复种子？')) void start('reset');
                  }}
                >
                  确认重置并启动
                </Button>
              </>
            )}
            <Button loading={busy} onClick={() => void start()}>
              重新尝试
            </Button>
          </Space>
        ) : (
          <Typography.Text>正在准备工作区…</Typography.Text>
        )}
      </Card>
    </div>
  );
}
export function bootstrap() {
  createRoot(document.getElementById('root')!).render(
    <AppProviders>
      <Startup />
    </AppProviders>,
  );
}
