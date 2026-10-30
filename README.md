# ClientDesk · 客户与工单管理

React SaaS 后台面试作品：两个关联业务模块、共享表格/表单交互、契约驱动的 HTTP Mock，以及 Claude Code / Codex 都可使用的开发 Harness。

## 运行

环境：Node **24.19.0**、npm **11.17.0**（分别由 `.nvmrc` 与 `packageManager` 固定）。

```bash
nvm use
npm ci
npm run dev
```

打开终端打印的本地地址。开发模式默认启用 MSW，无须后端、账号或密钥。客户与工单数据均为虚构，并保存在当前浏览器的 localStorage 中。右上角“演示环境”可切换固定异常场景，或确认后重置数据。

首次安装依赖与浏览器需要网络，运行应用和测试不依赖第三方业务服务。

## 验证与构建

```bash
npm exec playwright install chromium
npm run verify
```

`verify` 串行执行静态与架构边界检查、契约类型漂移检查、TypeScript、单元/集成测试、演示构建、Chromium E2E 和常见密钥模式扫描。测试使用隔离仓库/浏览器上下文，不改动个人演示数据。E2E 固定本地端口 4173，端口占用会报错，不接管已有服务。

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 开发演示（MSW） |
| `npm run lint` | ESLint 与模块依赖边界 |
| `npm run typecheck` | 契约漂移 + TypeScript |
| `npm run test` | Vitest + 架构检查器自测 |
| `npm run build:demo` | 显式带 Mock 的静态演示构建 |
| `npm run preview` | 预览 dist，地址 http://127.0.0.1:4173 |
| `npm run test:e2e` | 测试已生成的演示构建，先运行 build:demo |
| `npm run build` | 默认不启用 Mock 的真实 API 模式构建 |
| `npm run contract:generate` | 从 OpenAPI 生成类型 |
| `npm run contract:check` | 只读检查生成类型是否过期 |
| `npm run scan:secrets` | 常见密钥格式扫描（不替代安全审计） |

在 Linux CI 安装浏览器使用 `npm exec playwright install -- --with-deps chromium`。GitHub Actions 使用相同 verify 流程，配置存在不代表远端已通过。

## 功能

- 客户：搜索、分页、新增、详情、编辑、删除；关联工单存在时禁止删除。
- 工单：CRUD、客户搜索与分页选择、状态/客户/优先级组合筛选；合法状态流转及重新打开。
- 公共交互：加载、无数据、无结果、失败重试、字段校验、未保存确认、重复提交保护、删除后页码恢复。
- URL 保留查询条件；客户改名同步到工单；损坏存储不静默覆盖，可选择重置或内存模式。
- 桌面侧边导航、窄屏横向表格、可访问表单及键盘弹窗操作。

## 架构与接口协作

```text
features（页面 / 查询 hooks）
  ↓
shared/ui + shared/api
  ↓
HTTP /api/customers 与 /api/tickets
  ↓
MSW（隔离仓库 + 固定种子）或真实后端
```

`src/contracts/openapi.json` 是接口事实来源；生成 TypeScript 类型，运行时由同一 Schema 校验响应。禁止业务页面直接读 Mock/localStorage，禁止 feature 互相导入内部文件；这些边界由 scripts/check-boundaries.mjs 实际检查。

后端协作：修改 OpenAPI → 生成类型 → 更新 Mock 与契约测试 → 更新前端 → 执行验证。真实后端只需遵守同一 HTTP 契约；分页从 1 开始，默认每页 20 条，422/404/409 分别表达字段错误、记录不存在和业务冲突。

## 真实 API 模式

将 `.env.example` 的配置填入本地 `.env.local`（不提交本地环境文件）：

```dotenv
VITE_ENABLE_MOCK=false
VITE_API_BASE_URL=/api
```

同源 `/api` 需要服务器反向代理；也可以设置完整后端地址并由后端正确配置 CORS。`VITE_` 变量会进入前端包，不能放密钥。重启开发服务器或重新构建后生效。

启动会注销本应用注册的 `mockServiceWorker.js`；如页面仍被旧 worker 控制，最多自动刷新一次，再失败则提示用户。不会清理其他 worker。真实后端、生产鉴权、CORS、部署和多人并发不属于已交付演示能力。

## Harness 与 AI 使用方法

Claude Code 先读 CLAUDE.md，Codex 先读 AGENTS.md；两者共用 RULES.md、设计规格、实施计划及状态记录。完成标准是实际运行结果，不是生成文件数量。

建议任务指令：阅读项目规则与契约，界定本次修改范围，先补对应测试，再修改实现，运行受影响检查，最后报告差异、证据和未验证事项。不要绕过接口直接修改演示仓库。

真实增量需求为“工单优先级筛选”。它在基础 CRUD 验证后加入，经历了返回 422 的失败测试和契约/Mock/UI 同步修改；脱敏过程与最终证据统一见 `docs/project-status.md`。

设计：`docs/superpowers/specs/2026-10-30-saas-harness-design.md`。
实施计划：`docs/superpowers/plans/2026-10-30-saas-harness.md`。

## 5–8 分钟演示顺序

1. 新增客户、编辑、查看详情，展示刷新后仍保留。
2. 为客户创建工单，完成状态流转，说明公共组件如何复用。
3. 尝试删除有关联工单的客户，展示失败提示和约束。
4. 使用工单筛选，切换一次失败场景并重试。
5. 展示 OpenAPI、边界检查、迭代记录和 verify 输出。
6. 说明真实后端替换入口与范围限制。

## 已知边界

这是单组织、固定操作员的本地演示；无真实登录、权限或租户隔离，不是生产 SaaS。浏览器数据不跨设备同步，不保证跨标签页事务一致；多人编辑采用后写覆盖。写请求失败不自动重试；无服务端幂等键，生产接入需补充网络超时后的写入确认策略。无回收站、审计历史、附件、计费及导入导出。

删除仅影响虚构业务记录；项目源文件的移除遵循 AGENTS.md，转入旧内容/。Git 提交、推送与部署需明确授权。

当前默认构建有主包大于 500 kB 的体积提示（约 1.30 MB，gzip 408 kB），已通过构建产物的浏览器测试；未宣称完成生产性能优化。最终验证证据与未验证范围见 `docs/project-status.md`。
