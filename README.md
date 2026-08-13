# Vue CDK

Vue 3 组件开发工具包（Component Dev Kit），设计模式借鉴 [Angular CDK](https://material.angular.io/cdk/overview)

本仓库为 pnpm workspaces monorepo，包含两个独立包：

| 目录 | 包名 | 说明 |
| --- | --- | --- |
| `packages/cdk` | `vue-cdk` | 可发布到 npm 的 CDK 库，含源码、测试与构建配置 |
| `apps/document` | `vue-cdk-document` | private 文档站点，构建产物可直接静态托管 |

`vue-cdk` 现提供 overlay、coercion、platform、scrolling、collections、emitter、portal、a11y、dialog 与 drag-drop 十个子路径模块；drag-drop 模块对齐 Angular CDK 的拖拽排序能力（`VDropList` / `VDrag` / `vDragHandle`），完整文档见 [packages/cdk/README.md](packages/cdk/README.md)。

## 环境要求

- Node.js 20.19+（或 22.12+）
- pnpm 11

## 安装

```bash
pnpm install
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动文档站开发服务器（别名直连 CDK 源码） |
| `pnpm build` | 构建 `vue-cdk` 库，产物在 `packages/cdk/dist` |
| `pnpm build:document` | 构建文档站，产物在 `apps/document/dist` |
| `pnpm typecheck` | 对所有包执行 `vue-tsc` 类型检查 |
| `pnpm test` | 运行所有包的单元测试 |
| `pnpm --filter vue-cdk publish` | 发布 CDK 库到 npm（发布前自动执行 typecheck + test + build） |

文档站构建产物（`apps/document/dist`）可直接部署到 GitHub Pages、Netlify、Vercel 等任意静态托管平台，无需服务端。

## 库使用文档

模块列表、安装方式与各模块 API 说明见 [packages/cdk/README.md](packages/cdk/README.md)。
