# Vue Component Dev Kit ( Vue CDK )

在线文档：[https://dawning1992.github.io/vue-cdk](https://dawning1992.github.io/vue-cdk)

Vue 3 组件开发工具包（Vue Component Dev Kit），设计模式借鉴 [Angular CDK](https://material.angular.io/cdk/overview)

本仓库为 pnpm workspaces monorepo，包含两个独立包：

| 目录 | 包名 | 说明 |
| --- | --- | --- |
| `packages/cdk` | `vue-cdk` | 可发布到 npm 的 CDK 库，含源码、测试与构建配置 |
| `apps/document` | `vue-cdk-document` | private 文档站点，构建产物可直接静态托管 |

`vue-cdk` 现提供 accordion、a11y、bidi、clipboard、coercion、collections、dialog、drag-drop、emitter、layout、observers、overlay、platform、portal、scrolling、stepper、text-field、tree、virtual-tree 十九个子路径模块。各模块均可独立导入并参与 tree-shaking；完整模块说明、API 与示例见 [packages/cdk/README.md](packages/cdk/README.md)。

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


## FAQ

**Vue CDK 与 UI 组件库（Element Plus、Ant Design Vue 等）是什么关系？**

CDK 是不含业务样式的基础能力层，UI 组件库可以基于它构建下拉、对话框、拖拽列表等交互；
直接使用 Vue CDK 时需自行定义主题与视觉样式。

**为什么根入口只导出版本号？**

与 Angular CDK 一致，业务能力全部按子路径导入，避免把整个库打进产物，配合 tree-shaking 按需加载。

**事件流为什么不使用 RxJS？**

`Emitter` 提供订阅、派发、完成的最小语义（对齐 RxJS `Subject`），让包保持零运行时依赖；
如需 RxJS 操作符，可自行用 `from` / `fromEvent` 等工具桥接。

**SSR 下怎么使用？**

各模块可安全导入；命令式 API（`useOverlay` / `useDialog` 等）应在客户端环境（如 `onMounted`）调用，
剪贴板与平台检测在无 `document` 时提供明确降级。

**结构样式需要手动引入吗？**

不需要，运行时自动注入；想完全掌控时可显式引入对应 `style.css`，两者会去重。

**多个 `createApp` 实例共享全局单例有什么影响？**

`OverlayContainer`、事件分发器等是模块级单例，多个应用实例会共享；
需要隔离时可用 `createOverlayRef` 的 `container` 选项指定容器，或自行管理生命周期。

**对 Vue 版本有什么要求？**

`vue-cdk` 的 `peerDependencies` 为 `vue ^3.3.0`，仅使用 Composition API。