import {
  computed,
  defineComponent,
  h,
  ref,
  watch,
  type PropType,
} from 'vue';
import {useAccordion, type CdkAccordionPublicApi} from './accordion';
import {useAccordionItem} from './accordion-item';

/** CdkAccordion 默认插槽参数。 */
export interface CdkAccordionSlotProps extends CdkAccordionPublicApi {}

/** CdkAccordionItem 默认插槽参数。 */
export interface CdkAccordionItemSlotProps {
  id: string;
  expanded: boolean;
  disabled: boolean;
  open(): void;
  close(): void;
  toggle(): void;
}

/**
 * 无样式 Accordion 容器，对应 Angular CdkAccordion。
 *
 * 组件只负责子项状态协调，默认渲染 div；调用方负责标题、内容区、动画及无障碍标记。
 */
export const CdkAccordion = defineComponent({
  name: 'CdkAccordion',
  inheritAttrs: false,
  props: {
    /** 是否允许多个子项同时展开。 */
    multi: {type: Boolean, default: false},
    /** 自定义协调组 id。 */
    id: {type: String, default: undefined},
    /** 宿主元素或组件，默认 div。 */
    as: {type: [String, Object, Function] as PropType<string | object | ((...args: any[]) => any)>, default: 'div'},
  },
  setup(props, {slots, attrs, expose}) {
    const api = useAccordion({multi: () => props.multi, id: props.id});
    expose(api);
    return () => h(props.as as any, attrs, slots.default?.(api));
  },
});

/**
 * 无样式 Accordion 子项，对应 Angular CdkAccordionItem。
 *
 * expanded 既可由组件内部命令式修改，也可通过 v-model:expanded 与父组件同步。
 */
export const CdkAccordionItem = defineComponent({
  name: 'CdkAccordionItem',
  inheritAttrs: false,
  props: {
    /** 展开状态，支持 v-model:expanded。 */
    expanded: {type: Boolean, default: false},
    /** 是否阻止 open/close/toggle 与父级批量操作。 */
    disabled: {type: Boolean, default: false},
    /** 自定义子项 id。 */
    id: {type: String, default: undefined},
    /** 宿主元素或组件，默认 div。 */
    as: {type: [String, Object, Function] as PropType<string | object | ((...args: any[]) => any)>, default: 'div'},
  },
  emits: {
    'update:expanded': (_value: boolean) => true,
    expandedChange: (_value: boolean) => true,
    opened: () => true,
    closed: () => true,
    destroyed: () => true,
  },
  setup(props, {slots, attrs, emit, expose}) {
    const state = ref(props.expanded);
    let syncingProp = false;
    const api = useAccordionItem({
      expanded: state,
      disabled: () => props.disabled,
      id: props.id,
      emit: {
        expandedChange(value) {
          if (!syncingProp) emit('update:expanded', value);
          emit('expandedChange', value);
        },
        opened: () => emit('opened'),
        closed: () => emit('closed'),
        destroyed: () => emit('destroyed'),
      },
    });

    watch(
      () => props.expanded,
      value => {
        syncingProp = true;
        api.setExpanded(value);
        syncingProp = false;
      },
      {flush: 'sync'},
    );

    const slotProps = computed<CdkAccordionItemSlotProps>(() => ({
      id: api.id,
      expanded: api.expanded.value,
      disabled: api.disabled.value,
      open: api.open,
      close: api.close,
      toggle: api.toggle,
    }));
    expose(api);
    return () => h(props.as as any, attrs, slots.default?.(slotProps.value));
  },
});
