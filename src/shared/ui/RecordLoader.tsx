import { useEffect } from 'react';
import { Alert, App, Button, Modal, Spin } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/http';
import { refreshResources } from '../api/cache';
export function RecordLoader({
  loading,
  error,
  onClose,
  retry,
}: {
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  retry: () => void;
}) {
  const { message } = App.useApp();
  const client = useQueryClient();
  useEffect(() => {
    if (error instanceof ApiError && error.status === 404) {
      message.warning(error.message);
      onClose();
      void refreshResources(client);
    }
  }, [error, onClose, message, client]);
  return (
    <Modal open title="载入记录" footer={null} onCancel={onClose}>
      {loading ? (
        <Spin />
      ) : (
        <Alert
          type="error"
          title={error?.message || '无法载入记录'}
          action={<Button onClick={retry}>重试</Button>}
        />
      )}
    </Modal>
  );
}
