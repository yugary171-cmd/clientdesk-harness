# SaaS 与 Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> 执行适配：以上是 writing-plans 技能的标准入口，不表示这些技能在当前环境已安装。执行前检查其可用性；用户选择执行方式后才进入实现。若缺失，报告缺失并取得对普通逐任务执行方式的确认，不冒称已使用。当前推荐由主代理在本会话串行实施；只有明确有益的独立子任务才委派。不得因模板要求自动提交、推送或创建 worktree。

**Goal:** 交付中文客户与工单管理后台及可重复验证的 AI 开发 Harness，支持两个模块完整 CRUD 和真实增量迭代演示。

**Architecture:** React SPA 通过业务 hooks 和类型化 fetch 客户端访问 HTTP，MSW 实现同一 OpenAPI 契约。页面不访问 Mock 仓库，公共组件不依赖业务页面；开发、测试和 CI 使用相同契约与固定种子。

**Tech Stack:** React、TypeScript、Vite、React Router、Ant Design、TanStack Query、MSW、OpenAPI 3.1、Vitest、Testing Library、Playwright、ESLint、GitHub Actions。辅助工具选 openapi-typescript 生成类型，Ajv 2020 与 ajv-formats 验证契约 Schema；OpenAPI 使用 JSON 文件以便直接导入，Schema 只使用兼容 JSON Schema 的关键字。

**Spec:** `docs/superpowers/specs/2026-10-30-saas-harness-design.md`（用户于 2026-10-30 同意进入下一步）。本计划已获批准并已实施。下方复选框保留原始行动提案，不事后改写实际执行顺序；八项任务的交付结果、实现调整和验证证据统一见 `docs/project-status.md`。

## Global Constraints

- 默认中文界面、单个演示组织、固定操作员。不实现真实登录、权限、多租户隔离、计费、附件、导入导出、仪表盘、审计历史或回收站。
- 不要求在线部署，不将演示入口描述为真实鉴权。
- 默认每页 20 条，可选 10、20、50；搜索或筛选改变后回到第一页。
- 时间传输使用 ISO 8601，按浏览器本地时区显示 YYYY-MM-DD HH:mm:ss。
- 本版本采用后写覆盖，不提供多人版本冲突保护或跨标签页事务保证。
- 不引入第二套 UI、表单或全局状态库。
- ID 和时间由服务端/Mock 生成；写入失败不得留下部分更新。
- 每项任务开始检查 Git 状态，保留无关改动；项目文件如需移除须移入旧内容/，不得直接删除。
- 不自动提交、推送、部署、删除 worktree 或创建私人 Wiki。任务末尾仅审查差异和记录结果，提交需另获明确授权。
- 测试只访问本地应用及隔离数据；配置改变导致此边界不成立时，先解决授权问题。
- 不保存原始提示词、完整对话、令牌或敏感请求响应。仅记录命令、结果、改动区域和风险。

## 文件布局与责任

```text
AGENTS.md / CLAUDE.md / RULES.md / README.md    Agent 入口、规范和使用说明
package.json / package-lock.json / .nvmrc     固定执行环境与依赖
src/app/{App,providers,bootstrap}.tsx          路由、Provider、Mock 启动边界
src/shared/ui/{DataTable,FormDialog,DeleteConfirm}.tsx
src/shared/api/{http,resources,cache}.ts       HTTP、资源方法、缓存键
src/shared/config.ts                         分页、显示和字段限制
src/contracts/{openapi.json,generated.ts,validate.ts}
src/mocks/{repository,seed,storage,scenarios,browser,node}.ts
src/mocks/handlers/{customers,tickets,index}.ts
src/features/customers/{CustomersPage,CustomerForm,CustomerDetail}.tsx
src/features/customers/queries.ts
src/features/tickets/{TicketsPage,TicketForm,TicketDetail,CustomerSelect}.tsx
src/features/tickets/queries.ts
src/demo/{DemoControls,initializeDemo}.tsx     仅在演示模式装载
scripts/{check-contract,check-boundaries,scan-secrets}.mjs
tests/{contracts,integration,e2e}/             HTTP 契约、组件、浏览器验证
docs/project-status.md                       唯一进度记录和真实迭代历史
.github/workflows/verify.yml                  CI 与本地共用检查入口
```

仓库目前只有设计文档且无首个提交；以上是待创建文件，不代表现有实现。组件局部测试可与组件同目录；基础工具配置按相应任务创建。不要提前生成空业务模块或空测试占位。

## Task 1：建立可运行应用壳和最小验证链

**Files:** 创建 package.json、锁文件、.nvmrc、.gitignore、index.html、Vite/TypeScript/ESLint/Vitest/Playwright 配置、src/main.tsx、src/app/App.tsx、src/app/providers.tsx、AGENTS.md、CLAUDE.md、RULES.md、README.md、docs/project-status.md、tests/e2e/shell.spec.ts。

**Interfaces:** `/customers`、`/tickets` 为列表路由，根路由重定向至客户；初始只实现导航壳。AppProviders 提供 Ant Design 中文配置及 QueryClient；业务写请求 retry=false。

- [ ] 检查 Git、Node/npm 可用版本和依赖兼容要求，选择满足所有依赖的受支持 Node LTS，记录精确 Node/npm 版本并固定锁文件；禁止脚手架覆盖已有 docs。
- [ ] 创建最小配置和应用入口，安装本地依赖；.gitignore 排除 node_modules、dist、测试报告、本地环境文件、.codex/wiki/。
- [ ] 写应用壳浏览器测试并运行，先验证缺少导航导致失败，再实现中文导航和固定演示身份。

```ts
import { test, expect } from '@playwright/test';
test('应用提供两个业务入口', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByRole('link', { name: '客户管理', exact: true })).toBeVisible();
  await page.getByRole('link', { name: '工单管理', exact: true }).click();
  await expect(page).toHaveURL(/\/tickets$/);
});
```

- [ ] 建立 npm scripts：dev、lint、typecheck、test（vitest run）、test:e2e、build。Playwright 使用独立本地端口 4173、reuseExistingServer=false，避免误连另一会话服务；端口占用时报错而非杀进程。
- [ ] README 写 npm ci、npm exec playwright install chromium、启动和测试命令；规则文件写依赖方向和用户授权边界，CLAUDE.md 只指向共同规则。
- [ ] 运行 npm run typecheck、npm run build、npm run test:e2e -- tests/e2e/shell.spec.ts；审查新增文件，更新唯一状态文档。

**完成标准：** 可启动并切换两个业务入口；检查失败确实返回非零状态；不把空壳称为业务完成。

## Task 2：锁定 HTTP 契约和客户端边界

**Files:** 创建 src/contracts/openapi.json、generated.ts、validate.ts，src/shared/api/http.ts、resources.ts、cache.ts，src/shared/config.ts，scripts/check-contract.mjs，tests/contracts/client.test.ts。

**Interfaces:** 从 generated.ts 导出 Customer、CustomerCreate、CustomerPatch、Ticket、TicketCreate、TicketPatch、CustomerList、TicketList、ApiErrorBody；CustomerPatch 和 TicketPatch 仅含可编辑字段。实现以下客户端，不允许调用方伪造未经校验的响应类型：

```ts
type ListParams = { q?: string; page?: number; pageSize?: 10 | 20 | 50 };
type TicketParams = ListParams & { customerId?: string; status?: Ticket['status'] };
// priority 查询参数在 Task 7 加入，实体字段从开始即存在。
// customersApi / ticketsApi 分别提供：
// list(params, signal?): Promise<CustomerList / TicketList>
// get(id, signal?): Promise<Customer / Ticket>
// create(input): Promise<Customer / Ticket>
// update(id, patch): Promise<Customer / Ticket>
// remove(id): Promise<void>
// ApiError extends Error，公开 status、code、fieldErrors。
// cacheKeys.customers(params)、cacheKeys.customer(id)、
// cacheKeys.tickets(params)、cacheKeys.ticket(id) 返回稳定查询键。
```

- [ ] 按规格写两个资源的十个操作及 Schema，包括字段长度、状态枚举、只读字段、422/404/409、分页默认值和 204。第一版不包含工单 priority 查询参数，避免伪造后续增量。
- [ ] 配置 openapi-typescript 生成类型；check-contract 在内存重新生成并与 checked-in 文件比较，差异退出非零，不重写产物。
- [ ] 运行时校验由同一 OpenAPI components.schemas 生成 Ajv validators；错误信息不包含完整响应体。先写以下边界测试并确认失败，再实现 fetch 封装和资源方法。

```ts
import { it, expect, vi } from 'vitest';
import { customersApi } from '../../src/shared/api/resources';
it('拒绝把非法响应当作空列表', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ items: null }), {
      headers: { 'Content-Type': 'application/json' },
    }),
  ));
  await expect(customersApi.list({ page: 1 })).rejects.toMatchObject({
    code: 'INVALID_RESPONSE',
  });
});
```

- [ ] 补充测试：204 不解析 JSON；422 字段错误保留；fetch 异常映射 NETWORK_ERROR；AbortError 原样传递；可选字段缺省合法；参数序列化不丢失中文。afterEach 使用 vi.unstubAllGlobals() 清理替身。
- [ ] apiBase 默认 /api，真实模式从 VITE_API_BASE_URL 读取；HTTP 超时 15 秒且同时尊重外部取消信号，超时报 TIMEOUT；无 Cookie/Token 假鉴权。
- [ ] 运行 npm run test -- tests/contracts/client.test.ts、类型生成漂移检查及 typecheck；审查接口定义并记录基线。

**完成标准：** 请求、响应和错误有单一契约来源，非法响应可观测，生成类型过期能被检查发现。

## Task 3：实现受约束 Mock 及隔离数据仓库

**Files:** 创建 src/mocks 下 repository.ts、seed.ts、storage.ts、handlers/customers.ts、handlers/tickets.ts、handlers/index.ts、node.ts，tests/contracts/resources.test.ts。

**Interfaces:** createRepository({ seed, clock, idFactory }) 返回仓库；seed 为 {customers, tickets}，clock: () => string，idFactory: () => string。仓库公开 list/get/create/update/removeCustomer 和 list/get/create/update/removeTicket、snapshot()、reset()。createHandlers(repository) 产生全部 API 处理器；每个测试构造独立仓库。仓库不持有 localStorage。

- [ ] 写固定种子：25 个客户、45 个工单、三种状态与优先级，以及一个无工单客户。日期和 ID 固定；新资源才使用 UUID 和当前时间。
- [ ] 先写 HTTP 层关联删除测试，验证无实现时失败，再实现仓库、Schema 请求校验和处理器。

```ts
import { it, expect } from 'vitest';
import { customersApi, ticketsApi } from '../../src/shared/api/resources';
it('有关联工单禁止删除客户，清除关联后允许删除', async () => {
  const customer = await customersApi.create({
    name: '测试客户', contactName: '测试联系人', email: 'qa@example.test',
  });
  const ticket = await ticketsApi.create({
    title: '测试工单', customerId: customer.id, description: '描述', priority: 'medium',
  });
  await expect(customersApi.remove(customer.id)).rejects.toMatchObject({ status: 409 });
  await ticketsApi.remove(ticket.id);
  await expect(customersApi.remove(customer.id)).resolves.toBeUndefined();
});
```

- [ ] 测试 setup 使用 MSW setupServer 和每测独立 createHandlers；测试客户端 API 地址设为 http://localhost/api，所有 /api 请求未匹配即失败，afterEach resetHandlers，afterAll close。
- [ ] 实现去空格/大小写无关搜索、组合筛选、稳定排序和分页；不存在返回 404，非法字段/参数返回 422，非法状态和关联删除返回 409。
- [ ] 写入先校验完整候选对象再一次替换；客户不存在拒绝工单新增/改绑；customerName 在读取时关联生成。
- [ ] 添加参数化测试覆盖全部状态转换、重复名称允许、PATCH 保留省略字段、失败前后 snapshot 相同、客户改名、非法分页和超过末页返回空 items 且保留 total。
- [ ] 运行 npm run test -- tests/contracts/resources.test.ts、typecheck；记录 HTTP 层已验证而 UI 尚未接入。

**完成标准：** 两个资源全部 CRUD 在 HTTP 层通过测试，无关联破坏和部分写入。

## Task 4：完成 Mock 启动、持久化与演示控制

**Files:** 创建/修改 src/app/bootstrap.tsx、src/main.tsx、src/mocks/storage.ts、browser.ts、scenarios.ts、src/demo/initializeDemo.tsx、DemoControls.tsx、public/mockServiceWorker.js、tests/integration/storage.test.ts、tests/e2e/demo.spec.ts。

**Interfaces:** initializeDemo(): Promise<{ reset(): Promise<void>; setScenario(mode): void; dispose(): Promise<void> }>；mode 为 normal / slow / error-once / empty-lists。初始化只在应用启动层导入；业务页面不得使用该接口。

- [ ] 给 storage adapter 写测试：有效快照恢复、损坏和不兼容版本不覆盖、setItem 抛错、重置需显式调用。
- [ ] 使用键 saas-harness.demo.v1 存储带 version 的快照；对恢复数据做 Schema 和关联完整性检查。初始化异常由演示启动页提示，可确认重置，或进入明确标记的内存模式。
- [ ] 使用 MSW 官方 init 命令生成 worker 文件；await 初始化后再 render React。dev 默认为 Mock；build:demo 显式设置 VITE_ENABLE_MOCK=true；普通 build 默认为真实模式。
- [ ] 真实模式仅注销路径匹配本应用 mockServiceWorker.js 的 registration；若当前页面仍被旧 worker 控制，至多重载一次，仍受控制则显示错误，不开始业务请求。不得清理其他 Service Worker。
- [ ] 演示控制独立显示“演示环境”、场景选择和重置按钮。slow 为固定 1.5 秒延迟；error-once 仅下个 API 请求返回 503 后恢复；empty-lists 仅覆盖 GET 列表。reset 清空 QueryClient 后恢复种子和 normal。
- [ ] 对本应用 /api 未匹配处理器返回明确错误，不透传网络；非 API 静态资源放行。测试通过拦截器阻止非本地请求。
- [ ] 运行 storage 测试及 demo E2E：重置前确认、取消不改变数据、刷新持久化、错误场景恢复、模式提示；客户 UI 尚未完成时通过本地页面 fetch API 验证持久化。

```ts
import { test, expect } from '@playwright/test';
test('演示标识可见', async ({ page }) => {
  await page.goto('/customers');
  await expect(page.getByText('演示环境', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '重置演示数据' })).toBeEnabled();
});
```

**完成标准：** 不发生启动竞争；异常存储不被静默覆盖；真实模式不残留有效 Mock。

## Task 5：客户纵向闭环与公共交互

**Files:** 创建 shared/ui 三个公共组件及局部测试，features/customers 全部文件，tests/e2e/customers.spec.ts；修改 App.tsx。

**Interfaces:** DataTable<T> 接受 rows、columns、rowKey、loading、error、emptyDescription、pagination、onRetry；分页由页面控制。FormDialog 接受 open、title、dirty、submitting、onSubmit、onClose、children。DeleteConfirm 接受 open、entityLabel、pending、error、onConfirm、onCancel。customers queries 只调用 customersApi 与 cacheKeys。

- [ ] 客户表单使用 Ant Design Form；以初始规范化值比较判断 dirty，保存成功清除 dirty。加载另一记录时 resetFields 并填入新值。
- [ ] 先写公共交互测试：双击提交只调用一次、失败保留输入、脏表单关闭确认、取消关闭继续编辑；再实现组件。测试挂载于 AppProviders 并使用 userEvent 驱动，不测试内部 state。
- [ ] 编写客户 CRUD E2E 后实现列表、详情 Drawer、表单弹窗、删除确认；详情“查看关联工单”链接为 /tickets?customerId=<id>。

```ts
import { test, expect } from '@playwright/test';
test('新增客户可以查询并查看详情', async ({ page }) => {
  await page.goto('/customers');
  await page.getByRole('button', { name: '新增客户' }).click();
  const dialog = page.getByRole('dialog', { name: '新增客户' });
  await dialog.getByLabel('客户名称', { exact: true }).fill('演示客户');
  await dialog.getByLabel('联系人', { exact: true }).fill('林女士');
  await dialog.getByLabel('邮箱', { exact: true }).fill('lin@example.test');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'lin@example.test' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: '详情', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '客户详情' })).toBeVisible();
});
```

- [ ] 搜索输入 300ms 防抖；URL 保存 q、page、pageSize，非法 URL 值归一到默认并 replace；筛选变化重置页码。useQuery 接收 signal，变更成功使客户和工单缓存均失效。
- [ ] 列表删除后按 total 计算合法最大页并修正；422 显示字段错误，409 保持删除框并显示原因，404 关闭失效表单/确认框并刷新。
- [ ] 添加空/失败/重试、删除末条页码恢复和快速查询切换集成测试；GET 失败不隐式自动重试，交由重试入口控制。
- [ ] 运行公共组件与客户相关测试、typecheck 和 lint；在正常及 390px 宽度检查表单、表格、焦点恢复。

**完成标准：** 客户 CRUD 含失败路径可操作，公共组件具备真实消费者，数据刷新正确。

## Task 6：工单 CRUD、关联选择和状态流转

**Files:** 创建 features/tickets 全部文件、tests/e2e/tickets.spec.ts、tests/integration/customer-select.test.ts；修改 App.tsx。

**Interfaces:** TicketForm 消费 TicketCreate/TicketPatch；CustomerSelect props 为 value?: string、onChange(id: string): void、disabled?: boolean。客户选项使用 shared/api 的 customersApi，不导入 customers feature。工单 URL 参数 q、customerId、status、page、pageSize。

- [ ] 先写 CustomerSelect 测试：超过第一页的客户可搜索/翻页、已选项不在列表时 get(id) 回填、不存在客户显示失效提示。使用受控 Select 配合独立分页控件，避免假设一次返回全部客户。
- [ ] 实现工单表单：新建 pending，编辑只显示当前及合法后继状态；创建无客户时给出跳转客户管理的入口。
- [ ] 复用三个公共组件实现列表、详情、编辑、删除；优先级字段此时存在，但筛选栏尚无优先级筛选。
- [ ] 写关联流程 E2E：创建客户与工单、编辑内容、pending→in_progress→completed→in_progress、关联客户无法删除、删除工单后删除客户。
- [ ] 增加客户改名同步、已选客户回显、工单记录消失及客户提交前消失的回归。所有测试用隔离种子或自建数据，无固定跨测试 ID 依赖。

```ts
import { it, expect } from 'vitest';
import { ticketsApi } from '../../src/shared/api/resources';
// 放入采用 Task 3 MSW 测试 fixture 的测试文件；cust-001 是固定种子客户。
it('不允许待处理工单直接完成', async () => {
  const ticket = await ticketsApi.create({
    title: '状态验证', description: '检查非法流转', customerId: 'cust-001', priority: 'low',
  });
  await expect(ticketsApi.update(ticket.id, { status: 'completed' }))
    .rejects.toMatchObject({ status: 409 });
  await expect(ticketsApi.get(ticket.id)).resolves.toMatchObject({ status: 'pending' });
});
```

- [ ] 运行工单与选择器测试、客户回归、typecheck、lint；更新阶段状态，记录基础 CRUD 的真实通过/失败结果。

**完成标准：** 两业务模块完整闭环并实际复用；客户关联和状态约束不能通过直接 HTTP 绕过。

## Task 7：执行真实增量需求——优先级筛选

**Files:** 修改 openapi.json、generated.ts、resources.ts、tickets handler、TicketsPage.tsx、queries.ts、契约测试及工单 E2E；更新 docs/project-status.md 的历史区。

**Interfaces:** TicketParams 增加 priority?: Ticket['priority']；所有查询键和 URL 同步包含 priority。无筛选时参数省略，不发送空枚举。

- [ ] 在状态文档记录真实基线和本次需求，不编造原始提示词或未发生的失败。
- [ ] 增加“高优先级筛选只返回 high”契约测试，先运行观察失败，再更新契约、生成类型、Mock 过滤与客户端参数。

```ts
import { it, expect } from 'vitest';
import { ticketsApi } from '../../src/shared/api/resources';
it('优先级筛选返回匹配数据', async () => {
  const result = await ticketsApi.list({ priority: 'high', page: 1, pageSize: 20 });
  expect(result.total).toBeGreaterThan(0);
  expect(result.items.every(item => item.priority === 'high')).toBe(true);
});
```

- [ ] 加入优先级 Select，URL 与 queryKey 带入 priority；选择后回第一页，清空后恢复未筛选结果。
- [ ] 补充与客户、状态组合筛选、刷新恢复 URL、清空筛选、非法枚举 422、快速切换不出现过期结果的测试。
- [ ] 执行契约漂移检查、相关测试及类型检查，再跑受影响 CRUD 回归；在历史区记录实际命令、结果、影响范围和人工审查结论。

**完成标准：** 功能与验证同步交付，迭代记录可追溯且不伪造过程。

## Task 8：加固 Harness 并完成交付验收

**Files:** 创建 scripts/check-boundaries.mjs、scan-secrets.mjs、.github/workflows/verify.yml；完善 package scripts、ESLint、README、docs/project-status.md、tests/e2e/regressions.spec.ts。

**Interfaces:** verify 串行运行 lint、typecheck、test、build:demo、test:e2e；build:demo 内部调用同一 build 管线，仅显式启用 Mock。lint 包含模块边界检查，typecheck 前包含契约漂移检查。失败立即以非零状态结束，不吞错误。

- [ ] 通过 TypeScript 编译器解析导入及解析后的文件位置检查依赖方向，覆盖相对路径、别名、动态 import 和 re-export；仅 app/bootstrap、demo 可进入 mocks。仓库相关脚本和测试不适用业务导入限制。
- [ ] 给边界检查器传内存样例测试，证明跨 feature 内部导入和 shared→feature 会失败，合法 shared/api 导入可通过；不创建再删除违规项目文件。
- [ ] scan-secrets 只扫描待交付源文件和文档，排除依赖、构建产物及锁文件；报告文件和行号而不输出命中值，检测私钥标记和常见 token 格式，并说明此扫描不保证发现所有秘密。
- [ ] CI 固定与本地相同 Node/npm，执行 npm ci、安装 Chromium、npm run verify、密钥扫描；失败时保存 Playwright 报告，不记录原始 API 内容。未推送运行前状态标为“CI 配置已完成，远端未验证”。
- [ ] 最终 E2E 在 build:demo 生成的本地预览上运行，确保不是只验证 dev server；禁止连接非本地业务服务。
- [ ] 按规格覆盖清单逐项人工检查窄屏、键盘、焦点、控制台、存储异常、刷新持久化以及真实模式 worker 清理；真实后端和生产鉴权仍明确未验证。
- [ ] README 写新环境启动、Mock/真实模式切换、重置、脚本、已知限制，以及 5–8 分钟演示顺序：客户 CRUD → 工单与关联约束 → 异常恢复 → 优先级增量证据 → verify。
- [ ] 执行一次完整 npm run verify 和 npm run build（真实模式构建）；配置未改且通过的检查不重复运行。失败修复后仅重跑受影响检查，必要时再完整验证。
- [ ] 最终审查 scoped diff。仓库无 HEAD 时以 git status 和新增文件内容为依据，不能用空的 git diff 冒充已审查全部变更。执行空白检查和密钥扫描，输出真实验证结果和剩余限制。

**完成标准：** 本地完整验收通过、交付可复现、限制准确；未获授权不提交或推送。线上 CI、部署和面试方验收各自独立，不因本地通过宣称完成。

## 覆盖与执行顺序

| 规格要求 | 对应任务 |
| --- | --- |
| 范围、环境及交付 | 1、8 |
| 客户 CRUD | 3、5 |
| 工单 CRUD、关联及状态 | 3、6 |
| 公共交互与异常 | 2、4、5、6、8 |
| 架构、组件与依赖边界 | 1、2、5、6、8 |
| 接口、运行时校验和协作 | 2、3、7 |
| 持久化、隔离、场景和 worker | 3、4、8 |
| Harness 与真实增量记录 | 1、7、8 |
| 验证与演示 | 每任务局部验证，8 最终验收 |

顺序为 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8。按主代理串行实施最易保持边界一致；如用户选择委派，仓库检查、独立审阅或已稳定接口下的局部测试可独立分派，但不得并发写同一文件、共享测试存储或构建输出。

## 当前审批与历史

- 2026-10-30：用户确认正式设计，授权进入实施计划编写；未授权业务实现、Git 提交或推送。
- 计划自查：规格映射、类型命名、阶段依赖、Mock 与真实模式、测试隔离和真实增量边界已检查。实施任务均未执行。
- 计划编写阶段的下一步为审阅与选择执行方式；用户随后明确选择方案 1，由主代理在本会话实施。

- 2026-10-30：八项任务的功能与 Harness 交付已完成，本地验证通过；实际阶段历史与剩余限制见 docs/project-status.md，不将 Git 提交或远端 CI 算作已完成。
