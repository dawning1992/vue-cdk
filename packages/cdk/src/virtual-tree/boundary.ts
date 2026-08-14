/**
 * 虚拟滚动树边界触发组件（内部）。
 *
 * 视图的 `renderedRangeStream` 由 viewport 提供，且只能在视口的后代组件中注入，
 * 因此边界检测放到一个不渲染任何 DOM 的轻量子组件里：每次渲染区间变化都回调
 * 外层树的 `onRange`，由树判断哪些父节点的分页边界被触及。
 */

import {defineComponent, inject, onBeforeUnmount, onMounted} from 'vue';
import type {ListRange} from '../collections';
import {CDK_VIRTUAL_SCROLL_VIEWPORT} from '../scrolling/virtual-scroll-viewport';

/** 渲染区间回调：参数为最新的渲染区间（含 start、不含 end）。 */
export type VirtualTreeRangeCallback = (range: ListRange) => void;

/** 内部边界触发组件：订阅视口渲染区间并转发给树。 */
export const VirtualTreeBoundary = defineComponent({
  name: 'VirtualTreeBoundary',
  props: {
    onRange: {type: Function, required: true},
  },
  setup(props) {
    const viewport = inject(CDK_VIRTUAL_SCROLL_VIEWPORT, null);
    if (!viewport) {
      throw new Error('VirtualTreeBoundary must be used inside a VVirtualScrollViewport.');
    }
    let unsubscribe: (() => void) | undefined;

    onMounted(() => {
      const callback = props.onRange as VirtualTreeRangeCallback;
      unsubscribe = viewport.renderedRangeStream.subscribe(range => callback(range));
    });

    onBeforeUnmount(() => {
      unsubscribe?.();
      unsubscribe = undefined;
    });

    return () => null;
  },
});
