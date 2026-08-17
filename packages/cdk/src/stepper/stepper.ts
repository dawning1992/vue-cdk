/**
 * 移植自 Angular CDK stepper（https://github.com/angular/components，MIT License）。
 * Vue 版本使用 provide/inject、Ref 与作用域插槽替代 Angular QueryList、Signal 和模板指令。
 */
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  readonly,
  ref,
  shallowRef,
  toValue,
  watch,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue';
import {FocusKeyManager, type FocusableOption} from '../a11y';
import {useDirectionality} from '../bidi';
import {ENTER, SPACE} from '../a11y/keycodes';
import {hasModifierKey} from '../platform';

/** 步骤内容相对当前步骤的位置，用于调用方实现切换动画。 */
export type StepContentPositionState = 'previous' | 'current' | 'next';

/** 步进器的布局方向。 */
export type StepperOrientation = 'horizontal' | 'vertical';

/** 步骤指示器状态；允许业务扩展自定义状态字符串。 */
export type StepState = 'number' | 'edit' | 'done' | 'error' | string;

/** Angular CDK 兼容的内置步骤状态。 */
export const STEP_STATE = {NUMBER: 'number', EDIT: 'edit', DONE: 'done', ERROR: 'error'} as const;

/**
 * Vue 表单与 Stepper 之间的最小适配契约。
 *
 * 状态字段均可传普通值、Ref、computed 或 getter。reset 必须由适配器恢复表单值、
 * 校验状态和提交状态；Stepper 不假设 VeeValidate 等具体表单库。
 */
export interface StepControl {
  readonly valid: MaybeRefOrGetter<boolean>;
  readonly invalid?: MaybeRefOrGetter<boolean>;
  readonly pending?: MaybeRefOrGetter<boolean>;
  reset(): void;
}

/** Stepper 的全局行为选项，可通过 useStepper/CdkStepper 逐实例配置。 */
export interface StepperOptions {
  /** 是否允许未选中的错误步骤显示 error 状态，默认 false。 */
  showError?: MaybeRefOrGetter<boolean>;
  /** 是否使用 Angular CDK 默认指示器状态推导，默认 true。 */
  displayDefaultIndicatorType?: MaybeRefOrGetter<boolean>;
}

/** 选择发生变化时发出的事件。 */
export interface StepperSelectionEvent {
  selectedIndex: number;
  previouslySelectedIndex: number;
  selectedStep: CdkStepPublicApi;
  previouslySelectedStep: CdkStepPublicApi;
}

/** 步骤状态及命令式能力的稳定公开契约。 */
export interface CdkStepPublicApi {
  readonly id: string;
  readonly index: Ref<number>;
  readonly label: ComputedRef<string>;
  readonly editable: ComputedRef<boolean>;
  readonly optional: ComputedRef<boolean>;
  readonly interacted: Readonly<Ref<boolean>>;
  readonly completed: ComputedRef<boolean>;
  /** 显式 completed 输入；仅供线性校验区分覆盖值与默认推导。 */
  readonly completedOverride: ComputedRef<boolean | undefined>;
  readonly hasError: ComputedRef<boolean>;
  readonly isSelected: ComputedRef<boolean>;
  readonly isNavigable: ComputedRef<boolean>;
  readonly indicatorType: ComputedRef<StepState>;
  readonly stepControl: ComputedRef<StepControl | undefined>;
  select(): void;
  reset(): void;
  markAsInteracted(): void;
}

/** 步进器状态及命令式能力的稳定公开契约。 */
export interface CdkStepperPublicApi {
  readonly id: string;
  readonly linear: ComputedRef<boolean>;
  readonly orientation: ComputedRef<StepperOrientation>;
  readonly selectedIndex: Readonly<Ref<number>>;
  readonly selected: ComputedRef<CdkStepPublicApi | undefined>;
  readonly steps: Readonly<ShallowRef<readonly CdkStepPublicApi[]>>;
  setSelectedIndex(index: number): boolean;
  next(): void;
  previous(): void;
  reset(): void;
  getStepLabelId(index: number): string;
  getStepContentId(index: number): string;
  getAnimationDirection(index: number): StepContentPositionState;
  getFocusIndex(): number;
}

interface StepHeaderController extends FocusableOption {
  readonly step: CdkStepPublicApi;
  readonly element: HTMLElement;
  focus(): void;
}

/** Stepper 内部上下文；注册方法仅供同模块组件与组合式函数使用。 */
export interface CdkStepperContext extends CdkStepperPublicApi {
  readonly showError: ComputedRef<boolean>;
  readonly displayDefaultIndicatorType: ComputedRef<boolean>;
  registerStep(step: CdkStepPublicApi): () => void;
  registerHeader(header: StepHeaderController): () => void;
  handleKeydown(event: KeyboardEvent): void;
}

/** 最近 Stepper 上下文的注入键。 */
export const CDK_STEPPER: InjectionKey<CdkStepperContext> = Symbol('CDK_STEPPER');

let nextStepperId = 0;
let nextStepId = 0;

/** useStepper 的创建参数。 */
export interface UseStepperOptions extends StepperOptions {
  id?: string;
  linear?: MaybeRefOrGetter<boolean>;
  orientation?: MaybeRefOrGetter<StepperOrientation>;
  selectedIndex?: Ref<number>;
  host?: Ref<HTMLElement | null>;
  emitSelectionChange?(event: StepperSelectionEvent): void;
  emitSelectedIndexChange?(index: number): void;
}

/**
 * 创建 Stepper 协调上下文并提供给后代。
 *
 * 必须在组件 setup 阶段调用。步骤与头部会按 DOM/挂载顺序注册；卸载时由各自作用域清理。
 */
export function useStepper(options: UseStepperOptions = {}): CdkStepperContext {
  const id = options.id || `cdk-stepper-${nextStepperId++}`;
  const linear = computed(() => Boolean(toValue(options.linear ?? false)));
  const orientation = computed(() => toValue(options.orientation ?? 'horizontal'));
  const showError = computed(() => Boolean(toValue(options.showError ?? false)));
  const displayDefaultIndicatorType = computed(() => toValue(options.displayDefaultIndicatorType ?? true) !== false);
  const selectedIndex = options.selectedIndex ?? ref(0);
  const steps = shallowRef<readonly CdkStepPublicApi[]>([]);
  const headers = shallowRef<readonly StepHeaderController[]>([]);
  const directionality = useDirectionality();
  const keyManager = new FocusKeyManager(headers as Ref<readonly StepHeaderController[]>)
    .withWrap()
    .withHomeAndEnd();

  watch(
    [orientation, directionality.valueSignal],
    ([layout, direction]) => {
      keyManager.withVerticalOrientation(layout === 'vertical');
      keyManager.withHorizontalOrientation(layout === 'horizontal' ? direction : null);
    },
    {immediate: true, flush: 'sync'},
  );

  const selected = computed(() => steps.value[selectedIndex.value]);
  let initialized = false;

  function updateIndexes(): void {
    steps.value.forEach((step, index) => {
      step.index.value = index;
    });
    if (initialized) {
      if (steps.value.length === 0) selectedIndex.value = 0;
      else if (selectedIndex.value >= steps.value.length) selectedIndex.value = steps.value.length - 1;
    }
    keyManager.updateActiveItem(Math.min(selectedIndex.value, Math.max(headers.value.length - 1, 0)));
  }

  function isIncomplete(step: CdkStepPublicApi): boolean {
    const control = step.stepControl.value;
    if (!control) return !step.completed.value;
    const invalid = control.invalid == null ? !Boolean(toValue(control.valid)) : Boolean(toValue(control.invalid));
    return invalid || Boolean(toValue(control.pending ?? false)) || !step.interacted.value;
  }

  function blockedByPreviousStep(index: number): boolean {
    return linear.value && index >= 0 && steps.value.slice(0, index).some(step =>
      isIncomplete(step) && !step.optional.value && !Boolean(step.completedOverride.value),
    );
  }

  function containsFocus(): boolean {
    const host = options.host?.value;
    const active = host?.ownerDocument.activeElement;
    return Boolean(host && active && (host === active || host.contains(active)));
  }

  function setSelectedIndex(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= steps.value.length) {
      throw new Error('CdkStepper: 不能把 selectedIndex 设置为越界值。');
    }
    if (index === selectedIndex.value) return false;
    const previousIndex = selectedIndex.value;
    const previousStep = steps.value[previousIndex];
    const nextStep = steps.value[index];
    previousStep?.markAsInteracted();
    if (blockedByPreviousStep(index) || (index < previousIndex && !nextStep.editable.value)) return false;

    options.emitSelectionChange?.({
      selectedIndex: index,
      previouslySelectedIndex: previousIndex,
      selectedStep: nextStep,
      previouslySelectedStep: previousStep,
    });
    containsFocus() ? keyManager.setActiveItem(index) : keyManager.updateActiveItem(index);
    selectedIndex.value = index;
    options.emitSelectedIndexChange?.(index);
    return true;
  }

  const context: CdkStepperContext = {
    id,
    linear,
    orientation,
    showError,
    displayDefaultIndicatorType,
    selectedIndex: readonly(selectedIndex),
    selected,
    // shallowRef 保留步骤对象中的 ComputedRef 类型；公开类型仅允许读取该引用。
    steps,
    registerStep(step) {
      steps.value = [...steps.value, step];
      updateIndexes();
      return () => {
        steps.value = steps.value.filter(item => item !== step);
        updateIndexes();
      };
    },
    registerHeader(header) {
      headers.value = [...headers.value, header].sort((a, b) => {
        const position = a.element.compareDocumentPosition(b.element);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
      keyManager.updateActiveItem(selectedIndex.value);
      return () => {
        headers.value = headers.value.filter(item => item !== header);
      };
    },
    setSelectedIndex,
    next() {
      if (steps.value.length) setSelectedIndex(Math.min(selectedIndex.value + 1, steps.value.length - 1));
    },
    previous() {
      if (steps.value.length) setSelectedIndex(Math.max(selectedIndex.value - 1, 0));
    },
    reset() {
      steps.value.forEach(step => step.reset());
      if (steps.value.length && selectedIndex.value !== 0) {
        const previousIndex = selectedIndex.value;
        selectedIndex.value = 0;
        options.emitSelectionChange?.({selectedIndex: 0, previouslySelectedIndex: previousIndex, selectedStep: steps.value[0], previouslySelectedStep: steps.value[previousIndex]});
        options.emitSelectedIndexChange?.(0);
      }
      keyManager.updateActiveItem(0);
    },
    getStepLabelId(index) { return `${id}-label-${index}`; },
    getStepContentId(index) { return `${id}-content-${index}`; },
    getAnimationDirection(index) {
      const delta = index - selectedIndex.value;
      if (delta === 0) return 'current';
      const before = delta < 0;
      return directionality.value === 'rtl' ? (before ? 'next' : 'previous') : (before ? 'previous' : 'next');
    },
    getFocusIndex() { return keyManager.activeItemIndex < 0 ? selectedIndex.value : keyManager.activeItemIndex; },
    handleKeydown(event) {
      if (keyManager.activeItemIndex >= 0 && !hasModifierKey(event) && (event.keyCode === SPACE || event.keyCode === ENTER)) {
        setSelectedIndex(keyManager.activeItemIndex);
        event.preventDefault();
      } else {
        keyManager.setFocusOrigin('keyboard').onKeydown(event);
      }
    },
  };

  provide(CDK_STEPPER, context);
  onMounted(() => {
    initialized = true;
    if (!Number.isInteger(selectedIndex.value) || selectedIndex.value < 0 || selectedIndex.value >= steps.value.length) {
      selectedIndex.value = 0;
    }
    if (linear.value && selectedIndex.value > 0) {
      steps.value.slice(0, selectedIndex.value).forEach(step => step.markAsInteracted());
    }
    updateIndexes();
  });
  onBeforeUnmount(() => keyManager.destroy());
  return context;
}

/** 返回最近的 Stepper 上下文；缺失时抛出可定位的使用错误。 */
export function useStepperContext(): CdkStepperContext {
  const context = inject(CDK_STEPPER, null);
  if (!context) throw new Error('Stepper 子组件必须在 CdkStepper 或 useStepper 提供的上下文中使用。');
  return context;
}

/** useStep 的创建参数。 */
export interface UseStepOptions {
  id?: string;
  label?: MaybeRefOrGetter<string>;
  editable?: MaybeRefOrGetter<boolean>;
  optional?: MaybeRefOrGetter<boolean>;
  completed?: MaybeRefOrGetter<boolean | undefined>;
  hasError?: MaybeRefOrGetter<boolean | undefined>;
  state?: MaybeRefOrGetter<StepState | undefined>;
  stepControl?: MaybeRefOrGetter<StepControl | undefined>;
  showError?: MaybeRefOrGetter<boolean | undefined>;
  displayDefaultIndicatorType?: MaybeRefOrGetter<boolean | undefined>;
  emitInteracted?(step: CdkStepPublicApi): void;
}

/** 创建并向最近 Stepper 注册一个步骤，作用域销毁时自动注销。 */
export function useStep(options: UseStepOptions = {}): CdkStepPublicApi {
  const stepper = useStepperContext();
  const index = ref(-1);
  const interacted = ref(false);
  const stepControl = computed(() => toValue(options.stepControl));
  const completedOverrideState = ref<boolean | undefined>(toValue(options.completed));
  const errorOverrideState = ref<boolean | undefined>(toValue(options.hasError));
  watch(() => toValue(options.completed), value => { completedOverrideState.value = value; }, {flush: 'sync'});
  watch(() => toValue(options.hasError), value => { errorOverrideState.value = value; }, {flush: 'sync'});
  const completedOverride = computed(() => completedOverrideState.value);
  const completed = computed(() => {
    const override = completedOverride.value;
    if (override != null) return override;
    const control = stepControl.value;
    return interacted.value && (!control || Boolean(toValue(control.valid)));
  });
  const hasError = computed(() => {
    const override = errorOverrideState.value;
    if (override != null) return override;
    const control = stepControl.value;
    return Boolean(interacted.value && control && (control.invalid == null ? !toValue(control.valid) : toValue(control.invalid)));
  });
  const editable = computed(() => toValue(options.editable ?? true));
  let api: CdkStepPublicApi;
  api = {
    id: options.id || `cdk-step-${nextStepId++}`,
    index,
    label: computed(() => toValue(options.label ?? '')),
    editable,
    optional: computed(() => Boolean(toValue(options.optional ?? false))),
    interacted: readonly(interacted),
    completed,
    completedOverride,
    hasError,
    isSelected: computed(() => stepper.selectedIndex.value === index.value),
    isNavigable: computed(() => completed.value || stepper.selectedIndex.value === index.value || !stepper.linear.value),
    indicatorType: computed(() => {
      const selected = stepper.selectedIndex.value === index.value;
      const defaultState = toValue(options.state) ?? STEP_STATE.NUMBER;
      const errorDisplayEnabled = Boolean(toValue(options.showError ?? stepper.showError)) || errorOverrideState.value != null;
      if (errorDisplayEnabled && hasError.value && !selected) return STEP_STATE.ERROR;
      if (toValue(options.displayDefaultIndicatorType ?? stepper.displayDefaultIndicatorType)) {
        if (!completed.value || selected) return STEP_STATE.NUMBER;
        return editable.value ? STEP_STATE.EDIT : STEP_STATE.DONE;
      }
      if (completed.value && !selected) return STEP_STATE.DONE;
      if (completed.value && selected) return defaultState;
      return editable.value && selected ? STEP_STATE.EDIT : defaultState;
    }),
    stepControl,
    select() { stepper.setSelectedIndex(index.value); },
    reset() {
      interacted.value = false;
      if (completedOverrideState.value != null) completedOverrideState.value = false;
      if (errorOverrideState.value != null) errorOverrideState.value = false;
      stepControl.value?.reset();
    },
    markAsInteracted() {
      if (interacted.value) return;
      interacted.value = true;
      options.emitInteracted?.(api);
    },
  };
  const unregister = stepper.registerStep(api);
  onBeforeUnmount(unregister);
  return api;
}

/** 在头部组件挂载后注册焦点控制器。 */
export function useStepHeader(element: Ref<HTMLElement | null>, step: MaybeRefOrGetter<CdkStepPublicApi>): void {
  const stepper = useStepperContext();
  let unregister: (() => void) | undefined;
  onMounted(() => {
    if (!element.value) return;
    const header: StepHeaderController = {
      step: toValue(step),
      element: element.value,
      get disabled() { return !header.step.isNavigable.value; },
      focus() { header.element.focus(); },
    };
    unregister = stepper.registerHeader(header);
  });
  onBeforeUnmount(() => unregister?.());
}
