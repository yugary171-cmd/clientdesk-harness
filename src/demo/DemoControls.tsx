import { useSyncExternalStore } from 'react';
import { Alert, App, Button, Popover, Select, Space, Tag, Typography } from 'antd';
import { ExperimentOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import type { DemoRuntime } from '../shared/demo';
import type { Scenario } from '../shared/demo';
export function DemoControls({ runtime }: { runtime: DemoRuntime }) {
  const state = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
  const { modal, message } = App.useApp();
  const client = useQueryClient();
  const reset = () =>
    modal.confirm({
      title: '重置演示数据？',
      content: '将恢复固定示例数据。当前演示中新增或修改的内容会被替换。',
      okText: '确认重置',
      cancelText: '取消',
      onOk: async () => {
        await client.cancelQueries();
        await runtime.reset();
        client.removeQueries();
        await client.invalidateQueries();
        window.dispatchEvent(new Event('demo-reset'));
        message.success('演示数据已重置');
      },
    });
  return (
    <>
      <Popover
        trigger="click"
        placement="bottomRight"
        content={
          <Space orientation="vertical" size="middle" className="demo-panel">
            <Typography.Text strong>演示控制</Typography.Text>
            <Typography.Text type="secondary">仅影响本浏览器的虚构数据。</Typography.Text>
            <Select
              aria-label="演示场景"
              value={state.scenario}
              onChange={(mode: Scenario) => {
                runtime.setScenario(mode);
                void client.invalidateQueries();
              }}
              options={[
                { value: 'normal', label: '正常请求' },
                { value: 'slow', label: '延迟 1.5 秒' },
                { value: 'error-once', label: '下一次请求失败' },
                { value: 'empty-lists', label: '空列表' },
              ]}
              style={{ width: '100%' }}
            />
            <Button icon={<ReloadOutlined aria-hidden="true" />} onClick={reset}>
              重置演示数据
            </Button>
          </Space>
        }
      >
        <Button type="text" icon={<ExperimentOutlined aria-hidden="true" />}>
          演示环境
        </Button>
      </Popover>
      {!state.persistent && <Tag color="orange">内存模式</Tag>}
      {state.warning && (
        <Alert className="storage-warning" title={state.warning} type="warning" showIcon />
      )}
    </>
  );
}
