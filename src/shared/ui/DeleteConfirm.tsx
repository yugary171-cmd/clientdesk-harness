import { Alert, Modal, Typography } from 'antd';
export function DeleteConfirm({
  open,
  entityLabel,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  entityLabel: string;
  pending: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title="确认删除"
      okText="删除"
      cancelText="取消"
      okButtonProps={{ danger: true, disabled: pending }}
      confirmLoading={pending}
      onOk={onConfirm}
      onCancel={() => {
        if (!pending) onCancel();
      }}
      closable={!pending}
      mask={{ closable: false }}
    >
      <Typography.Paragraph>确定删除「{entityLabel}」？删除后无法恢复。</Typography.Paragraph>
      {error && <Alert type="error" showIcon title={error} />}
    </Modal>
  );
}
