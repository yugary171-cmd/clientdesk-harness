import { useState } from 'react';
import { Alert, Button, Empty, Select, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../shared/api/resources';
import { cacheKeys } from '../../shared/api/cache';
import { useDebouncedValue } from '../../shared/ui/useListParams';
export function CustomerSelect({
  value,
  onChange,
  disabled,
  id,
  allowClear = false,
}: {
  value?: string;
  onChange?: (id?: string) => void;
  disabled?: boolean;
  id?: string;
  allowClear?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search);
  const params = { q, page, pageSize: 20 as const };
  const list = useQuery({
    queryKey: cacheKeys.customers(params),
    queryFn: ({ signal }) => customersApi.list(params, signal),
  });
  const selected = useQuery({
    queryKey: cacheKeys.customer(value ?? ''),
    queryFn: ({ signal }) => customersApi.get(value!, signal),
    enabled: Boolean(value),
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const options = (list.data?.items ?? []).map((c) => ({
    value: c.id,
    label: selected.data?.id === c.id ? selected.data.name : c.name,
  }));
  if (selected.data && !options.some((x) => x.value === selected.data.id))
    options.unshift({ value: selected.data.id, label: selected.data.name });
  const failed = list.error || selected.error;
  return (
    <div className="customer-select">
      <Select
        id={id}
        aria-label="关联客户"
        style={{ width: '100%' }}
        value={value || undefined}
        onChange={onChange}
        disabled={disabled}
        allowClear={allowClear}
        placeholder="搜索并选择客户"
        options={options}
        showSearch={{
          filterOption: false,
          onSearch: (text) => {
            setSearch(text);
            setPage(1);
          },
        }}
        loading={list.isFetching}
        status={failed ? 'error' : undefined}
        notFoundContent={
          list.isFetching ? (
            '载入中…'
          ) : failed ? (
            <Button
              onClick={() => {
                void list.refetch();
                if (value) void selected.refetch();
              }}
            >
              载入失败，重试
            </Button>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配客户" />
          )
        }
        popupRender={(menu) => (
          <>
            {menu}
            <div className="select-pagination">
              <Space>
                <Button
                  size="small"
                  disabled={page <= 1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setPage((p) => p - 1)}
                >
                  上一页
                </Button>
                <span>
                  {page} / {Math.max(1, Math.ceil((list.data?.total ?? 0) / 20))}
                </span>
                <Button
                  size="small"
                  disabled={page * 20 >= (list.data?.total ?? 0)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </Space>
            </div>
          </>
        )}
      />
      {failed && (
        <Alert
          type="warning"
          title={selected.error ? '所选客户无法载入，请重新选择或重试' : '客户列表载入失败'}
        />
      )}
    </div>
  );
}
