import { useState } from 'react';
import { Alert, Form, Input, Select } from 'antd';
import { Link } from 'react-router-dom';
import type { Ticket, TicketCreate, TicketPatch } from '../../contracts/types';
import { ticketsApi } from '../../shared/api/resources';
import { FormDialog } from '../../shared/ui/FormDialog';
import { isDirty, useEditor } from '../../shared/ui/useEditor';
import { LIMITS, PRIORITY_LABELS, STATUS_LABELS, TRANSITIONS } from '../../shared/config';
import { CustomerSelect } from './CustomerSelect';
type Values = TicketCreate & { status?: TicketPatch['status'] };
export function TicketForm({ ticket, onClose }: { ticket?: Ticket; onClose: () => void }) {
  const [form] = Form.useForm<Values>();
  const [dirty, setDirty] = useState(false);
  const initial: Values = {
    title: ticket?.title ?? '',
    customerId: ticket?.customerId ?? '',
    description: ticket?.description ?? '',
    priority: ticket?.priority ?? 'medium',
    ...(ticket ? { status: ticket.status } : {}),
  };
  const editor = useEditor(
    form,
    (values) => (ticket ? ticketsApi.update(ticket.id, values) : ticketsApi.create(values)),
    onClose,
  );
  return (
    <FormDialog
      open
      title={ticket ? '编辑工单' : '新增工单'}
      dirty={dirty}
      submitting={editor.pending}
      onSubmit={editor.submit}
      onClose={onClose}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initial}
        disabled={editor.pending}
        onValuesChange={() => setDirty(isDirty(form.getFieldsValue(), initial))}
        requiredMark="optional"
      >
        {editor.error && (
          <Alert className="form-error" type="error" showIcon title={editor.error} />
        )}
        <Form.Item
          name="title"
          label="工单标题"
          rules={[
            { required: true, whitespace: true, message: '请填写工单标题' },
            { max: LIMITS.title },
          ]}
        >
          <Input autoFocus maxLength={LIMITS.title} placeholder="简要描述需要处理的问题" />
        </Form.Item>
        <Form.Item
          name="customerId"
          label="关联客户"
          rules={[{ required: true, message: '请选择客户' }]}
          extra={
            <span>
              尚无客户？
              <Link
                to="/customers"
                onClick={(e) => {
                  if (dirty && !window.confirm('离开会放弃未保存内容，确认继续？'))
                    e.preventDefault();
                }}
              >
                前往客户管理创建
              </Link>
            </span>
          }
        >
          <CustomerSelect disabled={editor.pending} />
        </Form.Item>
        <div className="form-grid">
          <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
            <Select
              options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          {ticket && (
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select
                options={[ticket.status, ...TRANSITIONS[ticket.status]].map((value) => ({
                  value,
                  label: STATUS_LABELS[value],
                }))}
              />
            </Form.Item>
          )}
        </div>
        <Form.Item
          name="description"
          label="问题描述"
          rules={[
            { required: true, whitespace: true, message: '请填写问题描述' },
            { max: LIMITS.description },
          ]}
        >
          <Input.TextArea
            rows={4}
            maxLength={LIMITS.description}
            showCount
            placeholder="补充问题背景和需要协助的内容"
          />
        </Form.Item>
      </Form>
    </FormDialog>
  );
}
