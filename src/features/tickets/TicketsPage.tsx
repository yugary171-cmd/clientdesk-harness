import { useSelection } from '../../shared/ui/useSelection';
import { Button, Select, Space, Tag, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Ticket } from '../../contracts/types';
import { ticketsApi } from '../../shared/api/resources';
import { DataTable } from '../../shared/ui/DataTable';
import { DeleteConfirm } from '../../shared/ui/DeleteConfirm';
import { SearchBox } from '../../shared/ui/SearchBox';
import { useListParams, usePageRecovery } from '../../shared/ui/useListParams';
import { useDelete } from '../../shared/ui/useDelete';
import { RecordLoader } from '../../shared/ui/RecordLoader';
import {
  formatTime,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../shared/config';
import { useTicket, useTickets } from './queries';
import { TicketForm } from './TicketForm';
import { TicketDetail } from './TicketDetail';
import { CustomerSelect } from './CustomerSelect';
export function TicketsPage() {
  const { params, update, reset } = useListParams('tickets');
  const query = useTickets(params);
  const { selection, select, close } = useSelection<{
    mode: 'new' | 'edit' | 'detail';
    id?: string;
  }>();
  const record = useTicket(selection?.id);
  const deletion = useDelete<Ticket>(ticketsApi.remove);
  usePageRecovery(query.data?.total, params, (page) => update({ page }));
  return (
    <section>
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>工单管理</Typography.Title>
          <Typography.Paragraph type="secondary">
            集中跟进客户问题，让服务进展清晰可见。
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined aria-hidden="true" />}
          onClick={() => select({ mode: 'new' })}
        >
          新增工单
        </Button>
      </div>
      <div className="workspace-panel">
        <div className="table-toolbar">
          <div className="filters">
            <SearchBox
              value={params.q}
              placeholder="搜索工单标题"
              onChange={(q) => update({ q, page: 1 })}
            />
            <div className="customer-filter">
              <CustomerSelect
                allowClear
                value={params.customerId}
                onChange={(customerId) => update({ customerId, page: 1 })}
              />
            </div>
            <Select
              aria-label="筛选状态"
              placeholder="全部状态"
              allowClear
              value={params.status}
              onChange={(status) => update({ status, page: 1 })}
              options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              style={{ minWidth: 120 }}
            />
            <Select
              aria-label="筛选优先级"
              placeholder="全部优先级"
              allowClear
              value={params.priority}
              onChange={(priority) => update({ priority, page: 1 })}
              options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
              style={{ minWidth: 125 }}
            />
          </div>
          <Space>
            <Button onClick={reset}>重置筛选</Button>
            <Button
              icon={<ReloadOutlined aria-hidden="true" />}
              aria-label="刷新工单列表"
              onClick={() => void query.refetch()}
            />
          </Space>
        </div>
        <DataTable<Ticket>
          rows={query.data?.items ?? []}
          loading={query.isFetching}
          error={query.error}
          emptyDescription={
            params.q || params.customerId || params.status || params.priority
              ? '没有匹配的工单，试试调整筛选条件'
              : '暂无工单，新增一个工单开始跟进'
          }
          page={params.page!}
          pageSize={params.pageSize!}
          total={query.data?.total ?? 0}
          onPage={(page, pageSize) =>
            update({
              page: pageSize === params.pageSize ? page : 1,
              pageSize: pageSize as 10 | 20 | 50,
            })
          }
          onRetry={() => void query.refetch()}
          columns={[
            {
              title: '工单标题',
              dataIndex: 'title',
              width: 240,
              render: (title: string, row) => (
                <Button
                  className="name-link"
                  type="link"
                  onClick={() => select({ mode: 'detail', id: row.id })}
                >
                  {title}
                </Button>
              ),
            },
            { title: '客户', dataIndex: 'customerName', width: 140 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 110,
              render: (status: Ticket['status']) => (
                <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
              ),
            },
            {
              title: '优先级',
              dataIndex: 'priority',
              width: 90,
              render: (priority: Ticket['priority']) => (
                <Tag color={PRIORITY_COLORS[priority]}>{PRIORITY_LABELS[priority]}</Tag>
              ),
            },
            { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: formatTime },
            {
              title: '操作',
              key: 'actions',
              width: 190,
              fixed: 'right',
              render: (_, row) => (
                <Space size={2}>
                  <Button type="link" onClick={() => select({ mode: 'detail', id: row.id })}>
                    详情
                  </Button>
                  <Button type="link" onClick={() => select({ mode: 'edit', id: row.id })}>
                    编辑
                  </Button>
                  <Button type="link" danger onClick={() => deletion.select(row)}>
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </div>
      {selection?.mode === 'new' && <TicketForm key="new" onClose={close} />}
      {selection?.id && (!record.data || record.error) && (
        <RecordLoader
          loading={record.isLoading}
          error={record.error}
          onClose={close}
          retry={() => void record.refetch()}
        />
      )}
      {selection?.mode === 'edit' && record.data && !record.error && (
        <TicketForm key={selection.id} ticket={record.data} onClose={close} />
      )}
      {selection?.mode === 'detail' && record.data && !record.error && (
        <TicketDetail ticket={record.data} onClose={close} />
      )}
      <DeleteConfirm
        open={Boolean(deletion.target)}
        entityLabel={deletion.target?.title ?? ''}
        pending={deletion.pending}
        error={deletion.error}
        onConfirm={() => void deletion.confirm()}
        onCancel={deletion.cancel}
      />
    </section>
  );
}
