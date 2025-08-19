# 四国军棋棋盘可视化项目 (Ludo Chess)

# 任何项目都务必遵守的规则（极其重要！！！）

## Communication

- 永远使用简体中文进行思考和对话

## Documentation

- 编写 .md 文档时，也要用中文
- 正式文档写到项目的 docs/ 目录下
- 用于讨论和评审的计划、方案等文档，写到项目的 discuss/ 目录下

## Code Architecture

- 编写代码的硬性指标，包括以下原则：
  （1）对于 Python、JavaScript、TypeScript 等动态语言，尽可能确保每个代码文件不要超过 300 行
  （2）对于 Java、Go、Rust 等静态语言，尽可能确保每个代码文件不要超过 400 行
  （3）每层文件夹中的文件，尽可能不超过 8 个。如有超过，需要规划为多层子文件夹
- 除了硬性指标以外，还需要时刻关注优雅的架构设计，避免出现以下可能侵蚀我们代码质量的「坏味道」：
  （1）僵化 (Rigidity): 系统难以变更，任何微小的改动都会引发一连串的连锁修改。
  （2）冗余 (Redundancy): 同样的代码逻辑在多处重复出现，导致维护困难且容易产生不一致。
  （3）循环依赖 (Circular Dependency): 两个或多个模块互相纠缠，形成无法解耦的“死结”，导致难以测试与复用。
  （4）脆弱性 (Fragility): 对代码一处的修改，导致了系统中其他看似无关部分功能的意外损坏。
  （5）晦涩性 (Obscurity): 代码意图不明，结构混乱，导致阅读者难以理解其功能和设计。
  （6）数据泥团 (Data Clump): 多个数据项总是一起出现在不同方法的参数中，暗示着它们应该被组合成一个独立的对象。
  （7）不必要的复杂性 (Needless Complexity): 用“杀牛刀”去解决“杀鸡”的问题，过度设计使系统变得臃肿且难以理解。
- 【非常重要！！】无论是你自己编写代码，还是阅读或审核他人代码时，都要严格遵守上述硬性指标，以及时刻关注优雅的架构设计。
- 【非常重要！！】无论何时，一旦你识别出那些可能侵蚀我们代码质量的「坏味道」，都应当立即询问用户是否需要优化，并给出合理的优化建议。

## 项目概述

这是一个基于 React + TypeScript + Vite 的四国军棋棋盘可视化应用，实现了标准四国军棋棋盘的精确绘制、交互式配置和实时预览功能。

## 技术栈

### 核心技术
- **前端框架**: React 18.3.1
- **开发语言**: TypeScript 5.6.2
- **构建工具**: Vite 5.4.10
- **样式框架**: Tailwind CSS 3.4.17

### 开发工具
- **代码检查**: ESLint 9.13.0 + TypeScript ESLint
- **CSS处理**: PostCSS + Autoprefixer
- **图标库**: React Icons + Lucide React

### UI组件库
- **样式工具**: 
  - `class-variance-authority` - 组件变体管理
  - `clsx` - 条件类名组合
  - `tailwind-merge` - Tailwind 类合并
  - `tailwindcss-animate` - CSS 动画

## 项目架构

### 目录结构
```
ludo-chess/
├── src/
│   ├── components/           # React 组件
│   │   ├── ChessBoard.tsx   # 主棋盘组件 - 核心棋盘逻辑和渲染
│   │   ├── ChessPiece.tsx   # 棋子组件
│   │   ├── ChessPieceManager.tsx  # 棋子管理器
│   │   └── Toolbar.tsx      # 工具栏组件 - 配置面板
│   ├── config/              # 配置文件
│   │   └── boardConfig.ts   # 棋盘配置 - 样式、布局、可见性设置
│   ├── lib/                 # 工具函数
│   │   └── utils.ts         # 通用工具函数
│   ├── assets/              # 静态资源
│   ├── App.tsx              # 应用根组件
│   ├── main.tsx             # React 应用入口
│   ├── index.css            # 全局样式
│   └── vite-env.d.ts        # Vite 类型定义
├── docs/                    # 项目文档
│   ├── development-log.md   # 开发日志
│   ├── coordinate-system.md # 坐标系统说明
│   └── bug-fixes/          # Bug 修复记录
├── public/                  # 静态文件
├── components.json          # shadcn/ui 配置
├── package.json            # 项目依赖
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
├── tsconfig.app.json       # 应用 TS 配置
├── tsconfig.node.json      # Node.js TS 配置
├── eslint.config.js        # ESLint 配置
└── postcss.config.js       # PostCSS 配置
```

### 核心组件说明

#### ChessBoard.tsx
- **功能**: 主棋盘组件，实现17x17网格的四国军棋棋盘
- **特性**: 
  - 精确的棋盘布局（四个玩家区域）
  - 可配置的单元格样式
  - 铁路连接线渲染
  - 响应式设计

#### boardConfig.ts
- **功能**: 集中管理棋盘配置
- **配置项**:
  - 单元格大小和间距
  - 四个玩家的颜色主题
  - 特殊区域样式（军营、大本营、入口）
  - 可见性控制
  - 连接线样式

#### Toolbar.tsx
- **功能**: 提供交互式配置面板
- **特性**: 实时配置棋盘外观和行为

## 开发环境配置

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装依赖
```bash
npm install
```

### 常用命令

#### 开发命令
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

#### 开发服务器配置
- **主机**: 0.0.0.0 (允许外部访问)
- **端口**: Vite 默认端口 (通常是 5173)
- **热重载**: 启用

### TypeScript 配置

#### 路径别名
```typescript
// 使用 @ 作为 src 目录的别名
import Component from '@/components/Component'
```

#### 严格模式
项目启用 TypeScript 严格模式，确保类型安全。

## 代码规范

### TypeScript 规范
- 使用严格的类型检查
- 为所有组件定义明确的 Props 接口
- 使用适当的泛型约束
- 优先使用 interface 而非 type (除非需要联合类型)

### React 规范
- 使用函数组件和 Hooks
- 遵循 React Hooks 规则
- 组件名使用 PascalCase
- Props 解构优于整体传递

### 样式规范
- 优先使用 Tailwind CSS 工具类
- 自定义样式使用 CSS Modules 或 styled-components
- 响应式设计优先
- 语义化的颜色变量

### 文件命名规范
- 组件文件: `PascalCase.tsx`
- 工具函数: `camelCase.ts`
- 配置文件: `camelCase.ts`
- 样式文件: `kebab-case.css`

### 代码组织
- 按功能模块组织目录
- 组件内部按以下顺序组织：
  1. 导入语句
  2. 类型定义
  3. 组件逻辑
  4. 导出语句

## 构建和部署

### 构建流程
1. TypeScript 编译检查
2. Vite 构建优化
3. 静态资源处理
4. 代码分割和压缩

### 部署配置
- 构建输出目录: `dist/`
- 支持静态文件托管
- 建议使用 CDN 加速静态资源

## 特殊配置

### Vite 配置要点
- 路径别名: `@` -> `./src`
- React 插件启用
- 开发服务器允许外部访问

### Tailwind 配置要点
- 自定义颜色主题（四个玩家颜色）
- 扩展的设计系统
- 动画插件支持

### ESLint 配置要点
- React Hooks 规则
- TypeScript 推荐规则
- React Refresh 支持

## 开发工具推荐

### VS Code 扩展
- TypeScript and JavaScript Language Server
- ESLint
- Tailwind CSS IntelliSense
- React Snippets

### 调试工具
- React Developer Tools
- TypeScript 错误面板
- Vite 开发服务器日志

## 项目特色功能

### 棋盘系统
- 17x17 精确网格布局
- 四个玩家区域的清晰划分
- 铁路连接线的精确绘制
- 特殊区域（军营、大本营）的标识

### 配置系统
- 实时可视化配置
- 颜色主题预设
- 可见性控制
- 响应式参数调整

### 技术亮点
- 组件化设计
- 类型安全的配置系统
- 现代化的工具链
- 优秀的开发体验

## 常见问题和解决方案

### 开发环境问题
- 如果端口冲突，检查 `vite.config.ts` 中的端口配置
- TypeScript 错误通常可以通过 `npm run lint` 检查

### 构建问题
- 确保所有依赖已正确安装
- 检查 TypeScript 配置是否正确
- 验证导入路径的正确性

### 样式问题
- 确保 Tailwind CSS 正确配置
- 检查自定义 CSS 变量是否定义
- 验证响应式断点使用

## 项目维护

### 依赖更新
定期更新依赖包，特别关注：
- React 和相关生态
- Vite 构建工具
- TypeScript 版本
- Tailwind CSS 版本

### 代码质量
- 定期运行 ESLint 检查
- 保持 TypeScript 严格模式
- 及时修复警告和错误
- 维护良好的文档

---

*最后更新: 2025-08-18*