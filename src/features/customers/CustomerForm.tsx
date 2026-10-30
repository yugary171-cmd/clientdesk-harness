import { useState } from 'react';
import { Alert, Form, Input } from 'antd';
import type { Customer, CustomerCreate } from '../../contracts/types';
import { customersApi } from '../../shared/api/resources';
import { FormDialog } from '../../shared/ui/FormDialog';
import { isDirty, useEditor } from '../../shared/ui/useEditor';
import { LIMITS } from '../../shared/config';
export function CustomerForm({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const [form] = Form.useForm<CustomerCreate>();
  const [dirty, setDirty] = useState(false);
  const initial = {
    name: customer?.name ?? '',
    contactName: customer?.contactName ?? '',
    email: customer?.email ?? '',
    notes: customer?.notes ?? '',
  };
  const editor = useEditor(
    form,
    (values) => (customer ? customersApi.update(customer.id, values) : customersApi.create(values)),
    onClose,
  );
  return (
    <FormDialog
      open
      title={customer ? '编辑客户' : '新增客户'}
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
          name="name"
          label="客户名称"
          rules={[
            { required: true, whitespace: true, message: '请填写客户名称' },
            { max: LIMITS.name },
          ]}
        >
          <Input autoFocus maxLength={LIMITS.name} placeholder="例如：青禾设计" />
        </Form.Item>
        <Form.Item
          name="contactName"
          label="联系人"
          rules={[
            { required: true, whitespace: true, message: '请填写联系人' },
            { max: LIMITS.contactName },
          ]}
        >
          <Input maxLength={LIMITS.contactName} placeholder="客户联系人姓名" />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请填写邮箱' },
            { type: 'email', message: '请填写有效邮箱' },
            { max: LIMITS.email },
          ]}
        >
          <Input maxLength={LIMITS.email} placeholder="name@company.com" />
        </Form.Item>
        <Form.Item name="notes" label="备注" rules={[{ max: LIMITS.notes }]}>
          <Input.TextArea
            rows={3}
            maxLength={LIMITS.notes}
            showCount
            placeholder="补充客户信息（选填）"
          />
        </Form.Item>
      </Form>
    </FormDialog>
  );
}
