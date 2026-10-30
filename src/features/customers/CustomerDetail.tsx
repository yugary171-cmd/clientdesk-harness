import { Button, Descriptions, Drawer } from 'antd';
import { Link } from 'react-router-dom';
import type { Customer } from '../../contracts/types';
import { formatTime } from '../../shared/config';
export function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  return (
    <Drawer
      open
      title="客户详情"
      onClose={onClose}
      size={480}
      extra={
        <Link to={`/tickets?customerId=${encodeURIComponent(customer.id)}`}>
          <Button type="primary">查看关联工单</Button>
        </Link>
      }
    >
      <Descriptions
        column={1}
        layout="vertical"
        items={[
          { key: 'name', label: '客户名称', children: customer.name },
          { key: 'contact', label: '联系人', children: customer.contactName },
          { key: 'email', label: '邮箱', children: customer.email },
          {
            key: 'notes',
            label: '备注',
            children: <span className="preserve-text">{customer.notes || '—'}</span>,
          },
          { key: 'created', label: '创建时间', children: formatTime(customer.createdAt) },
          { key: 'updated', label: '更新时间', children: formatTime(customer.updatedAt) },
        ]}
      />
    </Drawer>
  );
}
