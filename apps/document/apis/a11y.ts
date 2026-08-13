import type {ApiGroup} from '../api';

/** a11y 模块 API 分组：键盘导航、焦点陷阱与焦点来源监视。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '键盘导航（ListKeyManager 系列）',
    rows: [
      {
        name: 'ListKeyManager',
        signature: 'class ListKeyManager<T extends ListKeyManagerOption>',
        description:
          '列表键盘导航管理器：onKeydown(event) 处理方向键/Home/End/PageUp/PageDown；链式配置 withWrap/withVerticalOrientation/withHorizontalOrientation/withAllowedModifierKeys/withTypeAhead/withHomeAndEnd/withPageUpDown/skipPredicate；setActiveItem/updateActiveItem 激活条目，destroy() 释放。属性 activeItemIndex/activeItem。',
      },
      {
        name: 'ListKeyManagerOption',
        signature: 'interface ListKeyManagerOption { disabled?: boolean; getLabel(): string }',
        description: '条目最小契约：getLabel 返回无障碍标签（配合 typeahead），disabled 标记不可激活项。',
      },
      {
        name: 'ListKeyManagerModifierKey',
        signature: "type ListKeyManagerModifierKey = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'",
        description: '允许按下的修饰键集合，用于 withAllowedModifierKeys。',
      },
      {
        name: 'ListKeyManagerItems',
        signature: 'type ListKeyManagerItems<T> = T[] | readonly T[] | Ref<T[]> | Ref<readonly T[]>',
        description: '条目源：数组或响应式数组，响应式变化自动同步。',
      },
      {
        name: 'FocusKeyManager',
        signature: 'class FocusKeyManager<T> extends ListKeyManager<FocusableOption & T>',
        description: '扩展 ListKeyManager：激活条目时自动调用 item.focus(origin)，setFocusOrigin(origin) 设置焦点样式归因。',
      },
      {
        name: 'FocusableOption',
        signature: 'interface FocusableOption extends ListKeyManagerOption { focus(origin?: FocusOrigin): void }',
        description: '可聚焦条目契约，FocusKeyManager 激活时调用 focus。',
      },
      {
        name: 'ActiveDescendantKeyManager',
        signature: 'class ActiveDescendantKeyManager<T> extends ListKeyManager<Highlightable & T>',
        description: '扩展 ListKeyManager：激活/失活条目时自动调用 setActiveStyles/setInactiveStyles，配合 aria-activedescendant 使用。',
      },
      {
        name: 'Highlightable',
        signature: 'interface Highlightable extends ListKeyManagerOption { setActiveStyles(): void; setInactiveStyles(): void }',
        description: '可高亮条目契约，ActiveDescendantKeyManager 激活时调用。',
      },
      {
        name: 'Typeahead',
        signature: 'class Typeahead<T extends TypeaheadItem>',
        description:
          '类型查找器：handleKey(event) 累积按键并匹配 getLabel；setCurrentSelectedItemIndex/setItems 维护当前项；reset() 清空输入。',
      },
      {
        name: 'TypeaheadConfig',
        signature: 'interface TypeaheadConfig<T>',
        description:
          'Typeahead 配置：debounceInterval 为清空输入缓冲的毫秒数（默认 200）；skipPredicate 判断条目是否应被跳过（用于支持禁用项）。',
      },
      {
        name: 'TreeKeyManager',
        signature: 'class TreeKeyManager<T extends TreeKeyManagerItem> implements TreeKeyManagerStrategy<T>',
        description:
          '树形键盘导航管理器（对齐 Angular TreeKeyManager）：方向键导航、左右键展开/收起或聚焦子/父节点、Home/End、Enter/Space 激活、`*` 展开同级、typeahead、禁用项跳过、RTL 交换左右键；条目源支持数组或 Ref（响应式同步）。属性 change（Emitter<T | null>）；方法 onKeydown/destroy/focusItem/getActiveItem/getActiveItemIndex。',
      },
      {
        name: 'TreeKeyManagerItem',
        signature: 'interface TreeKeyManagerItem',
        description:
          '树形导航条目契约：activate() 执行主动作、getParent() 返回父条目（根节点返回 null）、getChildren() 返回子条目（数组或 Emitter 流）、isExpanded 与 expand()/collapse() 控制展开、focus()/unfocus() 切换焦点；isDisabled? 禁用项默认仍可被方向键导航（ARIA 焦点规则）、getLabel?() 供 typeahead 使用、makeFocusable?() 设置 roving tabindex 初始项。',
      },
      {
        name: 'TreeKeyManagerItems',
        signature: 'type TreeKeyManagerItems<T> = T[] | readonly T[] | Ref<T[]> | Ref<readonly T[]>',
        description: '树形导航条目源：数组或响应式数组，变化自动同步。',
      },
      {
        name: 'TreeKeyManagerOptions',
        signature: 'interface TreeKeyManagerOptions<T extends TreeKeyManagerItem>',
        description:
          '树形导航配置：shouldActivationFollowFocus（为 true 时条目聚焦的同时执行 activate）、horizontalOrientation（rtl/ltr，左右键语义互换）、skipPredicate（导航时跳过命中谓词的条目）、trackBy（条目等价比较，默认按引用）、typeAheadDebounceInterval（true 使用默认 200ms 或传防抖毫秒数）。',
      },
      {
        name: 'TreeKeyManagerStrategy',
        signature: 'interface TreeKeyManagerStrategy<T extends TreeKeyManagerItem>',
        description:
          '树形导航策略接口：change（聚焦项变化时派发 Emitter<T | null>）、onKeydown(event)/destroy()、getActiveItemIndex()/getActiveItem()、focusItem(index | item, {emitChangeEvent?})。TreeKeyManager 实现该接口，树组件据此集成键盘导航。',
      },
    ],
  },
  {
    title: '焦点陷阱（类与工厂）',
    rows: [
      {
        name: 'FocusTrap',
        signature: 'class FocusTrap',
        description:
          '焦点陷阱：把 Tab 焦点限制在区域内。enabled 可切换启停；attachAnchors/destroy 管理生命周期；focusInitialElement/focusFirstTabbableElement/focusLastTabbableElement 移动焦点；hasAttached() 查询状态。',
      },
      {
        name: 'FocusTrapFactory',
        signature: 'class FocusTrapFactory',
        description: '焦点陷阱工厂：create(element, deferCaptureElements?) 创建实例；模块级单例 focusTrapFactory 供 vFocusTrap 使用。',
      },
      {
        name: 'focusTrapFactory',
        signature: 'const focusTrapFactory = new FocusTrapFactory()',
        description: '焦点陷阱工厂模块级单例。',
      },
      {
        name: 'ConfigurableFocusTrap',
        signature: 'class ConfigurableFocusTrap extends FocusTrap implements ManagedFocusTrap',
        description: '可配置焦点陷阱：接入 FocusTrapManager 栈管理，支持嵌套模态框（后打开者优先捕获焦点）。',
      },
      {
        name: 'ConfigurableFocusTrapFactory',
        signature: 'class ConfigurableFocusTrapFactory',
        description: '可配置陷阱工厂：create(element, { defer, inertStrategy? }) 创建并注册到管理器。',
      },
      {
        name: 'configurableFocusTrapFactory',
        signature: 'const configurableFocusTrapFactory = new ConfigurableFocusTrapFactory()',
        description: '可配置陷阱工厂模块级单例。',
      },
      {
        name: 'ConfigurableFocusTrapConfig',
        signature: 'interface ConfigurableFocusTrapConfig { defer?: boolean }',
        description: '可配置陷阱配置：defer 为 true 时延迟锚点创建，等元素挂载后捕获。',
      },
      {
        name: 'ConfigurableFocusTrapFactoryOptions',
        signature: 'interface ConfigurableFocusTrapFactoryOptions extends ConfigurableFocusTrapConfig { inertStrategy?: FocusTrapInertStrategy }',
        description: '可配置陷阱工厂的创建选项：继承 defer，并可注入自定义惰性策略。',
      },
      {
        name: 'FocusTrapManager',
        signature: 'class FocusTrapManager',
        description: '焦点陷阱栈管理器：register/deregister 维护陷阱栈，最后注册者优先接收焦点。',
      },
      {
        name: 'focusTrapManager',
        signature: 'const focusTrapManager = new FocusTrapManager()',
        description: '陷阱管理器模块级单例。',
      },
      {
        name: 'ManagedFocusTrap',
        signature: 'interface ManagedFocusTrap { _enable(): void; _disable(): void; focusInitialElementWhenReady(): Promise<boolean> }',
        description: '可管理陷阱契约，FocusTrapManager 据此启停与聚焦。',
      },
      {
        name: 'FocusTrapInertStrategy',
        signature: 'interface FocusTrapInertStrategy',
        description: '惰性策略接口：makeFocusable/markAsUnfocusable 控制陷阱外区域是否可聚焦。',
      },
      {
        name: 'EventListenerFocusTrapInertStrategy',
        signature: 'class EventListenerFocusTrapInertStrategy implements FocusTrapInertStrategy',
        description: '基于事件监听的惰性策略：利用 focusin/focusout 事件让非激活陷阱不接收焦点。',
      },
      {
        name: 'InteractivityChecker',
        signature: 'class InteractivityChecker',
        description:
          '可交互性检测：isDisabled/isVisible/isFocusable/isTabbable 判断元素状态，供焦点陷阱与焦点监视内部使用。',
      },
      {
        name: 'IsFocusableConfig',
        signature: 'class IsFocusableConfig',
        description: 'isFocusable 的配置：ignoreVisibility 为 true 时即使元素当前不可见也按可聚焦处理（默认 false）。',
      },
    ],
  },
  {
    title: '焦点陷阱（Vue 绑定与样式）',
    rows: [
      {
        name: 'vFocusTrap',
        signature: 'directive vFocusTrap',
        description:
          '声明式焦点陷阱指令：<div v-focus-trap> 默认启用，绑定 false 关闭；.autoCapture 修饰符在挂载时捕获焦点、卸载时恢复。区域内支持 vcdk-focus-initial / vcdk-focus-region-start / vcdk-focus-region-end 标记。',
      },
      {
        name: 'useFocusTrap',
        signature: 'useFocusTrap(target: MaybeRefOrGetter<HTMLElement | null | undefined>, options?: UseFocusTrapOptions): UseFocusTrapResult',
        description:
          '组合式焦点陷阱：options 支持 autoCapture/configurable/defer/inertStrategy；返回 trap（实例 ref）、enabled（可写，双向同步）、focusInitial/focusFirst/focusLast 与 destroy。',
      },
      {
        name: 'UseFocusTrapOptions',
        signature: 'interface UseFocusTrapOptions { autoCapture?; configurable?; defer?; inertStrategy? }',
        description: 'useFocusTrap 配置：configurable 为 true 时接入栈管理以支持嵌套模态框。',
      },
      {
        name: 'UseFocusTrapResult',
        signature: 'interface UseFocusTrapResult { trap; enabled; focusInitial(); focusFirst(); focusLast(); destroy() }',
        description: 'useFocusTrap 返回值，见组合式函数条目说明。',
      },
      {
        name: 'injectFocusTrapStyles',
        signature: 'injectFocusTrapStyles(): void',
        description: '注入焦点陷阱结构样式（幂等）。',
      },
      {
        name: 'removeInjectedFocusTrapStyles',
        signature: 'removeInjectedFocusTrapStyles(): void',
        description: '移除已注入的焦点陷阱结构样式。',
      },
      {
        name: 'vcdkFocusTrapStyles',
        signature: 'const vcdkFocusTrapStyles: string',
        description: '焦点陷阱结构样式源码。',
      },
    ],
  },
  {
    title: '焦点监视（类与检测）',
    rows: [
      {
        name: 'FocusMonitor',
        signature: 'class FocusMonitor',
        description:
          '焦点来源监视器：monitor(element, checkChildren=false) 返回 Emitter<FocusOrigin>；stopMonitoring(element) 停止；focusVia(element, origin, options?) 以指定来源聚焦。自动维护 vcdk-focused/vcdk-mouse-focused/vcdk-keyboard-focused/vcdk-touch-focused/vcdk-program-focused 类。',
      },
      {
        name: 'focusMonitor',
        signature: 'const focusMonitor = new FocusMonitor()',
        description: '焦点监视器模块级单例。',
      },
      {
        name: 'FocusOrigin',
        signature: "type FocusOrigin = 'touch' | 'mouse' | 'keyboard' | 'program' | null",
        description: '焦点来源：touch/mouse/keyboard/program，非交互式聚焦为 null。',
      },
      {
        name: 'MonitorTarget',
        signature: 'type MonitorTarget<T extends HTMLElement = HTMLElement> = T | Ref<T | null | undefined>',
        description: '被监视元素或其 ref。',
      },
      {
        name: 'FocusOptions',
        signature: 'interface FocusOptions',
        description: 'focusVia 的选项：preventScroll 为 true 时聚焦但不滚动到该元素。',
      },
      {
        name: 'FocusMonitorDetectionMode',
        signature: 'enum FocusMonitorDetectionMode { IMMEDIATE, EVENTUAL }',
        description: '焦点检测模式：IMMEDIATE 立即响应，EVENTUAL 延迟到下一帧聚合。',
      },
      {
        name: 'FocusMonitorOptions',
        signature: 'interface FocusMonitorOptions',
        description: 'FocusMonitor 构造配置：detectionMode 指定焦点来源归因模式（默认 IMMEDIATE）。',
      },
      {
        name: 'FOCUS_MONITOR_DEFAULT_OPTIONS',
        signature: 'const FOCUS_MONITOR_DEFAULT_OPTIONS: FocusMonitorOptions',
        description: '焦点监视器默认配置常量。',
      },
      {
        name: 'InputModalityDetector',
        signature: 'class InputModalityDetector',
        description: '输入模态检测器：跟踪最近一次交互来源（keyboard/mouse/touch），供焦点监视区分样式。',
      },
      {
        name: 'inputModalityDetector',
        signature: 'const inputModalityDetector = new InputModalityDetector()',
        description: '输入模态检测器模块级单例。',
      },
      {
        name: 'InputModality',
        signature: "type InputModality = 'keyboard' | 'mouse' | 'touch' | null",
        description: '输入模态类型。',
      },
      {
        name: 'InputModalityDetectorOptions',
        signature: 'interface InputModalityDetectorOptions',
        description:
          '输入模态检测器配置：ignoreKeys 为检测键盘输入方式时忽略的按键码列表（默认忽略纯修饰键，避免与鼠标组合操作、VoiceOver 线性导航混淆）。',
      },
      {
        name: 'INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS',
        signature: 'const INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS: InputModalityDetectorOptions',
        description: '输入模态检测器默认配置常量。',
      },
      {
        name: 'TOUCH_BUFFER_MS',
        signature: 'const TOUCH_BUFFER_MS = 650',
        description: '触摸判定缓冲毫秒数：该时间窗内的键盘输入仍归因为触摸。',
      },
    ],
  },
  {
    title: '焦点监视（Vue 绑定与事件工具）',
    rows: [
      {
        name: 'vFocusMonitor',
        signature: 'directive vFocusMonitor',
        description:
          '声明式焦点监视指令：<input v-focus-monitor="origin => ..." /> 回调接收焦点来源；.subtree 修饰符下子元素聚焦也算父元素聚焦。',
      },
      {
        name: 'useFocusMonitor',
        signature: 'useFocusMonitor(options?: FocusMonitorOptions): FocusMonitor',
        description: '组合式焦点监视入口：返回 FocusMonitor 实例，适合在 setup 中创建并按需销毁。',
      },
      {
        name: 'isFakeMousedownFromScreenReader',
        signature: 'isFakeMousedownFromScreenReader(event: MouseEvent): boolean',
        description: '判断 mousedown 是否由屏幕阅读器模拟产生（用于过滤伪事件）。',
      },
      {
        name: 'isFakeTouchstartFromScreenReader',
        signature: 'isFakeTouchstartFromScreenReader(event: TouchEvent): boolean',
        description: '判断 touchstart 是否由屏幕阅读器模拟产生。',
      },
    ],
  },
];
