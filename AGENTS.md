# AGENTS.md

给 AI 编码代理的补充约定。项目背景、功能与开发命令见 `README.md`，此处不重复。

## 硬性要求

- **每次改动都要同步更新 `README.md`**（功能、工作流程、代码结构等发生变化时）。
- 提交信息使用**中文** Conventional Commits（`feat:` / `fix:` / `refactor:` / `perf:` / `docs:`）。
- 所有面向用户的文案必须走 `src/i18n/zh.json` 与 `src/i18n/en.json`，且两份 key 完全一致。
- 不要提交截图等临时文件（如 `image*.png`）。

## 提交前检查

```sh
npx prettier --write <改动过的文件>   # 只格式化改动文件；勿全量 pnpm format（仓库有大量历史未格式化文件）
pnpm build                            # vue-tsc + vite build
npx eslint <改动过的文件>             # 仓库存在既有的 ui/ 组件告警，勿引入新告警
```

## 约定

- 代码注释用中文。
- 尽量不新增依赖，优先复用 `src/lib/` 中的既有工具。
- 调用 Modrinth 接口沿用现有节奏：每批 100 个、批间 `sleep(120)`。
