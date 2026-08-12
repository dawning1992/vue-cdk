import type {ApiGroup} from '../api';

/** platform 模块 API 分组：能力检测、事件工具与滚动轴类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '环境检测',
    rows: [
      {
        name: 'isBrowser',
        signature: 'isBrowser(): boolean',
        description: '是否运行在浏览器环境（window 与 document 均存在）。SSR 期间调用安全，返回 false。',
      },
      {
        name: 'supportsPopover',
        signature: 'supportsPopover(): boolean',
        description: '是否支持原生 Popover API（以 body.showPopover 是否存在判定）；不支持时 overlay 自动降级为容器渲染。',
      },
      {
        name: 'supportsShadowDom',
        signature: 'supportsShadowDom(): boolean',
        description: '是否支持 Shadow DOM；结果按进程缓存，避免重复探测。',
      },
      {
        name: 'supportsPassiveEventListeners',
        signature: 'supportsPassiveEventListeners(): boolean',
        description: '是否支持 passive 事件监听器（options.passive）；结果缓存。',
      },
      {
        name: 'supportsScrollBehavior',
        signature: 'supportsScrollBehavior(): boolean',
        description: '是否支持 scrollTo 的 behavior 选项；结果缓存。',
      },
      {
        name: 'getRtlScrollAxisType',
        signature: 'getRtlScrollAxisType(): RtlScrollAxisType',
        description: '探测当前浏览器在 RTL 模式下处理水平滚动轴的方式（NORMAL/NEGATED/INVERTED），结果缓存，供虚拟滚动与 Scrollable 归一化测量。',
      },
    ],
  },
  {
    title: '事件与焦点工具',
    rows: [
      {
        name: 'getEventTarget',
        signature: 'getEventTarget(event: Event): HTMLElement | null',
        description: '从事件中提取目标元素，兼容原生 Event 与合成事件对象。',
      },
      {
        name: 'getEventTargetPierceShadowDom',
        signature: 'getEventTargetPierceShadowDom<T extends EventTarget>(event: Event): T | null',
        description: '从事件中提取目标元素，优先使用 composedPath 穿透 Shadow DOM；事件重放等场景抛错时回退到 event.target。',
      },
      {
        name: 'getFocusedElementPierceShadowDom',
        signature: 'getFocusedElementPierceShadowDom(): HTMLElement | null',
        description: '获取当前聚焦元素，并穿透 Shadow DOM 边界逐层下钻。',
      },
      {
        name: 'getShadowRoot',
        signature: 'getShadowRoot(element: HTMLElement): ShadowRoot | null',
        description: '获取元素所在的 ShadowRoot；元素不在 Shadow DOM 中或环境不支持时返回 null。',
      },
      {
        name: 'hasModifierKey',
        signature: 'hasModifierKey(event: KeyboardEvent, ...modifiers: ModifierKey[]): boolean',
        description:
          '判断事件是否按下了修饰键：不传修饰键时任意修饰键按下即为 true；传入一个或多个修饰键时，仅当其中至少一个按下才为 true。',
      },
      {
        name: 'normalizePassiveListenerOptions',
        signature: 'normalizePassiveListenerOptions(options: AddEventListenerOptions): AddEventListenerOptions | boolean',
        description: '归一化事件监听选项：不支持 passive 的浏览器退回布尔 capture，避免在不支持 options 参数的环境抛错。',
      },
    ],
  },
  {
    title: '类型与常量',
    rows: [
      {
        name: 'ModifierKey',
        signature: "type ModifierKey = 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey'",
        description: '修饰键名称，用于按名称判断按键状态。',
      },
      {
        name: 'RtlScrollAxisType',
        signature: 'enum RtlScrollAxisType { NORMAL, NEGATED, INVERTED }',
        description:
          'RTL 滚动轴类型枚举：NORMAL 为 Chrome 行为（scrollLeft 0..max），NEGATED 为 Firefox/Safari 行为（负数起始），INVERTED 为旧版 IE/Edge 行为。',
      },
    ],
  },
];
