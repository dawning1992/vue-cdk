import {computed, defineComponent, h, ref, watch, type PropType} from 'vue';
import {
  STEP_STATE,
  useStep,
  useStepHeader,
  useStepper,
  useStepperContext,
  type CdkStepPublicApi,
  type StepControl,
  type StepState,
  type StepperOrientation,
} from './stepper';

const asProp = {type: [String, Object, Function] as PropType<any>, default: 'div'};

/** 无样式 Stepper 容器；默认插槽获得完整公开实例。 */
export const CdkStepper = defineComponent({
  name: 'CdkStepper', inheritAttrs: false,
  props: {
    linear: {type: Boolean, default: false},
    orientation: {type: String as PropType<StepperOrientation>, default: 'horizontal'},
    selectedIndex: {type: Number, default: 0},
    id: {type: String, default: undefined},
    showError: {type: Boolean, default: false},
    displayDefaultIndicatorType: {type: Boolean, default: true},
    as: asProp,
  },
  emits: {
    'update:selectedIndex': (_value: number) => true,
    selectedIndexChange: (_value: number) => true,
    selectionChange: (_value: object) => true,
  },
  setup(props, {slots, attrs, emit, expose}) {
    const host = ref<HTMLElement | null>(null);
    const index = ref(props.selectedIndex);
    let syncing = false;
    const api = useStepper({
      id: props.id, host, selectedIndex: index,
      linear: () => props.linear, orientation: () => props.orientation,
      showError: () => props.showError,
      displayDefaultIndicatorType: () => props.displayDefaultIndicatorType,
      emitSelectionChange: event => emit('selectionChange', event),
      emitSelectedIndexChange: value => {
        if (!syncing) emit('update:selectedIndex', value);
        emit('selectedIndexChange', value);
      },
    });
    watch(() => props.selectedIndex, value => {
      if (!api.steps.value.length || value === api.selectedIndex.value) return;
      syncing = true;
      api.setSelectedIndex(value);
      syncing = false;
    }, {flush: 'post'});
    expose(api);
    return () => h(props.as, {...attrs, ref: host, onKeydown: api.handleKeydown}, slots.default?.(api));
  },
});

/** 无样式步骤；默认插槽获得响应式解包后的步骤状态和命令。 */
export const CdkStep = defineComponent({
  name: 'CdkStep', inheritAttrs: false,
  props: {
    id: {type: String, default: undefined}, label: {type: String, default: ''},
    errorMessage: {type: String, default: ''}, ariaLabel: {type: String, default: undefined},
    ariaLabelledby: {type: String, default: undefined}, state: {type: String as PropType<StepState>, default: STEP_STATE.NUMBER},
    editable: {type: Boolean, default: true}, optional: {type: Boolean, default: false},
    completed: {type: null as unknown as PropType<boolean | undefined>, default: undefined},
    hasError: {type: null as unknown as PropType<boolean | undefined>, default: undefined},
    stepControl: {type: Object as PropType<StepControl>, default: undefined},
    showError: {type: null as unknown as PropType<boolean | undefined>, default: undefined},
    displayDefaultIndicatorType: {type: null as unknown as PropType<boolean | undefined>, default: undefined},
    as: asProp,
  },
  emits: {interacted: (_step: CdkStepPublicApi) => true},
  setup(props, {slots, attrs, emit, expose}) {
    const stepper = useStepperContext();
    const api = useStep({
      id: props.id, label: () => props.label, editable: () => props.editable,
      optional: () => props.optional, completed: () => props.completed, hasError: () => props.hasError,
      state: () => props.state, stepControl: () => props.stepControl, showError: () => props.showError,
      displayDefaultIndicatorType: () => props.displayDefaultIndicatorType,
      emitInteracted: step => emit('interacted', step),
    });
    const slotProps = computed(() => ({
      ...api, index: api.index.value, interacted: api.interacted.value, completed: api.completed.value,
      hasError: api.hasError.value, isSelected: api.isSelected.value, isNavigable: api.isNavigable.value,
      indicatorType: api.indicatorType.value,
    }));
    expose(api);
    return () => h(props.as, {
      ...attrs, id: stepper.getStepContentId(api.index.value), role: 'tabpanel',
      'aria-labelledby': props.ariaLabel ? undefined : props.ariaLabelledby,
    }, slots.default?.(slotProps.value));
  },
});

/** 可聚焦步骤头部，自动注册键盘导航并补齐 tab 语义。 */
export const CdkStepHeader = defineComponent({
  name: 'CdkStepHeader', inheritAttrs: false,
  props: {step: {type: Object as PropType<CdkStepPublicApi>, required: true}, as: {...asProp, default: 'button'}},
  setup(props, {slots, attrs}) {
    const stepper = useStepperContext();
    const element = ref<HTMLElement | null>(null);
    useStepHeader(element, () => props.step);
    return () => h(props.as, {
      ...attrs, ref: element, role: 'tab', type: props.as === 'button' ? 'button' : undefined,
      id: stepper.getStepLabelId(props.step.index.value),
      tabindex: stepper.getFocusIndex() === props.step.index.value ? 0 : -1,
      'aria-selected': props.step.isSelected.value,
      'aria-controls': stepper.getStepContentId(props.step.index.value),
      'aria-disabled': !props.step.isNavigable.value,
      onClick: (event: MouseEvent) => { (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(event); props.step.select(); },
    }, slots.default?.({step: props.step}));
  },
});

function navigationComponent(name: string, direction: 'next' | 'previous', defaultType: string) {
  return defineComponent({
    name, inheritAttrs: false,
    props: {as: {...asProp, default: 'button'}, type: {type: String, default: defaultType}},
    setup(props, {slots, attrs}) {
      const stepper = useStepperContext();
      return () => h(props.as, {
        ...attrs, type: props.type,
        onClick: (event: MouseEvent) => { (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(event); stepper[direction](); },
      }, slots.default?.());
    },
  });
}

/** 点击后前进到下一步骤，默认 type="submit"。 */
export const CdkStepperNext = navigationComponent('CdkStepperNext', 'next', 'submit');
/** 点击后返回上一步骤，默认 type="button"。 */
export const CdkStepperPrevious = navigationComponent('CdkStepperPrevious', 'previous', 'button');
