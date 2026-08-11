# Vue CDK

Vue 3 组件开发工具包（Component Dev Kit），设计模式借鉴 [Angular CDK](https://material.angular.io/cdk/overview)：以**一个 npm 包、多个子路径模块**的形式，提供可组合、零业务样式的基础能力。`overlay` 是其中第一个业务模块，后续模块按相同约定扩展。

## 模块一览

| 子路径 | 模块 | 说明 |
| --- | --- | --- |
| `vue-cdk/overlay` | overlay | 浮层面板：命令式 `useOverlay()` + 声明式 `VConnectedOverlay` / `VOverlayOrigin` |
| `vue-cdk/coercion` | coercion | 类型/值强制转换工具（`coerceArray`、`coerceCssPixelValue`） |
| `vue-cdk/platform` | platform | 平台能力检测与事件工具（`isBrowser`、`supportsPopover`、`hasModifierKey`） |
| `vue-cdk/scrolling` | scrolling | 全局滚动分发与视口测量（`ScrollDispatcher`、`ViewportRuler`） |
| `vue-cdk/emitter` | emitter | 零依赖的类型化事件发射器（`Emitter`） |

根入口 `vue-cdk` 与 Angular CDK 一致，仅导出版本号；业务能力一律按子路径导入。

## overlay 特性

- 与 Angular CDK Overlay 对应的完整 API：`OverlayConfig`、`OverlayRef`、`GlobalPositionStrategy`、`FlexibleConnectedPositionStrategy`、四种滚动策略、backdrop、键盘/外部点击分发器
- 连接定位自动选优：候选位置放不下自动翻转、flexible 尺寸约束、push 回屏、位置锁定、RTL 支持、offset/viewportMargin、transform-origin 动画锚点
- 事件系统零依赖（自研类型化事件发射器，不依赖 RxJS）
- 结构样式自动注入，开箱即用；也可显式引入 `vue-cdk/overlay/style.css`
- 支持原生 Popover API（`usePopover`），浏览器不支持时自动降级为容器渲染
- TypeScript 编写，发布产物含 `.d.ts` 类型声明

## 安装

```bash
npm install vue-cdk
```

需要 Vue 3.3+（仅使用 Composition API）。

## 快速开始

### 声明式：下拉菜单

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {STANDARD_DROPDOWN_BELOW_POSITIONS, VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

const open = ref(false);
</script>

<template>
  <VOverlayOrigin>
    <button @click="open = !open">打开菜单</button>
    <VConnectedOverlay
      :open="open"
      :positions="STANDARD_DROPDOWN_BELOW_POSITIONS"
      @overlay-outside-click="open = false"
      @update:open="open = $event"
    >
      <div class="menu">
        <div class="menu-item">菜单项 1</div>
        <div class="menu-item">菜单项 2</div>
      </div>
    </VConnectedOverlay>
  </VOverlayOrigin>
</template>
```

`origin` 也可以直接传元素、ref 或坐标点：

```vue
<VConnectedOverlay :open="open" :origin="triggerElement">
  ...
</VConnectedOverlay>
```

### 命令式：模态对话框

```ts
import {h} from 'vue';
import {useOverlay} from 'vue-cdk/overlay';
import DialogContent from './DialogContent.vue'; // 任意 .vue 单文件组件

const overlay = useOverlay();

function openDialog() {
  const overlayRef = overlay.create({
    positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
    hasBackdrop: true,
    scrollStrategy: overlay.scrollStrategies.block(),
  });
  overlayRef.attach(() => h(DialogContent, {onClose: () => overlayRef.detach()}));
  overlayRef.backdropClick().subscribe(() => overlayRef.detach());
}
```

`attach()` 接受任意 VNode 或渲染函数，因此命令式弹出的内容可以是带
`template` / `style` / `script` 的 `.vue` 单文件组件（作用域样式随组件生效）。

## API 参考（overlay 模块）

### `useOverlay()`

对应 Angular 的 `Overlay` 服务，在组件 setup 中调用：

| 成员 | 说明 |
| --- | --- |
| `create(config?)` | 创建并返回 `OverlayRef`（会捕获调用方 app 上下文，命令式内容支持 app 级 provide） |
| `position()` | 返回定位构建器：`global()` 与 `flexibleConnectedTo(origin)` |
| `scrollStrategies` | 滚动策略工厂：`noop()` / `close(config?)` / `block()` / `reposition(config?)` |

### `OverlayConfig`

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `positionStrategy` | — | 定位策略（`PositionStrategy` 接口） |
| `scrollStrategy` | `noop` | 滚动策略 |
| `panelClass` / `backdropClass` | `''` / `'vcdk-overlay-dark-backdrop'` | 面板/遮罩自定义类 |
| `hasBackdrop` | `false` | 是否启用遮罩 |
| `disableAnimations` | `false` | 是否禁用遮罩动画 |
| `width/height/minWidth/minHeight/maxWidth/maxHeight` | — | 面板尺寸（数字按像素） |
| `direction` | 根元素 `dir` | `'ltr'` / `'rtl'` |
| `disposeOnNavigation` | `false` | 路由导航（popstate/hashchange）时自动销毁 |
| `usePopover` | `true`（能力可用时） | 是否以原生 Popover 渲染 |
| `eventPredicate` | — | 决定 overlay 是否接收分发事件 |

### `OverlayRef`

| 方法 / 属性 | 说明 |
| --- | --- |
| `attach(content?)` | 挂载内容（VNode 或渲染函数；不传则由 Teleport 负责渲染） |
| `detach()` / `dispose()` / `hasAttached()` | 卸载 / 销毁 / 状态查询 |
| `updatePosition()` / `updatePositionStrategy()` / `updateScrollStrategy()` | 更新定位与策略 |
| `updateSize()` / `setDirection()` | 更新尺寸与方向 |
| `addPanelClass()` / `removePanelClass()` | 面板类管理 |
| `overlayElement` / `hostElement` / `backdropElement` | 面板 / 宿主 / 遮罩元素 |
| `attachments()` / `detachments()` / `backdropClick()` / `keydownEvents()` / `outsidePointerEvents()` | 事件流（订阅返回退订函数） |

### 定位策略

- `GlobalPositionStrategy`：`top()/bottom()/left()/right()/start()/end()/centerHorizontally()/centerVertically()/width()/height()`
- `FlexibleConnectedPositionStrategy`：`setOrigin()`、`withPositions()`、`withViewportMargin()`、`withFlexibleDimensions()`、`withGrowAfterOpen()`、`withPush()`、`withLockedPosition()`、`withDefaultOffsetX/Y()`、`withTransformOriginOn()`、`withScrollableContainers()`、`withPopoverLocation()`、`reapplyLastPosition()`、`positionChanges`

标准位置常量：`STANDARD_DROPDOWN_BELOW_POSITIONS`、`STANDARD_DROPDOWN_ADJACENT_POSITIONS`。

### `VConnectedOverlay` 组件

主要 props：`open`、`origin`、`positions`、`positionStrategy`、`offsetX/offsetY`、`width/height/minWidth/minHeight/maxWidth/maxHeight`、`backdropClass`、`panelClass`、`viewportMargin`、`scrollStrategy`、`disableClose`、`transformOriginSelector`、`hasBackdrop`、`lockPosition`、`flexibleDimensions`、`growAfterOpen`、`push`、`disposeOnNavigation`、`usePopover`、`matchWidth`、`direction`。

emits：`backdropClick`、`positionChange`、`attach`、`detach`、`overlayKeydown`、`overlayOutsideClick`、`update:open`。

## 与 Angular CDK 的对应关系

| Angular | Vue CDK（`vue-cdk/overlay`） |
| --- | --- |
| `Overlay` 服务 | `useOverlay()` |
| `OverlayRef` | `OverlayRef` |
| `OverlayConfig` | `OverlayConfig` |
| `CdkConnectedOverlay` / `CdkOverlayOrigin` 指令 | `VConnectedOverlay` / `VOverlayOrigin` 组件 |
| `GlobalPositionStrategy` | `GlobalPositionStrategy` |
| `FlexibleConnectedPositionStrategy` | `FlexibleConnectedPositionStrategy` |
| `ScrollStrategyOptions` | `scrollStrategies` |
| `OverlayKeyboardDispatcher` / `OverlayOutsideClickDispatcher` | 同名分发器（模块级单例） |
| `@angular/cdk/scrolling` 的 `ScrollDispatcher` / `ViewportRuler` | `vue-cdk/scrolling` |
| `@angular/cdk/platform` | `vue-cdk/platform` |
| `@angular/cdk/coercion` | `vue-cdk/coercion` |
| RxJS `Subject` | 内部 `Emitter`（`vue-cdk/emitter`，零依赖） |

## 开发

```bash
npm install        # 安装依赖
npm run dev        # 启动 demo
npm run test       # 运行单元测试（Vitest + jsdom）
npm run typecheck  # 类型检查
npm run build      # 构建库（多入口 ESM/CJS + .d.ts + CSS）
npm pack --dry-run # 校验发布产物
```

新增模块约定：在 `src/` 下创建独立目录并提供 `index.ts` 入口，同时在 `package.json` 的 `exports` 与 `vite.config.ts` 的多入口配置中登记。

## 注意事项

- 库本身不包含业务样式，只提供结构样式；主题样式请在使用方应用内定义。
- 命令式 `attach` 渲染的内容可访问 app 级 `provide`；组件级 `provide` 建议使用声明式组件。
- 事件分发器与容器均为全局单例，多个应用实例共享时需自行管理生命周期。
- 结构样式默认在运行时自动注入；若希望显式控制，可引入 `vue-cdk/overlay/style.css`（会与自动注入去重）。

## License

MIT
