import type {ApiGroup} from '../api';

/** stepper 模块 API：无样式组件、组合式入口、表单契约及状态类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {title: '无样式组件', titleEn: 'Headless components', rows: [
    {name: 'CdkStepper', signature: 'Component<{linear?; orientation?; selectedIndex?; showError?; displayDefaultIndicatorType?; as?}>', default: 'linear=false, orientation="horizontal", selectedIndex=0', description: '管理步骤注册、线性校验、选择和键盘焦点。支持 v-model:selectedIndex；公开 next、previous、reset、selected、steps 及 ID/位置辅助方法。', descriptionEn: 'Coordinates step registration, linear validation, selection, and keyboard focus. Supports v-model:selectedIndex and exposes next, previous, reset, selected, steps, and ID/position helpers.'},
    {name: 'CdkStep', signature: 'Component<{stepControl?; label?; editable?; optional?; completed?; hasError?; state?; as?}>', default: 'editable=true, optional=false', description: '注册一个步骤并推导 interacted、completed、hasError、isSelected、isNavigable 与 indicatorType；公开 select、reset、markAsInteracted。', descriptionEn: 'Registers a step and derives interacted, completed, hasError, isSelected, isNavigable, and indicatorType. Exposes select, reset, and markAsInteracted.'},
    {name: 'CdkStepHeader', signature: 'Component<{step: CdkStepPublicApi; as?: string | Component}>', default: 'as="button"', description: '可聚焦的步骤头部，自动设置 tab 角色、ARIA 关联并参与方向键、Home/End、Enter/Space 导航。', descriptionEn: 'Focusable step header that sets its tab role and ARIA relationships, and participates in arrow-key, Home/End, and Enter/Space navigation.'},
    {name: 'CdkStepperNext', signature: 'Component<{as?: string | Component; type?: string}>', default: 'as="button", type="submit"', description: '点击后调用最近 Stepper 的 next()。单一表单场景应显式设置 type="button"，避免提前提交。', descriptionEn: 'Calls next() on the nearest Stepper when clicked. In a single-form flow, set type="button" explicitly to avoid submitting the form early.'},
    {name: 'CdkStepperPrevious', signature: 'Component<{as?: string | Component; type?: string}>', default: 'as="button", type="button"', description: '点击后调用最近 Stepper 的 previous()。', descriptionEn: 'Calls previous() on the nearest Stepper when clicked.'},
    {name: 'Stepper events', signature: 'update:selectedIndex / selectedIndexChange / selectionChange / interacted', description: '选择变化提供新旧索引和步骤；步骤首次尝试离开时仅派发一次 interacted。', descriptionEn: 'Selection changes include the current and previous indices and steps. The interacted event is emitted only once when a step is first left.'},
  ]},
  {title: 'Composition API', titleEn: 'Composition API', rows: [
    {name: 'useStepper', signature: 'useStepper(options?: UseStepperOptions): CdkStepperContext', description: '在 setup 中创建并 provide Stepper；适合构建无额外包装或自定义结构的步进器。', descriptionEn: 'Creates and provides a Stepper during setup. Use it to build a stepper without wrapper components or with a custom structure.'},
    {name: 'useStep', signature: 'useStep(options?: UseStepOptions): CdkStepPublicApi', description: '向最近 Stepper 注册步骤并安装卸载清理。输入支持普通值、Ref、computed 或 getter。', descriptionEn: 'Registers a step with the nearest Stepper and installs unmount cleanup. Inputs may be plain values, Refs, computed values, or getters.'},
    {name: 'useStepperContext', signature: 'useStepperContext(): CdkStepperContext', description: '取得最近上下文；不在 Stepper 后代中调用会抛出明确错误。', descriptionEn: 'Returns the nearest Stepper context. Throws a descriptive error when called outside a Stepper descendant.'},
    {name: 'CDK_STEPPER', signature: 'InjectionKey<CdkStepperContext>', description: '自定义 Stepper 子组件所使用的 Vue 注入键。', descriptionEn: 'Vue injection key used by custom Stepper child components.'},
  ]},
  {title: '表单与类型', titleEn: 'Forms and types', rows: [
    {name: 'StepControl', signature: '{valid; invalid?; pending?; reset(): void}', description: '框架无关的表单适配契约。状态支持 boolean、Ref、computed 或 getter；reset 由适配器恢复值、校验与提交状态。', descriptionEn: 'Framework-agnostic form adapter contract. States accept booleans, Refs, computed values, or getters; the adapter reset restores values, validation, and submission state.'},
    {name: 'StepperSelectionEvent', signature: '{selectedIndex; previouslySelectedIndex; selectedStep; previouslySelectedStep}', description: 'selectionChange 的事件载荷。', descriptionEn: 'Payload emitted by selectionChange.'},
    {name: 'STEP_STATE', signature: '{NUMBER; EDIT; DONE; ERROR}', description: 'Angular CDK 兼容的内置指示器状态。StepState 也允许业务自定义字符串。', descriptionEn: 'Built-in indicator states compatible with Angular CDK. StepState also accepts application-defined strings.'},
    {name: 'StepperOrientation', signature: '"horizontal" | "vertical"', description: '决定方向键轴；水平模式同时遵循最近 Directionality 的 LTR/RTL。', descriptionEn: 'Determines the arrow-key axis. Horizontal mode also follows the nearest Directionality context for LTR or RTL.'},
    {name: 'StepContentPositionState', signature: '"previous" | "current" | "next"', description: 'getAnimationDirection 的结果，供调用方实现无样式内容动画。', descriptionEn: 'Result of getAnimationDirection, for callers implementing their own content animations.'},
  ]},
];
