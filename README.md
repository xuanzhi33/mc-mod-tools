# Vue 3 项目模板 / Vue 3 Project Template

[English](#english) | [中文](#chinese)

---

<a name="english"></a>

## 📖 English Documentation

A modern, production-ready Vue 3 template with TypeScript, Tailwind CSS, and a comprehensive UI component library. This template provides a solid foundation for building scalable web applications with best practices and developer-friendly tooling.

### ✨ Features

#### Core Framework & Build Tools
- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Type-safe development experience
- **Vite** - Next-generation frontend build tool with lightning-fast HMR
- **Vue DevTools** - Integrated debugging tools for development

#### State Management & Routing
- **Vue Router** - Official routing solution with hash-based navigation
- **Pinia** - Intuitive, type-safe state management
  - Settings store with persistent localStorage integration
  - Reactive state management with composition API

#### Internationalization
- **Vue I18n** - Complete i18n solution
  - Built-in English and Simplified Chinese support
  - Automatic language detection based on browser preferences
  - Easy to extend with additional languages

#### UI & Styling
- **Tailwind CSS v4** - Utility-first CSS framework
  - Custom theme configuration with CSS variables
  - Dark mode support with system preference detection
  - Responsive design utilities
- **Shadcn Vue** - High-quality, accessible component library
  - 30+ pre-built UI components
  - Customizable with Tailwind CSS
  - Based on Reka UI (formerly Radix Vue)
- **Lucide Icons** - Beautiful, consistent icon library
- **Class Variance Authority** - Type-safe component variants
- **tw-animate-css** - Animation utilities for Tailwind

#### Developer Experience
- **ESLint** - Code linting with Vue and TypeScript support
- **Prettier** - Zero-configuration code formatter
- **EditorConfig** - Consistent coding styles across editors
- **Vitest** - Fast unit testing framework
- **Vue Test Utils** - Official testing utilities for Vue components

#### Advanced Features
- **@vueuse/core** - Collection of essential Vue composition utilities
- **@tanstack/vue-table** - Headless table component for building powerful data grids
- **Vue Input OTP** - One-time password input component
- **Vue Sonner** - Beautiful toast notifications

### 📁 Project Structure

```
template-vue/
├── src/
│   ├── assets/          # Static assets and global styles
│   │   └── main.css     # Tailwind CSS configuration and theme
│   ├── components/      # Reusable components
│   │   ├── settings/    # Settings-related components
│   │   │   └── SettingsItem.vue
│   │   └── ui/          # Shadcn Vue UI components (30+ components)
│   ├── i18n/            # Internationalization
│   │   ├── config.ts    # i18n configuration
│   │   ├── en.json      # English translations
│   │   └── zh.json      # Chinese translations
│   ├── lib/             # Utility functions
│   │   └── utils.ts     # Common utilities (cn function for class merging)
│   ├── router/          # Vue Router configuration
│   │   └── index.ts     # Route definitions
│   ├── stores/          # Pinia stores
│   │   └── settings.ts  # App settings store (theme, language)
│   ├── views/           # Page components
│   │   ├── HomeView.vue     # Home page
│   │   └── SettingsView.vue # Settings page
│   ├── App.vue          # Root component
│   └── main.ts          # Application entry point
├── public/              # Static files served as-is
├── .vscode/             # VS Code workspace settings
├── components.json      # Shadcn Vue configuration
├── vite.config.ts       # Vite configuration
├── vitest.config.ts     # Vitest configuration
├── tsconfig.json        # TypeScript configuration
├── eslint.config.ts     # ESLint configuration
└── package.json         # Project dependencies and scripts
```

### 🎨 Key Implementation Details

#### Theme System
- **Dark Mode**: Automatic detection of system preferences with manual override
- **Color Modes**: Light, Dark, and System (follows OS settings)
- **Persistent Settings**: User preferences saved to localStorage with `xuanzhi33-` prefix
- **Dynamic Theme Switching**: Real-time theme updates without page reload

#### Settings Management
The template includes a complete settings system:
- Color mode selection (Light/Dark/System)
- Language selection (English/Chinese)
- Browser preference detection
- Persistent storage using localStorage
- Reactive updates using Vue's composition API

#### Routing
- Hash-based routing for better compatibility with static hosting
- Two pre-configured routes:
  - `/` - Home page
  - `/settings` - Settings page

### 🚀 Getting Started

#### Prerequisites
- Node.js: `^20.19.0 || >=22.12.0`
- pnpm (recommended package manager)

#### Installation

```sh
# Clone the repository
git clone <repository-url>
cd template-vue

# Install dependencies
pnpm install
```

#### Development

```sh
# Start development server with hot-reload
pnpm dev

# The application will be available at http://localhost:5173
```

#### Building for Production

```sh
# Type-check, compile and minify for production
pnpm build

# Preview production build locally
pnpm preview
```

#### Code Quality

```sh
# Lint and fix code issues
pnpm lint

# Format code with Prettier
pnpm format

# Run type checking
pnpm type-check
```

#### Testing

```sh
# Run unit tests
pnpm test:unit

# Run tests in watch mode
pnpm test:unit --watch
```

### 🛠️ Recommended IDE Setup

**IDE**: [VS Code](https://code.visualstudio.com/)

**Essential Extensions**:
- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue language support (disable Vetur if installed)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) - i18n support (optional)

The project includes VS Code workspace settings that automatically:
- Enable format on save
- Configure file nesting for better organization
- Set up i18n Ally for translation management

### 🌐 Browser Extensions (Recommended)

**Chromium-based browsers** (Chrome, Edge, Brave):
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Turn on Custom Object Formatter](http://bit.ly/object-formatters)

**Firefox**:
- [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [Turn on Custom Object Formatter](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

### 📝 TypeScript Support

TypeScript cannot handle type information for `.vue` imports by default. This template uses:
- **vue-tsc** for type checking (instead of `tsc`)
- **Volar** for IDE support (.vue type awareness)

### 🎯 Configuration

#### Vite Configuration
- Base path set to `./` for flexible deployment
- Path alias `@` mapped to `src/`
- Vue DevTools plugin enabled in development
- Tailwind CSS plugin integrated

#### Tailwind CSS
- Custom theme with CSS variables
- Dark mode variant support
- Neutral color palette as base
- Animation utilities included

#### Component Library (Shadcn Vue)
- Style: `new-york`
- Base color: `neutral`
- Icons: Lucide Vue Next
- CSS variables enabled for theming

### 🔧 Customization

#### Adding New Languages
1. Create a new JSON file in `src/i18n/` (e.g., `fr.json`)
2. Import and add it to `src/i18n/config.ts`
3. Update language options in translation files

#### Adding New Components
```sh
# Using Shadcn Vue CLI to add components
npx shadcn-vue@latest add [component-name]
```

#### Modifying Theme Colors
Edit `src/assets/main.css` and update the CSS variable values in the `@theme` block.

### 📦 Deployment

The build output is in the `dist/` directory and can be deployed to:
- Static hosting services (Netlify, Vercel, GitHub Pages)
- CDN services
- Traditional web servers

Since the router uses hash mode, no server-side configuration is needed for routing.

### 📚 Learn More

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Shadcn Vue Documentation](https://www.shadcn-vue.com/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue I18n Documentation](https://vue-i18n.intlify.dev/)

---

<a name="chinese"></a>

## 📖 中文文档

一个现代化、生产就绪的 Vue 3 模板，集成了 TypeScript、Tailwind CSS 和完整的 UI 组件库。该模板遵循最佳实践，提供了构建可扩展 Web 应用程序的坚实基础和友好的开发工具。

### ✨ 功能特性

#### 核心框架与构建工具
- **Vue 3** - 渐进式 JavaScript 框架，采用组合式 API
- **TypeScript** - 类型安全的开发体验
- **Vite** - 下一代前端构建工具，提供极速的热模块替换
- **Vue DevTools** - 集成的开发调试工具

#### 状态管理与路由
- **Vue Router** - 官方路由解决方案，采用 hash 模式导航
- **Pinia** - 直观的、类型安全的状态管理
  - 设置存储，集成 localStorage 持久化
  - 使用组合式 API 的响应式状态管理

#### 国际化
- **Vue I18n** - 完整的国际化解决方案
  - 内置英文和简体中文支持
  - 基于浏览器偏好的自动语言检测
  - 易于扩展支持更多语言

#### UI 与样式
- **Tailwind CSS v4** - 实用优先的 CSS 框架
  - 使用 CSS 变量的自定义主题配置
  - 支持深色模式，可检测系统偏好
  - 响应式设计工具
- **Shadcn Vue** - 高质量、无障碍的组件库
  - 30+ 个预构建的 UI 组件
  - 可使用 Tailwind CSS 自定义
  - 基于 Reka UI（原 Radix Vue）
- **Lucide Icons** - 精美、一致的图标库
- **Class Variance Authority** - 类型安全的组件变体
- **tw-animate-css** - Tailwind 动画工具

#### 开发者体验
- **ESLint** - 支持 Vue 和 TypeScript 的代码检查
- **Prettier** - 零配置的代码格式化工具
- **EditorConfig** - 跨编辑器的一致编码风格
- **Vitest** - 快速的单元测试框架
- **Vue Test Utils** - Vue 组件的官方测试工具

#### 高级功能
- **@vueuse/core** - 基本的 Vue 组合式工具集合
- **@tanstack/vue-table** - 用于构建强大数据网格的无样式表格组件
- **Vue Input OTP** - 一次性密码输入组件
- **Vue Sonner** - 精美的 Toast 通知

### 📁 项目结构

```
template-vue/
├── src/
│   ├── assets/          # 静态资源和全局样式
│   │   └── main.css     # Tailwind CSS 配置和主题
│   ├── components/      # 可复用组件
│   │   ├── settings/    # 设置相关组件
│   │   │   └── SettingsItem.vue
│   │   └── ui/          # Shadcn Vue UI 组件（30+ 个组件）
│   ├── i18n/            # 国际化
│   │   ├── config.ts    # i18n 配置
│   │   ├── en.json      # 英文翻译
│   │   └── zh.json      # 中文翻译
│   ├── lib/             # 工具函数
│   │   └── utils.ts     # 通用工具（cn 函数用于类名合并）
│   ├── router/          # Vue Router 配置
│   │   └── index.ts     # 路由定义
│   ├── stores/          # Pinia 存储
│   │   └── settings.ts  # 应用设置存储（主题、语言）
│   ├── views/           # 页面组件
│   │   ├── HomeView.vue     # 首页
│   │   └── SettingsView.vue # 设置页面
│   ├── App.vue          # 根组件
│   └── main.ts          # 应用程序入口点
├── public/              # 原样提供的静态文件
├── .vscode/             # VS Code 工作区设置
├── components.json      # Shadcn Vue 配置
├── vite.config.ts       # Vite 配置
├── vitest.config.ts     # Vitest 配置
├── tsconfig.json        # TypeScript 配置
├── eslint.config.ts     # ESLint 配置
└── package.json         # 项目依赖和脚本
```

### 🎨 关键实现细节

#### 主题系统
- **深色模式**：自动检测系统偏好，支持手动覆盖
- **颜色模式**：浅色、深色和系统（跟随操作系统设置）
- **持久化设置**：用户偏好保存到 localStorage，前缀为 `xuanzhi33-`
- **动态主题切换**：实时更新主题，无需重新加载页面

#### 设置管理
模板包含完整的设置系统：
- 颜色模式选择（浅色/深色/系统）
- 语言选择（英文/中文）
- 浏览器偏好检测
- 使用 localStorage 的持久化存储
- 使用 Vue 组合式 API 的响应式更新

#### 路由
- 基于 hash 的路由，更好地兼容静态托管
- 两个预配置的路由：
  - `/` - 首页
  - `/settings` - 设置页面

### 🚀 快速开始

#### 前置要求
- Node.js: `^20.19.0 || >=22.12.0`
- pnpm（推荐的包管理器）

#### 安装

```sh
# 克隆仓库
git clone <repository-url>
cd template-vue

# 安装依赖
pnpm install
```

#### 开发

```sh
# 启动开发服务器，支持热重载
pnpm dev

# 应用程序将在 http://localhost:5173 上可用
```

#### 生产构建

```sh
# 类型检查、编译并压缩用于生产环境
pnpm build

# 本地预览生产构建
pnpm preview
```

#### 代码质量

```sh
# 检查并修复代码问题
pnpm lint

# 使用 Prettier 格式化代码
pnpm format

# 运行类型检查
pnpm type-check
```

#### 测试

```sh
# 运行单元测试
pnpm test:unit

# 在监视模式下运行测试
pnpm test:unit --watch
```

### 🛠️ 推荐的 IDE 设置

**IDE**: [VS Code](https://code.visualstudio.com/)

**必备扩展**：
- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue 语言支持（如已安装 Vetur 请禁用）
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) - i18n 支持（可选）

项目包含 VS Code 工作区设置，可自动：
- 启用保存时格式化
- 配置文件嵌套以更好地组织
- 设置 i18n Ally 用于翻译管理

### 🌐 浏览器扩展（推荐）

**基于 Chromium 的浏览器**（Chrome、Edge、Brave）：
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [启用自定义对象格式化器](http://bit.ly/object-formatters)

**Firefox**：
- [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [启用自定义对象格式化器](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

### 📝 TypeScript 支持

TypeScript 默认无法处理 `.vue` 导入的类型信息。该模板使用：
- **vue-tsc** 进行类型检查（代替 `tsc`）
- **Volar** 提供 IDE 支持（.vue 类型感知）

### 🎯 配置

#### Vite 配置
- 基础路径设置为 `./` 以便灵活部署
- 路径别名 `@` 映射到 `src/`
- 开发环境启用 Vue DevTools 插件
- 集成 Tailwind CSS 插件

#### Tailwind CSS
- 使用 CSS 变量的自定义主题
- 支持深色模式变体
- 中性色调板作为基础
- 包含动画工具

#### 组件库（Shadcn Vue）
- 样式：`new-york`
- 基础颜色：`neutral`
- 图标：Lucide Vue Next
- 启用 CSS 变量以支持主题

### 🔧 自定义

#### 添加新语言
1. 在 `src/i18n/` 中创建新的 JSON 文件（例如 `fr.json`）
2. 导入并添加到 `src/i18n/config.ts`
3. 在翻译文件中更新语言选项

#### 添加新组件
```sh
# 使用 Shadcn Vue CLI 添加组件
npx shadcn-vue@latest add [component-name]
```

#### 修改主题颜色
编辑 `src/assets/main.css` 并更新 `@theme` 块中的 CSS 变量值。

### 📦 部署

构建输出位于 `dist/` 目录，可以部署到：
- 静态托管服务（Netlify、Vercel、GitHub Pages）
- CDN 服务
- 传统 Web 服务器

由于路由使用 hash 模式，因此不需要服务器端路由配置。

### 📚 了解更多

- [Vue 3 文档](https://cn.vuejs.org/)
- [Vite 文档](https://cn.vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Shadcn Vue 文档](https://www.shadcn-vue.com/)
- [Vue Router 文档](https://router.vuejs.org/zh/)
- [Pinia 文档](https://pinia.vuejs.org/zh/)
- [Vue I18n 文档](https://vue-i18n.intlify.dev/)
