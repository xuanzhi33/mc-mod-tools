# Modrinth 本地模组管理工具

纯前端的 Minecraft 模组管理器。用浏览器原生 **File System Access API** 选择本地 `mods` 文件夹，自动计算 jar 的 SHA-1，通过 [Modrinth API](https://docs.modrinth.com/) 识别模组、检查更新并汇总安全信息。

**无后端、无上传**：jar 内容不出本机，只把哈希与项目 id 发送给 Modrinth。

## 特性

- **本地读取**：文件夹句柄存 IndexedDB，刷新页面无需重选
- **批量识别**：并发（限 4）计算 SHA-1 → `/version_files` → `/projects` → `/search`，每批 100 个
- **自动更新检查**：扫描末尾按 `加载器 + MC 版本` 调用 `/version_files/update`；已最新标绿，可更新标橙并显示新版本号
- **安全 / 信任信息**：作者申报披露、审核与变现状态、许可证与公开源码、官方精选、内置依赖、SHA-1 + VirusTotal 直查、时间线
- **工具栏**：搜索、文件总数、可更新数、加载器与 MC 版本下拉（自动推断，可手动改）
- **其它**：未识别文件标红、新发布（<3 天）与低下载（<10 万）橙色高亮、详情侧滑面板、中英文 i18n、深色模式

## 浏览器要求

需要支持 File System Access API 的 Chromium 浏览器（Chrome / Edge / Brave ≥ 86）。Firefox 与 Safari 会显示降级提示。

## 工作流程

1. 选择文件夹 → `showDirectoryPicker()`，递归列出 `.jar`
2. 并发（限 4）计算 SHA-1
3. `POST /v2/version_files`（批 100）：哈希 → 版本
4. `GET /v2/projects?ids=`（批 100）：项目详情
5. `GET /v2/search`（`project_id` facet，批 100）：作者 + 内容披露
6. 推断 profile：取已识别模组中出现最多的加载器与 MC 版本（并列时优先 fabric / 更新的版本）
7. `POST /v2/version_files/update`（按 profile 过滤）：检查更新
8. 切换加载器或 MC 版本会自动重查

扫描过程以阶段清单展示，可随时取消。

## 安全 / 信任面板

详情面板底部汇总，全部来自已获取的数据（**零额外请求**）：

- **风险提示**：被官方强制取消变现、项目/版本状态异常、`requested_status` 与当前状态冲突、始终开启的遥测、无源码且许可证不明确、打包内置依赖
- **作者申报披露**：遥测（含 always-active / opt-out）、系统交互、广告、癫痫触发、付费功能、AI 内容等 15 种
- 审核状态 · 通过时间、变现状态、许可证、公开源码、反馈渠道、所属组织、官方精选、运行环境、内置依赖
- **哈希校验**：SHA-1 + 一键跳转 VirusTotal

> 这些是「信号」而非「结论」：Modrinth API 不提供恶意软件扫描结果，披露内容也由作者自行申报。

## 技术栈

Vue 3 · TypeScript · Vite · Pinia · Tailwind CSS v4 · shadcn-vue (Reka UI) · vue-i18n · Vitest

## 开发

```sh
pnpm install
pnpm dev          # 开发服务器
pnpm build        # 类型检查 + 构建
pnpm test:unit    # 单元测试
pnpm lint         # ESLint
pnpm format       # Prettier
```

Node.js `^20.19.0 || >=22.12.0`。

## 代码结构

```
src/
├── lib/
│   ├── fs.ts          # File System Access API 封装 + 句柄持久化
│   ├── hash.ts        # SHA-1 计算
│   ├── modrinth.ts    # Modrinth API 客户端（分批查询）
│   ├── mc-version.ts  # MC 版本号比较
│   ├── progress.ts    # 扫描阶段与总进度
│   ├── update.ts      # 更新判定
│   ├── security.ts    # 披露风险等级等安全信号
│   ├── mod-status.ts  # 识别状态判定
│   └── format.ts      # 数字 / 字节 / 日期格式化
├── stores/mods.ts     # 扫描主流程与推断逻辑
├── views/HomeView.vue
├── components/mod/    # FolderPicker / ScanProgress / ModTable / ModDetailSheet / SettingsDialog / EmptyState
└── i18n/{zh,en}.json
```

---

## English

A local-first, front-end-only Minecraft mod manager. Choose your `mods` folder (File System Access API) and it:

- identifies every jar via SHA-1 (batched Modrinth API calls, 100 per request)
- checks for updates against the inferred loader + MC version (`/version_files/update`)
- surfaces safety/trust signals from project metadata and author disclosures, plus a SHA-1 → VirusTotal link

No backend; files never leave your machine (only hashes and project ids are sent to Modrinth). Requires a Chromium-based browser (≥ 86). Built with Vue 3, TypeScript, Vite, Pinia, Tailwind CSS v4, shadcn-vue and vue-i18n.
