import { useRef, type ReactNode } from 'react';
import { App, Modal } from 'antd';
export function FormDialog({
  open,
  title,
  dirty,
  submitting,
  onSubmit,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  dirty: boolean;
  submitting: boolean;
  onSubmit: () => Promise<void>;
  onClose: () => void;
  children: ReactNode;
}) {
  const { modal } = App.useApp();
  const locked = useRef(false);
  const close = () => {
    if (submitting || locked.current) return;
    if (!dirty) {
      onClose();
      return;
    }
    modal.confirm({
      title: '放弃未保存的修改？',
      content: '关闭后，本次填写的内容不会保存。',
      okText: '放弃修改',
      cancelText: '继续编辑',
      onOk: onClose,
    });
  };
  return (
    <Modal
      open={open}
      title={title}
      onCancel={close}
      closable={!submitting}
      keyboard={!submitting}
      mask={{ closable: false }}
      width={560}
      okText="保存"
      cancelText="取消"
      confirmLoading={submitting}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnHidden
      onOk={async () => {
        if (locked.current || submitting) return;
        locked.current = true;
        try {
          await onSubmit();
        } finally {
          locked.current = false;
        }
      }}
    >
      {children}
    </Modal>
  );
}
