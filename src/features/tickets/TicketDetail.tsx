import { Descriptions, Drawer, Tag } from 'antd';
import type { Ticket } from '../../contracts/types';
import {
  formatTime,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../shared/config';
export function TicketDetail({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  return (
    <Drawer open title="工单详情" onClose={onClose} size={480}>
      <Descriptions
        column={1}
        layout="vertical"
        items={[
          { key: 'title', label: '工单标题', children: ticket.title },
          { key: 'customer', label: '关联客户', children: ticket.customerName },
          {
            key: 'status',
            label: '状态',
            children: (
              <Tag color={STATUS_COLORS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Tag>
            ),
          },
          {
            key: 'priority',
            label: '优先级',
            children: (
              <Tag color={PRIORITY_COLORS[ticket.priority]}>{PRIORITY_LABELS[ticket.priority]}</Tag>
            ),
          },
          {
            key: 'description',
            label: '问题描述',
            children: <span className="preserve-text">{ticket.description}</span>,
          },
          { key: 'created', label: '创建时间', children: formatTime(ticket.createdAt) },
          { key: 'updated', label: '更新时间', children: formatTime(ticket.updatedAt) },
        ]}
      />
    </Drawer>
  );
}
