import { http, HttpResponse, delay } from 'msw';
import contract from '../../contracts/openapi.json';
import type { ListParams, TicketParams } from '../../contracts/types';
import { DomainError, type Repository } from '../repository';
import type { Scenario } from '../../shared/demo';
export type { Scenario } from '../../shared/demo';
export type ScenarioState = { current: Scenario; onConsumed?: () => void };
function query(request: Request, resource: 'customers' | 'tickets'): ListParams | TicketParams {
  const url = new URL(request.url);
  const params = contract.paths[`/api/${resource}`].get.parameters;
  const allowed = params.map((p) => p.name);
  for (const key of url.searchParams.keys()) {
    if (!allowed.includes(key)) throw new DomainError(422, 'INVALID_QUERY', '包含不支持的查询参数');
  }
  const result: Record<string, string | number> = {};
  for (const param of params) {
    const value = url.searchParams.get(param.name);
    if (value === null) continue;
    const schema = param.schema as { type: string; enum?: (string | number)[]; minimum?: number };
    const parsed = schema.type === 'integer' ? Number(value) : value.trim();
    if (
      (schema.type === 'integer' &&
        (!Number.isSafeInteger(parsed) ||
          Number(parsed) < (schema.minimum ?? 1) ||
          value.trim() === '')) ||
      (schema.enum && !schema.enum.includes(parsed))
    )
      throw new DomainError(422, 'INVALID_QUERY', '查询参数不合法');
    result[param.name] = parsed;
  }
  return result as ListParams;
}
export function createHandlers(
  repository: Repository,
  scenario: ScenarioState = { current: 'normal' },
) {
  return [
    http.all('*/api/*', async ({ request }) => {
      try {
        if (scenario.current === 'slow') await delay(1500);
        if (scenario.current === 'error-once') {
          scenario.current = 'normal';
          scenario.onConsumed?.();
          throw new DomainError(503, 'DEMO_ERROR', '模拟服务暂时不可用，请重试');
        }
        const pathname = new URL(request.url).pathname;
        const match = /^\/api\/(customers|tickets)(?:\/([^/]+))?$/.exec(pathname);
        if (!match) throw new DomainError(404, 'UNHANDLED_API', '没有匹配的 Mock API');
        const resource = match[1] as 'customers' | 'tickets';
        const id = match[2] ? decodeURIComponent(match[2]) : undefined;
        const customer = resource === 'customers';
        if (request.method === 'GET' && !id) {
          const params = query(request, resource);
          const result = customer
            ? repository.listCustomers(params)
            : repository.listTickets(params);
          return HttpResponse.json(
            scenario.current === 'empty-lists' ? { ...result, items: [], total: 0 } : result,
          );
        }
        if (request.method === 'GET' && id)
          return HttpResponse.json(
            customer ? repository.getCustomer(id) : repository.getTicket(id),
          );
        if (request.method === 'DELETE' && id) {
          if (customer) repository.removeCustomer(id);
          else repository.removeTicket(id);
          return new HttpResponse(null, { status: 204 });
        }
        if ((request.method === 'POST' && !id) || (request.method === 'PATCH' && id)) {
          let input: unknown;
          try {
            input = await request.json();
          } catch {
            throw new DomainError(422, 'INVALID_JSON', '请求内容不是合法 JSON');
          }
          const result =
            request.method === 'POST'
              ? customer
                ? repository.createCustomer(input)
                : repository.createTicket(input)
              : customer
                ? repository.updateCustomer(id!, input)
                : repository.updateTicket(id!, input);
          return HttpResponse.json(result, { status: request.method === 'POST' ? 201 : 200 });
        }
        throw new DomainError(405, 'METHOD_NOT_ALLOWED', '请求方法不支持');
      } catch (error) {
        if (error instanceof DomainError)
          return HttpResponse.json(
            {
              code: error.code,
              message: error.message,
              ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
            },
            { status: error.status },
          );
        return HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '演示服务发生错误，请重置数据或重试' },
          { status: 500 },
        );
      }
    }),
  ];
}
