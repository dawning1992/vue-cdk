/** 文档模块元数据：路由与左侧菜单共用同一份数据源，新增模块只需在此登记。 */
export interface DocModule {
  /** 路由路径，同时作为菜单链接与 router-view 匹配依据。 */
  path: string;
  /** 模块英文名（菜单第一行）。 */
  name: string;
  /** 模块中文名（菜单第二行）。 */
  label: string;
  /** 视图组件文件名（不含扩展名），用于路由懒加载映射。 */
  view: string;
  /** 模块一句话简介，展示于模块页头部与概览卡片。 */
  summary: string;
}

export const docModules: DocModule[] = [
  {
    path: '/',
    name: 'Overview',
    label: '概览',
    view: 'Overview',
    summary: 'Vue 3 组件开发工具包总览：模块一览、安装与快速开始。',
  },
  {
    path: '/overlay',
    name: 'overlay',
    label: '浮层',
    view: 'Overlay',
    summary: '命令式 useOverlay() 与声明式 VConnectedOverlay 浮层面板体系。',
  },
  {
    path: '/coercion',
    name: 'coercion',
    label: '强制转换',
    view: 'Coercion',
    summary: 'coerceArray、coerceCssPixelValue、coerceElement 等类型/值转换工具。',
  },
  {
    path: '/platform',
    name: 'platform',
    label: '平台',
    view: 'Platform',
    summary: '浏览器能力检测与通用事件工具，SSR 环境下可安全判断。',
  },
  {
    path: '/scrolling',
    name: 'scrolling',
    label: '滚动',
    view: 'Scrolling',
    summary: '滚动分发、滚动容器、视口测量与固定尺寸虚拟滚动。',
  },
  {
    path: '/collections',
    name: 'collections',
    label: '集合',
    view: 'Collections',
    summary: 'DataSource / ArrayDataSource 数据源抽象，对接列表类组件。',
  },
  {
    path: '/emitter',
    name: 'emitter',
    label: '事件发射器',
    view: 'Emitter',
    summary: '零依赖的类型化事件发射器，替代 RxJS Subject 的事件通信。',
  },
  {
    path: '/portal',
    name: 'portal',
    label: '内容挂载',
    view: 'Portal',
    summary: '可编程内容挂载：Portal / ComponentPortal / TemplatePortal / DomPortal 与声明式 VPortal / VPortalOutlet。',
  },
  {
    path: '/a11y',
    name: 'a11y',
    label: '无障碍',
    view: 'A11y',
    summary: '键盘导航、焦点陷阱与焦点来源监视三类无障碍能力。',
  },
  {
    path: '/dialog',
    name: 'dialog',
    label: '对话框',
    view: 'Dialog',
    summary: '命令式 useDialog() 模态对话框，对齐 Angular CDK dialog。',
  },
  {
    path: '/drag-drop',
    name: 'drag-drop',
    label: '拖拽',
    view: 'DragDrop',
    summary: '拖拽排序：VDropList / VDrag / vDragHandle，对齐 Angular CDK drag-drop。',
  },
  {
    path: '/tree',
    name: 'tree',
    label: '树',
    view: 'Tree',
    summary: '树形结构渲染：VTree / VTreeNode / VNestedTreeNode 与 TreeControl，对齐 Angular CDK tree。',
  },
  {
    path: '/virtual-tree',
    name: 'virtual-tree',
    label: '虚拟滚动树',
    view: 'VirtualTree',
    summary: '虚拟滚动树：VVirtualScrollTree，全量/懒加载两种模式，每层独立分页与滚动边界加载。',
  },
  {
    path: '/clipboard',
    name: 'clipboard',
    label: '剪贴板',
    view: 'Clipboard',
    summary: '剪贴板复制：useClipboard() / Clipboard 命令式复制与 vCopyToClipboard 指令复制。',
  },
];
