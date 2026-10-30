# 项目规则

## 业务与边界

客户与工单是两个独立功能模块。客户存在任意关联工单时禁止删除；状态流转为待处理→处理中→已完成，以及已完成→处理中。没有真实鉴权或租户隔离，不宣称生产可用。

## 架构约束

- 页面 → 业务 hooks → shared/api → HTTP → Mock/后端。
- features 不导入另一 feature 内部实现；共享客户选择通过 shared/api 调用。
- shared 不依赖 features/app；业务代码不导入 mocks/demo，不读写本地数据仓库。
- 仅 app/bootstrap 与 demo 可以进入 Mock 边界。静态边界检查覆盖别名解析、动态 import 及 re-export。
- 复用 Ant Design 与其图标；DataTable、FormDialog、DeleteConfirm 统一交互，业务保留字段和规则。
- 对缺失、非法和过期数据显示可恢复错误；不得把契约异常吞成空列表。

## 接口变更流程

先更新 src/contracts/openapi.json，再 npm run contract:generate，然后更新 Mock、请求层、UI 与测试。npm run contract:check 验证生成产物一致；运行时通过相同 Schema 校验响应。不得直接编辑 generated.ts。

## 数据与测试安全

演示持久化只使用 saas-harness.demo.v1；数据均为虚构。测试使用独立仓库或新浏览器上下文。禁止测试访问外部业务 API；依赖/浏览器安装需要下载，但业务验证离线本地执行。损坏存储不得静默覆盖，重置必须经确认。

## 完成标准

功能与边界用例通过，类型/静态检查/契约漂移/构建/E2E 均有有效证据；最终检查 npm run verify、git diff --check 和新增文件内容。常见密钥扫描不等于全面安全审计。CI 配置、本地通过、远端 CI 通过、发布和真实后端验收分别报告。

版本由 .nvmrc、packageManager 和锁文件固定。禁止用 --force 或 --legacy-peer-deps 隐藏依赖冲突。
