# Vue CDK

Vue 3 组件开发工具包（Component Dev Kit），设计模式借鉴 [Angular CDK](https://material.angular.io/cdk/overview)

## 模块一览

| 子路径 | 模块 | 说明 |
| --- | --- | --- |
| `vue-cdk/overlay` | overlay | 浮层面板：命令式 `useOverlay()` + 声明式 `VConnectedOverlay` / `VOverlayOrigin` |
| `vue-cdk/coercion` | coercion | 类型/值强制转换工具（`coerceArray`、`coerceCssPixelValue`） |
| `vue-cdk/clipboard` | clipboard | 剪贴板：命令式 `useClipboard()` / `Clipboard`、延迟复制 `PendingCopy`、声明式 `vCopyToClipboard` 指令 |
| `vue-cdk/platform` | platform | 平台能力检测与事件工具（`isBrowser`、`supportsPopover`、`hasModifierKey`） |
| `vue-cdk/scrolling` | scrolling | 滚动能力：全局滚动分发（`ScrollDispatcher`）、滚动容器（`vScrollable` / `useScrollable`）、视口测量（`ViewportRuler`）、虚拟滚动（`VVirtualScrollViewport` / `VVirtualFor`） |
| `vue-cdk/collections` | collections | 集合抽象：`DataSource` / `ArrayDataSource` / `ListRange` / `CollectionViewer` |
| `vue-cdk/emitter` | emitter | 零依赖的类型化事件发射器（`Emitter`） |
| `vue-cdk/portal` | portal | 可编程内容挂载：`Portal` 系列 + `VPortal` / `VPortalOutlet`，overlay/dialog 基于它构建 |
| `vue-cdk/a11y` | a11y | 无障碍：键盘导航（`ListKeyManager` 系列）、焦点陷阱（`FocusTrap`）、焦点来源监视（`FocusMonitor`） |
| `vue-cdk/dialog` | dialog | 模态对话框：命令式 `useDialog()`，对齐 Angular CDK `@angular/cdk/dialog` |
| `vue-cdk/drag-drop` | drag-drop | 拖拽排序：`VDropList` / `VDrag` / `VDropListGroup` / `vDragHandle`，对齐 Angular CDK `@angular/cdk/drag-drop` |
| `vue-cdk/tree` | tree | 树形结构：`VTree` / `VTreeNode` / `VNestedTreeNode` / `vTreeNodeToggle` / `vTreeNodePadding`，对齐 Angular CDK `@angular/cdk/tree` |

根入口 `vue-cdk` 与 Angular CDK 一致，仅导出版本号；业务能力一律按子路径导入。

## tree 特性

- 完整复刻 Angular CDK tree 设计模式：数据源（`DataSource` / `Emitter` / `Ref` / 数组）→ 扁平化/层级化渲染管线 → 节点组件（ARIA + 焦点管理）→ 指令
- 两种树型：扁平树（`VTreeNode` + `levelAccessor`）与嵌套树（`VNestedTreeNode` + `childrenAccessor`），`childrenAccessor` 也支持 `Emitter` 异步子节点
- 双数据入口：经典 `FlatTreeControl` / `NestedTreeControl`（含 `BaseTreeControl` / `TreeControl` 接口）与 Angular 21 推荐的 `levelAccessor` / `childrenAccessor` / `expansionKey` / `trackBy`
- 完整 ARIA treeview 无障碍：`role` / `aria-level` / `aria-posinset` / `aria-setsize` / `aria-expanded`、roving tabindex、`TreeKeyManager` 键盘导航（方向键、左右键展开/收起与聚焦子/父节点、Home/End、Enter/Space 激活、`*` 同级展开、typeahead、RTL）
- `vTreeNodeToggle` 指令（支持递归切换）与 `vTreeNodePadding` 指令（层级缩进，支持 CSS 单位与 RTL）
- 事件：节点 `activation`（键盘激活）与 `expandedChange`（展开状态变化）；树实例暴露 `expandAll` / `collapseAll` / `expandDescendants` 等命令式方法
- 零新增运行时依赖；与 Angular 的差异（作用域插槽替代结构指令、嵌套子节点自动渲染、条件模板用 v-if）见文档站

### 树快速开始（扁平树）

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {VTree, VTreeNode} from 'vue-cdk/tree';

interface Item {
  name: string;
  level: number;
  expandable: boolean;
}

const items = ref<Item[]>([
  {name: 'root', level: 0, expandable: true},
  {name: 'child', level: 1, expandable: false},
]);
</script>

<template>
  <VTree :data-source="items" :level-accessor="(node: Item) => node.level">
    <template #node="{node, level}">
      <VTreeNode :node="node" :is-expandable="node.expandable" v-tree-node-padding>
        <button v-tree-node-toggle>{{ node.name }}</button>
      </VTreeNode>
    </template>
  </VTree>
</template>
```

嵌套树使用 `childrenAccessor` 与 `VNestedTreeNode`，展开后子节点自动渲染在节点内部：

```vue
<script setup lang="ts">
import {VTree, VNestedTreeNode} from 'vue-cdk/tree';

const roots = [{name: 'root', children: [{name: 'child', children: []}]}];
</script>

<template>
  <VTree :data-source="roots" :children-accessor="(node: any) => node.children">
    <template #node="{node}">
      <VNestedTreeNode :node="node" :is-expandable="node.children.length > 0">
        {{ node.name }}
      </VNestedTreeNode>
    </template>
  </VTree>
</template>
```

## clipboard 特性

- 与 Angular CDK clipboard 对齐的 API：`Clipboard` 类（`copy` / `beginCopy`）、单例 `clipboard`、组合式 `useClipboard()`、延迟复制 `PendingCopy`
- 声明式 `vCopyToClipboard` 指令：字符串简写 `v-copy-to-clipboard="text"` 或对象 `{text, attempts, onCopied}`，点击即复制
- 大文本重试：`attempts` 默认 1、上限 50（与 Angular 一致），`beginCopy` 预加载 textarea 后以 1ms 间隔重试，浏览器拒绝复制时可自动补试
- 全局默认配置：`CDK_COPY_TO_CLIPBOARD_CONFIG` 注入键 + `provideCopyToClipboardConfig()`，App 级或组件级 provide 均可
- 复制机制与 Angular 相同：隐藏 textarea + `execCommand('copy')`，同步返回成功与否，复制后还原焦点；不依赖 `navigator.clipboard`
- SSR 安全：无 `document` 时 `copy()` 返回 `false`，`beginCopy()` 抛出明确错误，模块可安全导入
- 零新增运行时依赖，TypeScript 编写，发布产物含 `.d.ts` 类型声明

### 剪贴板快速开始

先全局注册指令（或在使用组件的 `directives` 中局部注册）：

```ts
import {createApp} from 'vue';
import {vCopyToClipboard} from 'vue-cdk/clipboard';

const app = createApp(App);
app.directive('copy-to-clipboard', vCopyToClipboard);
```

```vue
<script setup lang="ts">
import {ref} from 'vue';

const text = ref('要复制的文本');
const copied = ref<boolean | null>(null);

function onCopied(successful: boolean) {
  copied.value = successful;
}
</script>

<template>
  <!-- 字符串简写：只复制，不关心结果 -->
  <button v-copy-to-clipboard="text">复制</button>

  <!-- 对象写法：携带重试次数与结果回调 -->
  <button v-copy-to-clipboard="{text, attempts: 3, onCopied}">重试复制</button>
  <span v-if="copied !== null">{{ copied ? '复制成功' : '复制失败' }}</span>
</template>
```

命令式复制：

```ts
import {useClipboard} from 'vue-cdk/clipboard';

const clipboard = useClipboard();
const successful = clipboard.copy('内容'); // true | false
```

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

## drag-drop 特性

- 与 Angular CDK drag-drop 对应的完整 API：声明式 `VDropList` / `VDrag` 组件、`vDragHandle` 手柄指令、`VDropListGroup` 分组，命令式 `createDragRef` / `createDropListRef` / `DragRef` / `DropListRef` / `DragDropRegistry`
- 全部输入与事件载荷对齐 Angular：`lockAxis` / `boundaryElement` / `constrainPosition` / `dragStartDelay` / `freeDragPosition` / `previewClass` / `previewContainer` / `scale` / `rootElementSelector`；`started` / `released` / `ended` / `entered` / `exited` / `dropped` / `moved` / `sorted` 事件携带 `previousIndex` / `currentIndex` / `container` / `previousContainer` / `isPointerOverContainer` / `distance` / `dropPoint` 等字段
- 排序能力：纵向/横向（含 RTL 视觉序反转）、`mixed` 换行网格、`connectedTo` 与分组跨容器传输、`enterPredicate` / `sortPredicate`、边缘自动滚动、`sortingDisabled` / `disabled` / `hasAnchor`
- 自定义预览与占位符：`#preview="{data}"` / `#placeholder="{data}"` 插槽，支持 `previewMatchSize` 对齐原条目尺寸
- 结构样式自动注入，开箱即用；也可显式引入 `vue-cdk/drag-drop/style.css`

### 拖拽排序快速开始

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {moveItemInArray, VDrag, VDropList} from 'vue-cdk/drag-drop';
import type {VDragDrop} from 'vue-cdk/drag-drop';

const items = ref(['甲', '乙', '丙']);

function onDrop(event: VDragDrop<string>) {
  moveItemInArray(items.value, event.previousIndex, event.currentIndex);
}
</script>

<template>
  <VDropList :data="items" @dropped="onDrop">
    <VDrag v-for="item in items" :key="item" :data="item">{{ item }}</VDrag>
  </VDropList>
</template>
```

### 跨容器传输

```ts
import {transferArrayItem} from 'vue-cdk/drag-drop';

function onDrop(event: VDragDrop<string>) {
  transferArrayItem(
    event.previousContainer.data as string[],
    event.container.data as string[],
    event.previousIndex,
    event.currentIndex,
  );
}
```

## scrolling 特性

- 与 Angular CDK scrolling 对应的完整 API：`ScrollDispatcher`（register/deregister、`scrolled`、`ancestorScrolled`、`getAncestorScrollContainers`）、`ViewportRuler`（尺寸/rect/滚动位置、resize + orientationchange）、`vScrollable` 指令与 `useScrollable` 组合式（对应 `cdkScrollable`，含 LTR/RTL 六向 `scrollTo` / `measureScrollOffset`）
- 虚拟滚动：`VVirtualScrollViewport` + `VVirtualFor` 作用域插槽，固定尺寸策略（`itemSize` / `minBufferPx` / `maxBufferPx`），支持纵向/横向（含 RTL）、`appendOnly`、`scrollWindow` 窗口滚动、`vVirtualScrollableElement` 外部滚动容器、DataSource / 响应式数组数据源、`scrollToIndex` / `scrollToOffset`
- 事件流沿用自研 `Emitter`，包零运行时依赖（不依赖 RxJS）
- 结构样式自动注入，开箱即用；也可显式引入 `vue-cdk/scrolling/style.css`

### 虚拟滚动快速开始

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualFor, VVirtualScrollViewport} from 'vue-cdk/scrolling';

const items = ref(Array.from({length: 1000}, (_, i) => `条目 ${i + 1}`));
</script>

<template>
  <VVirtualScrollViewport :item-size="40" style="height: 320px" @scrolled-index-change="onChange">
    <VVirtualFor :of="items" v-slot="{item, index}">
      <div style="height: 40px">{{ index + 1 }}：{{ item }}</div>
    </VVirtualFor>
  </VVirtualScrollViewport>
</template>
```

`VVirtualFor` 插槽上下文与 Angular `*cdkVirtualFor` 一致：
`item` / `$implicit` / `of` / `index` / `count` / `first` / `last` / `even` / `odd`。

### 声明滚动容器

```vue
<div v-scrollable class="scroll-area">...</div>
```

```ts
import {ref} from 'vue';
import {useScrollable} from 'vue-cdk/scrolling';

const area = ref<HTMLElement | null>(null);
const scrollable = useScrollable(area); // 组件卸载时自动注销
```

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

## a11y 模块

移植自 Angular CDK 的 `@angular/cdk/a11y`，提供三个主题能力：键盘导航、焦点陷阱与焦点来源监视。
核心类保持 Angular API 语义一致（RxJS 由零依赖 `Emitter` 替代），并提供 Vue 专属的
组合式函数（`useFocusTrap` / `useFocusMonitor`）与指令（`vFocusTrap` / `vFocusMonitor`）。

### 键盘导航：ListKeyManager 系列

```vue
<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {ListKeyManager, type ListKeyManagerOption} from 'vue-cdk/a11y';

interface Item extends ListKeyManagerOption {
  id: string;
  getLabel(): string;
}

const items = ref<Item[]>([]);
const manager = new ListKeyManager(items).withWrap().withTypeAhead();

function onKeydown(event: KeyboardEvent) {
  manager.onKeydown(event);
}

onBeforeUnmount(() => manager.destroy());
</script>

<template>
  <ul tabindex="0" @keydown="onKeydown">
    <li v-for="(item, index) in items" :key="item.id"
        :class="{active: index === manager.activeItemIndex}">
      {{ item.getLabel() }}
    </li>
  </ul>
</template>
```

`FocusKeyManager`（活动项自动 `focus(origin)`）与 `ActiveDescendantKeyManager`
（活动项自动切换 `setActiveStyles` / `setInactiveStyles`）同样可用。

### 焦点陷阱：FocusTrap

声明式（指令）：

```vue
<div v-focus-trap.autoCapture role="dialog" aria-modal="true">
  <!-- Tab 焦点被限制在区域内；autoCapture 打开时捕获、关闭时恢复 -->
</div>
```

命令式 / 组合式（可配置陷阱接入栈管理，支持嵌套模态框）：

```ts
import {ref} from 'vue';
import {useFocusTrap} from 'vue-cdk/a11y';

const modalRoot = ref<HTMLElement | null>(null);
const {enabled, focusInitial, destroy} = useFocusTrap(modalRoot, {configurable: true});
```

区域标记：`vcdk-focus-initial` 指定初始聚焦元素，`vcdk-focus-region-start/end`
指定首/末 Tab 边界（对应 Angular 的 `cdkFocusInitial` / `cdkFocusRegionStart|End`）。

### 焦点来源：FocusMonitor

```vue
<input v-focus-monitor="origin => console.log(origin)" />
<div v-focus-monitor.subtree> <!-- 子元素聚焦也算父元素聚焦 --> </div>
```

```ts
import {useFocusMonitor} from 'vue-cdk/a11y';

const monitor = useFocusMonitor();
const unsubscribe = monitor.monitor(inputRef).subscribe(origin => {
  // origin: 'mouse' | 'keyboard' | 'touch' | 'program' | null
});
```

监视器会自动维护焦点类：`vcdk-focused`、`vcdk-mouse-focused`、
`vcdk-keyboard-focused`、`vcdk-touch-focused`、`vcdk-program-focused`。

### Angular ↔ Vue API 映射（a11y）

| Angular（`@angular/cdk/a11y`） | Vue CDK（`vue-cdk/a11y`） |
| --- | --- |
| `ListKeyManager` | `ListKeyManager`（条目源支持数组或 `Ref`） |
| `FocusKeyManager` / `ActiveDescendantKeyManager` / `Typeahead` | 同名类 |
| `CdkTrapFocus` 指令 | `vFocusTrap` 指令 + `useFocusTrap()` |
| `FocusTrapFactory` / `ConfigurableFocusTrapFactory` | 同名类 + 模块级单例 |
| `FocusTrapManager` / `FocusTrapInertStrategy` / `EventListenerFocusTrapInertStrategy` | 同名类（策略通过工厂/组合式 options 注入） |
| `InteractivityChecker` | `InteractivityChecker` + 模块级单例 |
| `CdkMonitorFocus` 指令 | `vFocusMonitor` 指令（`.subtree` 修饰符对应 `cdkMonitorSubtreeFocus`） |
| `FocusMonitor` / `InputModalityDetector` | 同名类 + `useFocusMonitor()` + 模块级单例 |
| `FocusMonitorDetectionMode` | 同名枚举（IMMEDIATE / EVENTUAL） |

### 类名映射

| Angular | Vue CDK |
| --- | --- |
| `cdk-focused` / `cdk-mouse-focused` / `cdk-keyboard-focused` / `cdk-touch-focused` / `cdk-program-focused` | `vcdk-focused` / `vcdk-mouse-focused` / `vcdk-keyboard-focused` / `vcdk-touch-focused` / `vcdk-program-focused` |
| `cdk-visually-hidden` / `cdk-focus-trap-anchor` | `vcdk-visually-hidden` / `vcdk-focus-trap-anchor` |
| `cdkFocusInitial` / `cdkFocusRegionStart` / `cdkFocusRegionEnd` | `vcdk-focus-initial`（或 `vcdkFocusInitial`）/ `vcdk-focus-region-start` / `vcdk-focus-region-end` |
| `div.cdk-overlay-pane` 豁免 | `div.vcdk-overlay-pane` 豁免 |

### 样式说明

结构样式（`.vcdk-visually-hidden`）随 `vue-cdk/a11y` 入口自动注入；
也可显式引入 `vue-cdk/a11y/style.css`（会与自动注入去重）。
焦点来源类只负责标记，具体视觉样式由使用方自行定义（文档站点「无障碍」页展示了色标示例）。

## dialog 模块

移植自 Angular CDK 的 `@angular/cdk/dialog`：以 `useDialog()` 命令式打开
模态对话框，`DialogRef` 携带关闭结果与事件流，内容通过 `provide/inject`
（`DIALOG_DATA` / `DIALOG_REF`）与 `contentProps` 双通道接收数据。
焦点陷阱、autoFocus / restoreFocus、ARIA、滚动锁定等行为由默认容器
`VDialogContainer` 内置，也可通过 `config.container` 传入自定义容器
（复用 `useDialogContainerCore`）。

### 快速开始

```vue
<!-- MyDialog.vue -->
<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';

const data = useDialogData<{title: string}>();
const dialogRef = useDialogRef<string>();
</script>

<template>
  <div class="my-dialog">
    <h3>{{ data.title }}</h3>
    <button @click="dialogRef.close('确定')">确定</button>
    <button @click="dialogRef.close('取消')">取消</button>
  </div>
</template>
```

```ts
import {useDialog} from 'vue-cdk/dialog';
import MyDialog from './MyDialog.vue';

const dialog = useDialog();
const dialogRef = dialog.open(MyDialog, {
  data: {title: '确认删除？'},
  panelClass: 'my-dialog-panel',
});

dialogRef.closed.subscribe(result => {
  console.log(result); // '确定' | '取消'
});
```

打开内容支持组件、渲染函数与 VNode 三种形式；渲染函数等价 Angular 的
`TemplateRef`，参数为上下文对象（含 `$implicit`（data）与 `dialogRef`，
并合并 `templateContext`）。

### 常用配置（`DialogConfig`）

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `id` / `role` | 自动生成 / `'dialog'` | 唯一 id 与 ARIA role（可设为 `'alertdialog'`） |
| `data` | `null` | 注入给内容的数据（`useDialogData` / `contentProps` 双通道） |
| `panelClass` / `backdropClass` / `hasBackdrop` | `''` / `''` / `true` | 面板、遮罩类与遮罩开关 |
| `disableClose` / `closePredicate` | `false` / — | 关闭限制；`closePredicate` 返回 false 时阻止关闭并重捕获焦点 |
| `width/height/minWidth/minHeight/maxWidth/maxHeight` | — | 面板尺寸（数字按像素） |
| `autoFocus` | `'first-tabbable'` | `'dialog'` / `'first-heading'` / CSS 选择器 / `false` |
| `restoreFocus` | `true` | 关闭后恢复焦点：`boolean` / CSS 选择器 / `HTMLElement` |
| `scrollStrategy` / `closeOnNavigation` | block / `true` | 滚动策略与路由导航关闭 |
| `closeOnOverlayDetachments` | `true` | overlay 被外部 detach 时是否关闭 |
| `disableAnimations` / `direction` | `false` / 根元素 dir | 动画开关与文本方向 |
| `container` | `VDialogContainer` | 自定义容器组件（复用 `useDialogContainerCore`） |
| `contentProps` / `templateContext` | — | 内容 props（Vue 特有）与渲染函数上下文 |

### 服务与引用

- `useDialog()` / `dialogService`：`open(content, config?)`、`closeAll()`、
  `getDialogById(id)`、`openDialogs`、`afterOpened`、`afterAllClosed`
  （订阅时无打开对话框会立即触发，对齐 Angular 语义）；
- `DialogRef`：`close(result?, {focusOrigin?})`、`closed` / `backdropClick` /
  `keydownEvents` / `outsidePointerEvents` 事件流（`Emitter`）、
  `updatePosition()` / `updateSize()` / `addPanelClass()` / `removePanelClass()`；
- 结构样式随打开自动注入，也可显式引入 `vue-cdk/dialog/style.css`。

## portal 模块

- 移植自 Angular CDK `@angular/cdk/portal`：`Portal` 抽象类与 `ComponentPortal` /
  `TemplatePortal` / `DomPortal` 三种内容源；`PortalOutlet` 接口与
  `BasePortalOutlet` / `DomPortalOutlet` 两类出口
- 声明式组件：`VPortal`（无渲染模板源，捕获插槽为 `TemplatePortal`）与
  `VPortalOutlet`（出口组件，`portal` prop、`attached` 事件、`attachedRef` 与
  三组 `attachXxxPortal` exposed 方法）
- 模板内容经内部包装组件渲染，父级响应式状态变化可驱动已挂载内容更新
  （等价 Angular 嵌入视图的变更检测语义）
- Vue 能力映射：Angular `Injector` → `appContext`（provide/inject）、
  `bindings/directives` → props、`TemplateRef` / `$implicit` → 渲染函数参数 /
  插槽 props；`DomPortal` 移动的元素若含 Vue 绑定将失去响应式（与 Angular 警告一致）
- overlay/dialog 已基于 portal 重构内容挂载：`overlayRef.attach(portal)` 可直接挂载三类 portal

### portal 快速开始（声明式）

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {VPortal, VPortalOutlet, type Portal} from 'vue-cdk/portal';

const source = ref<{portal: Portal<unknown>} | null>(null);
const activePortal = ref<Portal<unknown> | null>(null);
</script>

<template>
  <VPortal ref="source">
    <template #default="{data}">{{ data }}</template>
  </VPortal>
  <VPortalOutlet :portal="activePortal" tag="section" />
  <button @click="activePortal = source?.portal ?? null">挂载</button>
</template>
```

### portal 命令式（组件 / 模板 / DOM）

```ts
import {h} from 'vue';
import {ComponentPortal, DomPortal, DomPortalOutlet, TemplatePortal} from 'vue-cdk/portal';
import MyComponent from './MyComponent.vue';

const outlet = new DomPortalOutlet(document.querySelector('#slot')!);
outlet.attach(new ComponentPortal(MyComponent, {props: {title: 'Hello'}}));
outlet.detach();
outlet.attach(new TemplatePortal(ctx => h('p', ctx.msg), {msg: 'hi'}));
outlet.detach();
outlet.attach(new DomPortal(document.querySelector('#movable')!)); // detach 恢复原位置
```

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
| `@angular/cdk/scrolling` 的 `cdkScrollable` 指令 | `vScrollable` 指令 / `useScrollable()` |
| `@angular/cdk/scrolling` 的 `cdk-virtual-scroll-viewport` | `VVirtualScrollViewport` 组件 |
| `@angular/cdk/scrolling` 的 `*cdkVirtualFor` | `VVirtualFor` 组件（作用域插槽） |
| `@angular/cdk/scrolling` 的 `FixedSizeVirtualScrollStrategy` | 同名策略类（`itemSize` 属性自动创建） |
| `@angular/cdk/scrolling` 的 `cdkVirtualScrollingElement` / `scrollWindow` | `vVirtualScrollableElement` 指令 / `scroll-window` 属性 |
| `@angular/cdk/collections` 的 `DataSource` / `ArrayDataSource` / `ListRange` | `vue-cdk/collections` |
| `@angular/cdk/platform` | `vue-cdk/platform` |
| `@angular/cdk/coercion` | `vue-cdk/coercion` |
| `@angular/cdk/a11y` | `vue-cdk/a11y` |
| `@angular/cdk/dialog` 的 `Dialog` 服务 | `useDialog()` / `dialogService` |
| `@angular/cdk/dialog` 的 `DialogRef` | `DialogRef`（RxJS → `Emitter`） |
| `DIALOG_DATA` / `DEFAULT_DIALOG_CONFIG` | 同名 InjectionKey + `useDialogData()` |
| `CdkDialogContainer` | `VDialogContainer` / `useDialogContainerCore()` |
| `@angular/cdk/tree` 的 `CdkTree` | `VTree`（`vue-cdk/tree`，数据源形态含 Ref/Emitter） |
| `CdkTreeNode` / `CdkNestedTreeNode` | `VTreeNode` / `VNestedTreeNode` |
| `cdkTreeNodeDef` 结构指令 | `#node` 作用域插槽（`{node, level, index, count}`） |
| `cdkTreeNodeToggle` / `cdkTreeNodePadding` | `vTreeNodeToggle` / `vTreeNodePadding` |
| `cdkTreeNodeOutlet` | 嵌套树自动渲染子节点，无需显式出口 |
| `FlatTreeControl` / `NestedTreeControl` / `BaseTreeControl` / `TreeControl` | 同名类/接口 |
| `SelectionModel`（collections） | 同名类（内部 `shallowRef`，响应式可追踪） |
| `TreeKeyManager`（a11y） | 同名类（条目源支持 Ref，`change` 用 `Emitter`） |
| `@angular/cdk/portal` 的 `Portal` 抽象类 | `Portal`（`vue-cdk/portal`） |
| `ComponentPortal` / `TemplatePortal` / `DomPortal` | 同名类（injector → appContext、bindings → props） |
| `CdkPortal` 指令 | `VPortal` 组件（插槽捕获模板源） |
| `CdkPortalOutlet` 指令 | `VPortalOutlet` 组件（宿主元素出口） |
| `DomPortalOutlet` | 同名类（ApplicationRef + Injector → appContext） |
| RxJS `Subject` | 内部 `Emitter`（`vue-cdk/emitter`，零依赖） |

## 开发

```bash
npm install        # 安装依赖
npm run dev        # 启动文档站点（document/，路由懒加载）
npm run build:document  # 构建文档站点静态产物
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
