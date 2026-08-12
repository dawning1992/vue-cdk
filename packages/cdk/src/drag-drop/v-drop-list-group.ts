/**
 * 拖放列表分组组件，对应 Angular CDK 的 CdkDropListGroup。
 * 只渲染默认插槽（无额外 DOM），把组上下文提供给子 VDropList。
 */

import {defineComponent, provide, ref, watch, type InjectionKey, type Ref} from 'vue';
import type {VDropListPublicApi} from './v-drop-list';

/** 组上下文：子列表共享禁用状态并自动互联。 */
export interface VDropListGroupContext {
  disabled: Ref<boolean>;
  items: Set<VDropListPublicApi>;
}

/** 组上下文注入键。 */
export const VCDK_DROP_LIST_GROUP: InjectionKey<VDropListGroupContext> = Symbol(
  'vcdk-drop-list-group',
);

/** 连接兄弟拖放列表的分组组件。 */
export const VDropListGroup = defineComponent({
  name: 'VDropListGroup',
  props: {
    /** 禁用组内所有列表的拖拽。 */
    disabled: {type: Boolean, default: false},
  },
  setup(props, {slots}) {
    const disabled = ref(props.disabled);
    watch(
      () => props.disabled,
      value => {
        disabled.value = value;
      },
    );
    provide<VDropListGroupContext>(VCDK_DROP_LIST_GROUP, {
      disabled,
      items: new Set(),
    });
    return () => slots.default?.() ?? [];
  },
});
