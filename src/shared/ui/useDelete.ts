import { useRef, useState } from 'react';
import { App } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { refreshResources } from '../api/cache';
import { ApiError } from '../api/http';
export function useDelete<T extends { id: string }>(remove: (id: string) => Promise<void>) {
  const [target, setTarget] = useState<T | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const client = useQueryClient();
  const { message } = App.useApp();
  return {
    target,
    pending,
    error,
    select: (value: T) => {
      setError('');
      setTarget(value);
    },
    cancel: () => {
      if (!lock.current) {
        setTarget(null);
        setError('');
      }
    },
    confirm: async () => {
      if (!target || lock.current) return;
      lock.current = true;
      setPending(true);
      setError('');
      try {
        await remove(target.id);
        setTarget(null);
        message.success('删除成功');
        await refreshResources(client);
      } catch (problem) {
        if (problem instanceof ApiError && problem.status === 404) {
          setTarget(null);
          message.warning(problem.message);
          await refreshResources(client);
        } else setError(problem instanceof Error ? problem.message : '删除失败，请重试');
      } finally {
        lock.current = false;
        setPending(false);
      }
    },
  };
}
