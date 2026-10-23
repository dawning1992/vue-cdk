/** 文档模块元数据：路由与左侧菜单共用同一份数据源，新增模块只需在此登记。 */
export interface DocModule {
  /** 路由路径，同时作为菜单链接与 router-view 匹配依据。 */
  path: string;
  /** 模块英文名（菜单第一行）。 */
  name: string;
  /** 模块中文名（菜单第二行）。 */
  label: string;
  /** 模块英文显示名。 */
  labelEn: string;
  /** 视图组件文件名（不含扩展名），用于路由懒加载映射。 */
  view: string;
  /** 模块一句话简介，展示于模块页头部与概览卡片。 */
  summary: string;
  /** 模块英文简介。 */
  summaryEn: string;
}

export const docModules: DocModule[] = [
  {
    path: '/',
    name: 'Overview',
    label: '概览',
    labelEn: 'Overview',
    view: 'Overview',
    summary: 'Vue 3 组件开发工具包总览：模块一览、安装与快速开始。',
    summaryEn: 'Vue 3 component development kit overview, module index, installation, and quick start.',
  },
  {
    path: '/overlay',
    name: 'overlay',
    label: '浮层',
    labelEn: 'Overlay',
    view: 'Overlay',
    summary: '命令式 useOverlay() 与声明式 VConnectedOverlay 浮层面板体系。',
    summaryEn: 'Imperative useOverlay() and declarative VConnectedOverlay panels with connected positioning, scroll strategies, backdrops, and event dispatchers.',
  },
  {
    path: '/bidi',
    name: 'bidi',
    label: '文字方向',
    labelEn: 'Bidirectionality',
    view: 'Bidi',
    summary: 'LTR/RTL 方向上下文、局部覆盖与 Composition API 响应式状态。',
    summaryEn: 'LTR/RTL direction context, local overrides, and reactive Composition API state.',
  },
  {
    path: '/coercion',
    name: 'coercion',
    label: '强制转换',
    labelEn: 'Coercion',
    view: 'Coercion',
    summary: 'coerceArray、coerceCssPixelValue、coerceElement 等类型/值转换工具。',
    summaryEn: 'Type and value conversion utilities such as coerceArray and coerceElement.',
  },
  {
    path: '/platform',
    name: 'platform',
    label: '平台',
    labelEn: 'Platform',
    view: 'Platform',
    summary: '浏览器能力检测与通用事件工具，SSR 环境下可安全判断。',
    summaryEn: 'Browser capability detection and event utilities that are safe in SSR environments.',
  },
  {
    path: '/layout',
    name: 'layout',
    label: '响应式布局',
    labelEn: 'Layout',
    view: 'Layout',
    summary: '媒体查询观察、标准响应式断点与 Vue Composition API 响应式状态。',
    summaryEn: 'Media-query observation, responsive breakpoints, and reactive Composition API state.',
  },
  {
    path: '/scrolling',
    name: 'scrolling',
    label: '滚动',
    labelEn: 'Scrolling',
    view: 'Scrolling',
    summary: '滚动分发、滚动容器、视口测量与固定尺寸虚拟滚动。',
    summaryEn: 'Global scroll dispatch, scroll containers, viewport measurement, and fixed-size or variable-height virtual scrolling.',
  },
  {
    path: '/collections',
    name: 'collections',
    label: '集合',
    labelEn: 'Collections',
    view: 'Collections',
    summary: 'DataSource / ArrayDataSource 数据源抽象，对接列表类组件。',
    summaryEn: 'DataSource and ArrayDataSource abstractions for list-like components.',
  },
  {
    path: '/emitter',
    name: 'emitter',
    label: '事件发射器',
    labelEn: 'Emitter',
    view: 'Emitter',
    summary: '零依赖的类型化事件发射器，替代 RxJS Subject 的事件通信。',
    summaryEn: 'Zero-dependency typed event emitter for Subject-like event communication.',
  },
  {
    path: '/portal',
    name: 'portal',
    label: '内容挂载',
    labelEn: 'Portal',
    view: 'Portal',
    summary: '可编程内容挂载：Portal / ComponentPortal / TemplatePortal / DomPortal 与声明式 VPortal / VPortalOutlet。',
    summaryEn: 'Programmable content mounting with Portal and declarative VPortal components.',
  },
  {
    path: '/a11y',
    name: 'a11y',
    label: '无障碍',
    labelEn: 'Accessibility',
    view: 'A11y',
    summary: '键盘导航、焦点陷阱与焦点来源监视三类无障碍能力。',
    summaryEn: 'Keyboard navigation, focus trapping, and focus-origin monitoring.',
  },
  {
    path: '/dialog',
    name: 'dialog',
    label: '对话框',
    labelEn: 'Dialog',
    view: 'Dialog',
    summary: '命令式 useDialog() 模态对话框，对齐 Angular CDK dialog。',
    summaryEn: 'Imperative useDialog() modal dialogs aligned with Angular CDK dialog.',
  },
  {
    path: '/drag-drop',
    name: 'drag-drop',
    label: '拖拽',
    labelEn: 'Drag and drop',
    view: 'DragDrop',
    summary: '拖拽排序：VDropList / VDrag / vDragHandle，对齐 Angular CDK drag-drop。',
    summaryEn: 'Drag sorting with VDropList, VDrag, and vDragHandle.',
  },
  {
    path: '/tree',
    name: 'tree',
    label: '树',
    labelEn: 'Tree',
    view: 'Tree',
    summary: '树形结构渲染：VTree / VTreeNode / VNestedTreeNode 与 TreeControl，对齐 Angular CDK tree。',
    summaryEn: 'Tree rendering with VTree, VTreeNode, VNestedTreeNode, and TreeControl.',
  },
  {
    path: '/virtual-tree',
    name: 'virtual-tree',
    label: '虚拟滚动树',
    labelEn: 'Virtual tree',
    view: 'VirtualTree',
    summary: '虚拟滚动树：VVirtualScrollTree，全量/懒加载两种模式，每层独立分页与滚动边界加载。',
    summaryEn: 'Virtual scrolling tree with full-data and lazy-loading modes.',
  },
  {
    path: '/clipboard',
    name: 'clipboard',
    label: '剪贴板',
    labelEn: 'Clipboard',
    view: 'Clipboard',
    summary: '剪贴板复制：useClipboard() / Clipboard 命令式复制与 vCopyToClipboard 指令复制。',
    summaryEn: 'Clipboard copying with useClipboard(), Clipboard, and vCopyToClipboard.',
  },
  {
    path: '/accordion',
    name: 'accordion',
    label: '手风琴',
    labelEn: 'Accordion',
    view: 'Accordion',
    summary: '无样式展开状态协调：CdkAccordion / CdkAccordionItem 与 Composition API 双入口。',
    summaryEn: 'Unstyled expansion-state coordination with CdkAccordion and Composition API entry points.',
  },
  {
    path: '/stepper',
    name: 'stepper',
    label: '步进器',
    labelEn: 'Stepper',
    view: 'Stepper',
    summary: '无样式多步骤流程：线性校验、表单适配、步骤状态与键盘导航。',
    summaryEn: 'Unstyled multi-step flows with linear validation, form adapters, and keyboard navigation.',
  },
  {
    path: '/text-field',
    name: 'text-field',
    label: '文本字段',
    labelEn: 'Text field',
    view: 'TextField',
    summary: 'textarea 自动伸缩与 input 自动填充状态监控、样式探针。',
    summaryEn: 'Textarea autosizing and input autofill monitoring.',
  },
  {
    path: '/observers',
    name: 'observers',
    label: '内容观察',
    labelEn: 'Observers',
    view: 'Observers',
    summary: '共享 MutationObserver 的 DOM 内容变化流、声明式指令与 Composition API。',
    summaryEn: 'Shared MutationObserver content streams, directives, and Composition API.',
  },
];
