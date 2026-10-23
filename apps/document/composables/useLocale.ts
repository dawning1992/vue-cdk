import {computed, readonly, shallowRef, watch} from 'vue';

export type Locale = 'zh-CN' | 'en-US';

const STORAGE_KEY = 'vue-cdk-document-locale';
const locale = shallowRef<Locale>(readLocale());

function readLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-CN';
  return window.localStorage.getItem(STORAGE_KEY) === 'en-US' ? 'en-US' : 'zh-CN';
}

watch(locale, value => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, value);
  document.documentElement.lang = value;
});

const messages = {
  'zh-CN': {
    document: '文档',
    description: 'Vue 3 组件开发工具包',
    navigation: '模块导航',
    demo: '示例',
    api: 'API 文档',
    apiIndex: 'API 索引',
    jumpToGroup: (title: string) => `跳转到分组「${title}」`,
    jumpToItem: (label: string) => `跳转到 ${label}`,
    install: '安装',
    terminal: '终端',
    quickStart: '快速开始（声明式下拉菜单）',
    subpath: '子路径导入',
    subpathDescription: '每个模块通过独立子路径消费，类型声明与结构样式随模块产物一并提供。',
    vueRequirement: '需要 Vue 3.3+（仅使用 Composition API）。',
    viewSource: '查看源码',
    hideSource: '收起源码',
    copy: '复制',
    copied: '已复制',
    language: '语言',
    missingEnglishDescription: '未提供英文说明',
    missingEnglishDemoTitle: '未提供英文标题',
  },
  'en-US': {
    document: 'Docs',
    description: 'Vue 3 Component Development Kit',
    navigation: 'Module navigation',
    demo: 'Demos',
    api: 'API Docs',
    apiIndex: 'API index',
    jumpToGroup: (title: string) => `Jump to group “${title}”`,
    jumpToItem: (label: string) => `Jump to ${label}`,
    install: 'Installation',
    terminal: 'Terminal',
    quickStart: 'Quick start (declarative dropdown)',
    subpath: 'Subpath imports',
    subpathDescription: 'Consume each module through an independent subpath with bundled types and structural styles.',
    vueRequirement: 'Requires Vue 3.3+ (Composition API only).',
    viewSource: 'View source',
    hideSource: 'Hide source',
    copy: 'Copy',
    copied: 'Copied',
    language: 'Language',
    missingEnglishDescription: 'English description unavailable',
    missingEnglishDemoTitle: 'English title unavailable',
  },
} as const;

const demoTitleTranslations: Record<string, string> = {
  '键盘导航（ListKeyManager）': 'Keyboard navigation (ListKeyManager)',
  '焦点陷阱（v-focus-trap）': 'Focus trapping (v-focus-trap)',
  '焦点来源监视（v-focus-monitor）': 'Focus-origin monitoring (v-focus-monitor)',
  '真实聚焦（FocusKeyManager）': 'Real focus management (FocusKeyManager)',
  '组合框（ActiveDescendantKeyManager）': 'Combobox (ActiveDescendantKeyManager)',
  '自动补全（组合示例）': 'Autocomplete (combined example)',
  '命令式焦点陷阱': 'Imperative focus trapping',
  '声明式浮层（VConnectedOverlay）': 'Declarative overlay (VConnectedOverlay)',
  '命令式浮层（useOverlay）': 'Imperative overlay (useOverlay)',
  '自定义 OverlayContainer': 'Custom OverlayContainer',
  '命令式连接定位': 'Imperative connected positioning',
  '滚动策略对比': 'Scroll strategy comparison',
  '遮罩与事件流': 'Backdrop and event streams',
  '声明式高级用法': 'Advanced declarative usage',
  '右键菜单（命令式 + 坐标原点）': 'Context menu (imperative + point origin)',
  '多层堆叠': 'Stacking multiple overlays',
  'RTL 方向镜像': 'RTL direction mirroring',
  'Popover 插入位置': 'Popover insertion positions',
  '组件对话框（useDialog + useDialogData）': 'Component dialog (useDialog + useDialogData)',
  '使用 closedPromise 等待关闭结果': 'Awaiting close results with closedPromise',
  '渲染函数对话框': 'Render-function dialog',
  'VNode 对话框与数据通道': 'VNode dialog and data channels',
  '对话框配置项面板': 'Dialog configuration panel',
  '多对话框：共享遮罩与 z-index 窗口管理': 'Multiple dialogs: shared backdrop and z-index management',
  '自定义容器（useDialogContainerCore）': 'Custom container (useDialogContainerCore)',
  '方向上下文': 'Direction context',
  '嵌套局部方向': 'Nested local direction',
  'auto 与非法输入': 'auto and invalid input',
  '自定义 Composition provider': 'Custom Composition provider',
  '基础单选与无障碍结构': 'Basic single selection and accessible structure',
  '多选与批量操作': 'Multiple selection and batch operations',
  'v-model 与命令式实例': 'v-model and imperative instances',
  '转换函数交互演示': 'Interactive coercion functions',
  '实战用法': 'Practical usage',
};

const demoDescriptionTranslations: Record<string, string> = {
  '方向键导航并自动跳过禁用项；循环、Home/End、PageUp/PageDown、typeahead 字母定位、方向与修饰键均为可配置选项。': 'Navigate with arrow keys while skipping disabled items. Looping, Home/End, PageUp/PageDown, typeahead, orientation, and modifier keys are configurable.',
  'Tab 焦点被限制在区域内；.autoCapture 挂载时捕获、卸载时恢复，绑定值动态启停，卸载/重挂载演示焦点恢复。': 'Tab focus is trapped inside the region. .autoCapture captures focus on mount and restores it on unmount; the binding can be toggled dynamically to demonstrate focus restoration.',
  '聚焦元素时回调接收焦点来源；focusVia 编程聚焦、stopMonitoring 停止监视、InputModalityDetector 实时输入方式检测，.subtree 修饰符覆盖子元素。': 'The callback receives the focus origin. The demo covers programmatic focusVia, stopMonitoring, live InputModalityDetector input-modality detection, and the .subtree modifier for descendants.',
  '活动项变化时自动调用条目的 focus() 移动真实焦点；change / tabOut 事件流与 setFocusOrigin 来源标记。': 'When the active item changes, its focus() method moves real DOM focus. The demo also covers change and tabOut event streams and setFocusOrigin origin markers.',
  'input + aria-activedescendant 组合框模式：条目实现 Highlightable 的 setActiveStyles / setInactiveStyles 同步高亮。': 'Combobox pattern with input and aria-activedescendant: items implement Highlightable to synchronize highlighting through setActiveStyles and setInactiveStyles.',
  'ActiveDescendantKeyManager 与 VConnectedOverlay 组合成真实自动补全：match-width 对齐输入框，↑/↓/Home/End 选择、Enter 确认、ESC 关闭。': 'ActiveDescendantKeyManager and VConnectedOverlay form a real autocomplete. match-width aligns the panel with the input; arrows, Home/End, Enter, and Escape control selection and closing.',
  'focusTrapFactory.create() 在任意元素上命令式创建/启用/销毁陷阱；useFocusTrap 组合式提供双向 enabled 与 focusInitial / focusFirst / focusLast。': 'focusTrapFactory.create() imperatively creates, enables, and destroys a trap on any element. useFocusTrap provides two-way enabled state and focusInitial, focusFirst, and focusLast helpers.',
  'useDirectionality 返回响应式 Directionality；setDirection 可更新由调用方管理的上下文。': 'useDirectionality returns reactive Directionality; setDirection updates the context managed by the caller.',
  'VDir 向后代提供最近方向，支持动态输入和 dirChange。': 'VDir provides the nearest direction to descendants and supports dynamic input and dirChange.',
  '原始 DOM 属性保持不变，注入上下文始终归一化为 ltr 或 rtl。': 'The raw DOM attribute remains unchanged while the injected context is always normalized to ltr or rtl.',
  'provideDirectionality 可构建 Fragment 或业务组件，不强制额外宿主元素。': 'provideDirectionality can be used with fragments or business components without requiring an extra host element.',
  'CDK 不替应用决定标记；示例显式连接 header、region、aria-controls、aria-labelledby 与 aria-expanded。': 'CDK does not prescribe application markup; this demo explicitly connects header, region, aria-controls, aria-labelledby, and aria-expanded.',
  'multi 允许多项展开；公开实例的 openAll/closeAll 跳过禁用项。': 'multi allows multiple items to expand; the public openAll and closeAll methods skip disabled items.',
  'v-model:expanded、组件公开方法和作用域插槽共享同一响应式状态；as 可替换宿主元素。': 'v-model:expanded, exposed component methods, and scoped slots share the same reactive state; as can replace the host element.',
  '点击按钮运行 coerceArray / coerceCssPixelValue / coerceElement，覆盖数字、负数、百分比、auto、空值与空 ref 等边界输入。': 'Click the buttons to run coerceArray, coerceCssPixelValue, and coerceElement across numbers, negatives, percentages, auto, null values, and empty refs.',
  '把转换函数用于真实场景：number | string 尺寸归一为样式、string | string[] props 归一渲染标签、模板 ref 经 coerceElement 交给逻辑。': 'Apply the coercion functions to real scenarios: normalize number | string sizes into styles, normalize string | string[] props for tag rendering, and pass a template ref through coerceElement.',
};

export function useLocale() {
  const messagesForLocale = computed(() => messages[locale.value]);

  function setLocale(nextLocale: Locale): void {
    locale.value = nextLocale;
  }

  return {
    locale: readonly(locale),
    messages: messagesForLocale,
    setLocale,
    translateDemoTitle: (title: string) => locale.value === 'en-US' ? demoTitleTranslations[title] ?? title : title,
    translateDemoDescription: (description: string) => locale.value === 'en-US' ? demoDescriptionTranslations[description] ?? description : description,
  };
}
