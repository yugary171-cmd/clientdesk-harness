import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Avatar, Breadcrumb, Button, Space, Typography } from 'antd';
import {
  TeamOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { CustomersPage } from '../features/customers/CustomersPage';
import { TicketsPage } from '../features/tickets/TicketsPage';
import { DemoControls } from '../demo/DemoControls';
import type { DemoRuntime } from '../shared/demo';
function Shell({ runtime }: { runtime: DemoRuntime | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [revision, setRevision] = useState(0);
  const location = useLocation();
  useEffect(() => {
    const reset = () => setRevision((v) => v + 1);
    window.addEventListener('demo-reset', reset);
    return () => window.removeEventListener('demo-reset', reset);
  }, []);
  const ticket = location.pathname === '/tickets';
  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-symbol">
            <AppstoreOutlined aria-hidden="true" />
          </span>
          <div className="brand-text">
            ClientDesk<span>客户服务工作台</span>
          </div>
        </div>
        <div className="nav-label">工作空间</div>
        <nav aria-label="主导航">
          <NavLink to="/customers">
            <TeamOutlined aria-hidden="true" />
            <span>客户管理</span>
          </NavLink>
          <NavLink to="/tickets">
            <CustomerServiceOutlined aria-hidden="true" />
            <span>工单管理</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="workspace-dot" />
          <div>
            演示组织<span>客户服务团队</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <Space>
            <Button
              type="text"
              className="collapse-button"
              aria-label="切换侧边栏"
              icon={
                collapsed ? (
                  <MenuUnfoldOutlined aria-hidden="true" />
                ) : (
                  <MenuFoldOutlined aria-hidden="true" />
                )
              }
              onClick={() => setCollapsed((x) => !x)}
            />
            <Breadcrumb
              items={[{ title: '工作空间' }, { title: ticket ? '工单管理' : '客户管理' }]}
            />
          </Space>
          <Space className="topbar-right">
            {runtime && <DemoControls runtime={runtime} />}
            <span className="header-divider" />
            <Avatar
              size={30}
              icon={<UserOutlined aria-hidden="true" />}
              style={{ background: '#e5eeeb', color: '#175b51' }}
            />
            <Typography.Text className="operator">演示操作员</Typography.Text>
          </Space>
        </header>
        <main className="content" key={revision}>
          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="*" element={<Navigate to="/customers" replace />} />
          </Routes>
        </main>
        <footer className="page-footer">
          ClientDesk <span>简洁、有序的客户服务</span>
        </footer>
      </div>
    </div>
  );
}
export function App({ runtime }: { runtime: DemoRuntime | null }) {
  return (
    <BrowserRouter>
      <Shell runtime={runtime} />
    </BrowserRouter>
  );
}
