import {Fragment, createVNode, defineComponent} from 'vue';
import type {TemplateRenderFn} from './portal';

/**
 * 模板 Portal 的内部渲染载体（@internal，不进公共导出）。
 *
 * 为什么需要这层包装：Vue 的 `render(vnode, el)` 把 VNode 挂到普通 DOM 元素后，
 * 该 VNode 不再属于应用渲染树，父级状态变化不会驱动它更新。把这层组件作为
 * 挂载根后，渲染函数内的响应式依赖（父级 ref、上下文）会进入本组件的 render
 * effect，从而在依赖变化时重渲染，等价 Angular 嵌入视图的变更检测语义。
 */
export const PortalTemplate = defineComponent({
  name: 'VcdkPortalTemplate',
  props: {
    render: {type: Function, required: true},
    context: {type: null, default: null},
  },
  setup(props) {
    return () => {
      const result = (props.render as TemplateRenderFn)(props.context);
      if (Array.isArray(result)) {
        return createVNode(Fragment, null, result);
      }
      return result ?? createVNode(Fragment);
    };
  },
});
