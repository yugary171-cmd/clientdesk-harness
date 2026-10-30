import { useState } from 'react';
import type { FormInstance } from 'antd';
import { App } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/http';
import { refreshResources } from '../api/cache';
export function useEditor<T extends object>(
  form: FormInstance<T>,
  save: (values: T) => Promise<unknown>,
  onClose: () => void,
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const client = useQueryClient();
  const { message } = App.useApp();
  const submit = async () => {
    let values: T;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setPending(true);
    setError('');
    try {
      await save(values);
      await refreshResources(client);
      message.success('保存成功');
      onClose();
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 404) {
        message.warning(problem.message);
        onClose();
        await refreshResources(client);
      } else {
        setError(problem instanceof Error ? problem.message : '保存失败，请重试');
        if (problem instanceof ApiError && problem.fieldErrors)
          form.setFields(
            Object.entries(problem.fieldErrors).map(([name, error]) => ({
              name: name as never,
              errors: [error],
            })),
          );
      }
    } finally {
      setPending(false);
    }
  };
  return { pending, error, submit };
}
export function isDirty(values: object, initial: object) {
  const normalize = (value: object) =>
    JSON.stringify(
      Object.entries(value)
        .map(([key, item]) => [key, item ?? ''])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    );
  return normalize(values) !== normalize(initial);
}
