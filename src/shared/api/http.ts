import { validate, type SchemaName } from '../../contracts/validate';
import type { ApiErrorBody } from '../../contracts/types';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  schema: SchemaName | null,
  init: RequestInit = {},
): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';
  const timeout = AbortSignal.timeout(15000);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      signal,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    if (timeout.aborted) throw new ApiError(0, 'TIMEOUT', '请求超时，请重试');
    throw new ApiError(0, 'NETWORK_ERROR', '网络连接失败，请重试');
  }
  if (response.status === 204 && response.ok && schema === null) return undefined as T;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, 'INVALID_RESPONSE', '服务返回格式异常，请重试');
  }
  if (!response.ok) {
    if (!validate('ApiErrorBody', body).valid)
      throw new ApiError(response.status, 'INVALID_RESPONSE', '服务返回错误格式异常');
    const error = body as ApiErrorBody;
    throw new ApiError(response.status, error.code, error.message, error.fieldErrors);
  }
  if (!schema || !validate(schema, body).valid)
    throw new ApiError(response.status, 'INVALID_RESPONSE', '服务返回的数据不符合接口契约');
  return body as T;
}
