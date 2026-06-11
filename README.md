# 夜市占卜摊

一个基于 Vite + React + TypeScript 的离线占卜应用。所有数据存储在浏览器本地，无需后端服务。

## 环境要求

- Node.js >= 20.19.0（或 >= 22.12.0）
- npm >= 9.0.0

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器，默认端口 6102 |
| `npm run build` | 类型检查 + 生产构建，输出到 `dist/` 目录 |
| `npm run build:app` | 仅执行 Vite 生产构建 |
| `npm run preview` | 本地预览生产构建结果，端口 6102 |
| `npm run type-check` | 仅执行 TypeScript 类型检查，不生成产物 |
| `npm test` | 运行所有测试（单次执行） |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:ui` | 启动 Vitest UI 界面 |
| `npm run check` | **统一质量检查**：类型检查 + 测试 + 生产构建 |

## 质量检查流程

`npm run check` 会依次执行以下检查，任何一步失败都会立即终止并返回非零退出码：

1. **类型检查** (`npm run type-check`)
   - 使用 `tsc -b --noEmit` 执行完整的 TypeScript 类型检查
   - 失败时输出：`TypeScript 类型检查失败，请修复上述错误`
   - 退出码：`1`

2. **测试** (`npm test`)
   - 使用 Vitest 运行 `src/**/__tests__/` 目录下所有测试
   - 失败时输出详细的测试失败信息
   - 退出码：`1`

3. **生产构建** (`npm run build:app`)
   - 使用 Vite 构建生产版本
   - 失败时输出 Vite 构建错误
   - 退出码：`1`

### 定位问题

- 如果 `check` 命令在第一步失败：**类型问题**，检查 TypeScript 编译错误输出
- 如果 `check` 命令在第二步失败：**测试问题**，检查 Vitest 输出的失败用例
- 如果 `check` 命令在第三步失败：**构建问题**，检查 Vite 构建错误输出

## 浏览器验证

### 开发环境

1. 执行 `npm run dev` 启动开发服务器
2. 在浏览器访问 `http://localhost:6102`
3. 确认页面正常加载，无控制台错误

### 生产构建验证

```bash
# 1. 执行质量检查
npm run check

# 2. 构建生产版本
npm run build

# 3. 预览构建结果
npm run preview

# 4. 在浏览器访问 http://localhost:6102 验证
```

### 推荐浏览器

- Chrome / Edge 最新版（推荐）
- Safari 最新版
- Firefox 最新版

### 浏览器兼容性

应用使用以下浏览器特性，请确保目标浏览器支持：

- `localStorage`（用于数据持久化）
- `Canvas API`（用于生成分享图片）
- ES2022 语法
- CSS Grid / Flexbox

## 本地存储注意事项

### 存储位置

所有用户数据（自定义牌、历史记录、主题偏好等）存储在浏览器的 `localStorage` 中，使用以下键名前缀：

| 存储键 | 说明 |
|--------|------|
| `hxwl-2-reading` | 当前进行中的占卜 |
| `hxwl-2-custom-cards` | 自定义牌组 |
| `hxwl-2-history` | 占卜历史记录 |
| `hxwl-2-theme` | 主题设置 |
| `hxwl-2-spaces` | 空间设置 |
| `hxwl-2-current-space` | 当前选中的空间 |
| `hxwl-2-migration-version` | 数据迁移版本号 |
| `hxwl-2-custom-spreads` | 自定义牌阵 |

### 存储限制

- `localStorage` 容量通常为 **5MB** 左右
- 图片（`data:image/*` base64）会占用大量存储空间
- 应用内置了容量检查，批量复制前会预估空间是否足够
- 可以通过浏览器开发者工具 → Application → Local Storage 查看和清理

### 数据迁移

应用支持数据版本迁移，当前版本号见 `src/data/constants.ts` 中的 `CURRENT_MIGRATION_VERSION`。每次版本升级时，应用会自动检测并执行必要的数据迁移。

### 数据丢失风险

> ⚠️ **重要提示**：
> - 清除浏览器数据 / Cookie 会同时清除所有应用数据
> - 隐私模式（无痕浏览）下的数据不会持久化，关闭窗口即丢失
> - 不同浏览器之间数据不共享
> - 目前没有云端同步功能，重要数据请自行导出备份

### 开发时清除数据

在浏览器控制台执行：

```javascript
// 清除所有应用数据
Object.keys(localStorage)
  .filter(key => key.startsWith('hxwl-2-'))
  .forEach(key => localStorage.removeItem(key));
location.reload();
```

## 目录结构

```
hxwl-2/
├── public/              # 静态资源
├── src/
│   ├── components/      # React 组件
│   ├── data/           # 数据层（store、工具函数）
│   │   └── __tests__/  # 单元测试
│   ├── types/          # TypeScript 类型定义
│   ├── App.tsx         # 应用入口组件
│   ├── main.tsx        # 应用入口文件
│   └── styles.css      # 全局样式
├── index.html          # HTML 模板
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
└── vite.config.ts      # Vite 配置
```

## 故障排除

### `npm run dev` 端口被占用

应用配置了 `strictPort: true`，如果 6102 端口被占用会直接报错。请释放端口或修改 `vite.config.ts` 中的端口配置。

### 类型检查失败但代码能运行

TypeScript 配置了 `strict: true`，即使有类型错误，Vite 开发服务器仍然会编译运行。但 `build` 和 `check` 命令会在类型错误时失败，请务必修复。

### 测试找不到模块

Vitest 使用与 Vite 相同的解析逻辑。如果测试找不到模块，请确认：
1. 测试文件中使用的导入路径正确
2. 相关文件在 `tsconfig.json` 的 `include` 范围内

### 构建后本地预览 404

这是 SPA 应用的正常现象。`preview` 命令已配置为对所有路径返回 `index.html`，请使用 `npm run preview` 而不是直接用静态文件服务器。
