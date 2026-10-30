import { Alert, Button, Empty, Table } from 'antd';
import type { TableProps } from 'antd';
export type DataTableProps<T> = {
  rows: T[];
  columns: TableProps<T>['columns'];
  loading: boolean;
  error?: Error | null;
  emptyDescription: string;
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number, size: number) => void;
  onRetry: () => void;
};
export function DataTable<T extends { id: string }>(props: DataTableProps<T>) {
  if (props.error)
    return (
      <Alert
        className="table-error"
        showIcon
        type="error"
        title="暂时无法获取数据"
        description={props.error.message}
        action={<Button onClick={props.onRetry}>重试</Button>}
      />
    );
  return (
    <Table<T>
      rowKey="id"
      dataSource={props.rows}
      columns={props.columns}
      loading={props.loading}
      scroll={{ x: 900 }}
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={props.emptyDescription} />
        ),
      }}
      pagination={{
        current: props.page,
        pageSize: props.pageSize,
        total: props.total,
        pageSizeOptions: [10, 20, 50],
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
        onChange: props.onPage,
      }}
    />
  );
}
