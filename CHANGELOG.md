# 未发布

### dialog

- feat：支持将 portal 的 `TemplateRefHandle` 直接传入 `dialog.open()`，保留模板响应式状态，合并 `data`、`dialogRef` 与 `templateContext`，继承来源应用上下文；来源卸载时立即销毁对应对话框并清理订阅，失效句柄再次打开时抛错。
- feat：新增可选窗口动画配置 `animation`，支持 `fade`、`scale`、`slide-up`、`slide-down`、分阶段时长与缓动，以及返回 `Animation` 或 `Promise<void>` 的自定义钩子；支持禁用动画与系统减少动态效果设置。
- fix：关闭获准后保留首次结果，等待窗口真实退场完成再释放内容、焦点陷阱并回传关闭结果；统一处理动画取消、失败与外部卸载。
- fix：共享遮罩与最后一个参与窗口同步开始退场，完善多窗口堆叠、过渡完成检测及 Popover 宿主移除前的遮罩迁移。

### overlay

- fix：复用已挂载的宿主时仍激活原生 Popover，避免浮层内容无法显示。

# 0.1.0-beta.8 (2026-10-23)

### portal

| Commit | Type | Description |
| -- | -- | -- |
| [3d6a069](https://github.com/dawning1992/vue-cdk/commit/3d6a069) | feat | `ComponentPortal` 的 `props` 支持普通对象、`reactive`、`ref`、`computed` 与 getter；响应式输入变化后自动更新挂载组件，卸载时停止依赖追踪 |
| [ea40673](https://github.com/dawning1992/vue-cdk/commit/ea40673) | feat | 新增显式模板源组件 `TemplateRef` 与 `TemplateRefHandle<C>` 类型契约，支持通过组件 ref 获取句柄并传入 `new TemplatePortal(tpl.value, context)`；保留原有渲染函数构造方式 |
| [ea40673](https://github.com/dawning1992/vue-cdk/commit/ea40673) | fix | `VPortal` 与 `TemplateRef` 共用插槽捕获逻辑；来源卸载时自动卸载内容并使句柄失效，出口卸载时取消来源订阅；修复挂载失败后 Portal 宿主状态未回滚的问题 |

`TemplateRef` 支持作用域插槽上下文、父级响应式状态和事件，继承应用级上下文；不保证来源组件局部 `provide/inject` 的继承。Vue 裸 `<template ref="tpl">` 不产生模板句柄。

### overlay

| Commit | Type | Description |
| -- | -- | -- |
| [ea40673](https://github.com/dawning1992/vue-cdk/commit/ea40673) | fix | 模板来源卸载时执行完整浮层卸载流程，清理遮罩、滚动策略和事件分发；内容挂载失败时恢复浮层状态，允许修正后重试 |


# 0.1.0-beta.7 (2026-10-22)

### dialog

| Commit | Type | Description |
| -- | -- | -- |
| [af5d4ae](https://github.com/dawning1992/vue-cdk/commit/af5d4ae) | fix | 修复 Popover 模式下关闭最后一个对话框时共享遮罩的淡出动画不可见 |

### docs

| Commit | Type | Description |
| -- | -- | -- |
| [af5d4ae](https://github.com/dawning1992/vue-cdk/commit/af5d4ae) | docs | README 默认使用英文并提供中文切换链接 |

# 0.1.0-beta.6 (2026-09-10)

### dialog

| Commit | Type | Description |
| -- | -- | -- |
| [c217d87](https://github.com/dawning1992/vue-cdk/commit/c217d87) | fix | 修复自定义遮罩过渡无法结束的问题 |

# 0.1.0-beta.5 (2026-09-10)

### dialog

| Commit | Type | Description |
| -- | -- | -- |
| [02f27b5](https://github.com/dawning1992/vue-cdk/commit/02f27b5) | fix | 完善共享遮罩过渡生命周期 |

# 0.1.0-beta.4 (2026-08-28)

### dialog

| Commit | Type | Description |
| -- | -- | -- |
| [cc47469](https://github.com/dawning1992/vue-cdk/commit/cc47469) | feat | 多个对话框共享遮罩并统一管理 `z-index` 层级 |

# 0.1.0-beta.3 (2026-08-17)

### dialog

| Commit | Type | Description |
| -- | -- | -- |
| [1b7b063](https://github.com/dawning1992/vue-cdk/commit/1b7b063) | feat | 增加关闭结果 Promise |

### package

| Commit | Type | Description |
| -- | -- | -- |
| [1b7b063](https://github.com/dawning1992/vue-cdk/commit/1b7b063) | chore | 完善发布包元数据 |

# 0.1.0-beta.2 (2026-08-17)

### bidi

| Commit | Type | Description |
| -- | -- | -- |
| [b01f90b](https://github.com/dawning1992/vue-cdk/commit/b01f90b) | feat | 新增文字方向模块 |

### layout、accordion

| Commit | Type | Description |
| -- | -- | -- |
| [9c8a604](https://github.com/dawning1992/vue-cdk/commit/9c8a604) | feat | 新增布局与手风琴模块 |

### observers

| Commit | Type | Description |
| -- | -- | -- |
| [4b35ea8](https://github.com/dawning1992/vue-cdk/commit/4b35ea8) | feat | 新增 Vue 3 内容观察模块 |

### scrolling

| Commit | Type | Description |
| -- | -- | -- |
| [5956938](https://github.com/dawning1992/vue-cdk/commit/5956938) | feat | 支持不定高度虚拟滚动与双向追加 |

### stepper

| Commit | Type | Description |
| -- | -- | -- |
| [c39951c](https://github.com/dawning1992/vue-cdk/commit/c39951c) | feat | 新增 Vue CDK 步进器 |

### text-field

| Commit | Type | Description |
| -- | -- | -- |
| [b6909e6](https://github.com/dawning1992/vue-cdk/commit/b6909e6) | feat | 新增文本字段工具包 |

### docs

| Commit | Type | Description |
| -- | -- | -- |
| [dccb5f2](https://github.com/dawning1992/vue-cdk/commit/dccb5f2) | docs | 补充模块说明与常见问题 |

# 0.1.0-beta.1 (2026-08-14)

### cdk

| Commit | Type | Description |
| -- | -- | -- |
| [915665c](https://github.com/dawning1992/vue-cdk/commit/915665c) | chore | 发布首个测试版并统一版本号来源；此前已加入 Overlay、Dialog、Portal、a11y、Scrolling、Drag Drop、Clipboard、Tree 和 Virtual Tree 等基础模块 |
