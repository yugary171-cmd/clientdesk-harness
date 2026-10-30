import { useSelection } from '../../shared/ui/useSelection';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Customer } from '../../contracts/types';
import { customersApi } from '../../shared/api/resources';
import { DataTable } from '../../shared/ui/DataTable';
import { DeleteConfirm } from '../../shared/ui/DeleteConfirm';
import { SearchBox } from '../../shared/ui/SearchBox';
import { useListParams, usePageRecovery } from '../../shared/ui/useListParams';
import { useDelete } from '../../shared/ui/useDelete';
import { RecordLoader } from '../../shared/ui/RecordLoader';
import { formatTime } from '../../shared/config';
import { useCustomer, useCustomers } from './queries';
import { CustomerForm } from './CustomerForm';
import { CustomerDetail } from './CustomerDetail';
export function CustomersPage() {
  const { params, update, reset } = useListParams('customers');
  const query = useCustomers(params);
  const { selection, select, close } = useSelection<{
    mode: 'new' | 'edit' | 'detail';
    id?: string;
  }>();
  const record = useCustomer(selection?.id);
  const deletion = useDelete<Customer>(customersApi.remove);
  usePageRecovery(query.data?.total, params, (page) => update({ page }));
  return (
    <section>
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>客户管理</Typography.Title>
          <Typography.Paragraph type="secondary">
            维护客户档案，让每一次服务都有据可循。
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined aria-hidden="true" />}
          onClick={() => select({ mode: 'new' })}
        >
          新增客户
        </Button>
      </div>
      <div className="workspace-panel">
        <div className="table-toolbar">
          <SearchBox
            value={params.q}
            placeholder="搜索客户名称或邮箱"
            onChange={(q) => update({ q, page: 1 })}
          />
          <Space>
            <Button onClick={reset}>重置筛选</Button>
            <Button
              icon={<ReloadOutlined aria-hidden="true" />}
              aria-label="刷新客户列表"
              onClick={() => void query.refetch()}
            />
          </Space>
        </div>
        <DataTable<Customer>
          rows={query.data?.items ?? []}
          loading={query.isFetching}
          error={query.error}
          emptyDescription={
            params.q ? '没有匹配的客户，试试其他关键词' : '暂无客户，新增一个客户开始工作'
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
              title: '客户名称',
              dataIndex: 'name',
              width: 210,
              render: (name: string, row) => (
                <Button
                  className="name-link"
                  type="link"
                  onClick={() => select({ mode: 'detail', id: row.id })}
                >
                  {name}
                </Button>
              ),
            },
            { title: '联系人', dataIndex: 'contactName', width: 110 },
            { title: '邮箱', dataIndex: 'email', width: 230 },
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
      {selection?.mode === 'new' && <CustomerForm key="new" onClose={close} />}
      {selection?.id && (!record.data || record.error) && (
        <RecordLoader
          loading={record.isLoading}
          error={record.error}
          onClose={close}
          retry={() => void record.refetch()}
        />
      )}
      {selection?.mode === 'edit' && record.data && !record.error && (
        <CustomerForm key={selection.id} customer={record.data} onClose={close} />
      )}
      {selection?.mode === 'detail' && record.data && !record.error && (
        <CustomerDetail customer={record.data} onClose={close} />
      )}
      <DeleteConfirm
        open={Boolean(deletion.target)}
        entityLabel={deletion.target?.name ?? ''}
        pending={deletion.pending}
        error={deletion.error}
        onConfirm={() => void deletion.confirm()}
        onCancel={deletion.cancel}
      />
    </section>
  );
}
