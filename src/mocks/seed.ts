import type { Customer, Ticket } from '../contracts/types';
export type StoredTicket = Omit<Ticket, 'customerName'>;
export type Snapshot = { customers: Customer[]; tickets: StoredTicket[] };
const companies = [
  '青禾设计',
  '远山科技',
  '白鹭文化',
  '星河教育',
  '拾光工作室',
  '松间咖啡',
  '云帆物流',
  '北岸咨询',
  '知行软件',
  '木本家居',
  '澄明医疗',
  '禾野农业',
  '汇川设备',
  '微风出版',
  '和光传媒',
  '观澜贸易',
  '向山旅行',
  '鹿鸣音乐',
  '竹里空间',
  '平川制造',
  '南风食品',
  '明日零售',
  '蓝湾能源',
  '初见花艺',
  '朴石建筑',
];
const subjects = [
  '账号访问问题',
  '客户资料更新',
  '报表导出咨询',
  '通知设置调整',
  '数据同步确认',
  '使用流程咨询',
  '服务配置协助',
  '页面显示异常',
  '账单信息咨询',
];
export function createSeed(): Snapshot {
  const customers = companies.map((name, i): Customer => ({
    id: `cust-${String(i + 1).padStart(3, '0')}`,
    name,
    contactName: ['林女士', '陈先生', '周女士', '王先生', '赵女士'][i % 5],
    email: `contact${i + 1}@example.test`,
    notes: i % 2 ? '优先通过邮箱联系。' : '',
    createdAt: new Date(Date.UTC(2026, 9, 1, 9, i)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 9, 20, 10, i)).toISOString(),
  }));
  const tickets = Array.from({ length: 45 }, (_, i): StoredTicket => ({
    id: `ticket-${String(i + 1).padStart(3, '0')}`,
    title: `${subjects[i % subjects.length]} · ${i + 1}`,
    customerId: customers[i % 24].id,
    description: '客户反馈需要进一步协助，请核实相关信息并跟进处理结果。',
    priority: (['low', 'medium', 'high'] as const)[i % 3],
    status: (['pending', 'in_progress', 'completed'] as const)[Math.floor(i / 3) % 3],
    createdAt: new Date(Date.UTC(2026, 9, 22, 9, i)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 9, 23, 14, i)).toISOString(),
  }));
  return { customers, tickets };
}
