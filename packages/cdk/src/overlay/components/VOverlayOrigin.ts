import {defineComponent, h, provide, ref, type InjectionKey, type Ref} from 'vue';

/** 由 VOverlayOrigin 提供给后代 VConnectedOverlay 的 origin 元素引用。 */
export const OVERLAY_ORIGIN_KEY: InjectionKey<Ref<HTMLElement | null>> =
  Symbol('vcdk-overlay-origin');

/**
 * 声明式 origin：包裹触发元素并向后代 VConnectedOverlay 提供元素引用。
 *
 * 注意：组件会渲染一个包装元素（默认 div），如需保持 DOM 结构
 * 不变，可直接向 VConnectedOverlay 传 `origin` 属性（元素或 ref）。
 */
export const VOverlayOrigin = defineComponent({
  name: 'VOverlayOrigin',
  props: {
    /** 包装元素标签名。 */
    tag: {type: String, default: 'div'},
  },
  setup(props, {slots, expose}) {
    const element = ref<HTMLElement | null>(null);
    provide(OVERLAY_ORIGIN_KEY, element);
    expose({element});
    return () =>
      h(props.tag, {ref: element, class: 'vcdk-overlay-origin'}, slots.default?.());
  },
});
