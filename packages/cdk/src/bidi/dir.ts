import {
  defineComponent,
  h,
  onBeforeUnmount,
  provide,
  watch,
  type Component,
  type PropType,
} from 'vue';
import {Directionality, CDK_DIRECTIONALITY, type Direction} from './directionality';

/** VDir 默认插槽参数。 */
export interface VDirSlotProps {
  /** 当前归一化方向。 */
  direction: Direction;
  /** 当前层级提供的完整方向上下文。 */
  directionality: Directionality;
}

/**
 * 局部方向容器，对应 Angular CDK Dir 指令。
 *
 * Vue 指令不能成为后代 provide 来源，因此用无样式组件承载最近祖先方向上下文。
 * 原始 dir 值会原样写入宿主元素，注入值则归一化为 ltr 或 rtl。
 */
export const VDir = defineComponent({
  name: 'VDir',
  inheritAttrs: false,
  props: {
    /** 原始方向值；auto 按浏览器语言解析，非法值在上下文中回退 ltr。 */
    dir: {type: String, default: 'ltr'},
    /** 宿主元素或组件，默认 div。自定义组件必须透传 dir 属性。 */
    as: {
      type: [String, Object, Function] as PropType<string | Component>,
      default: 'div',
    },
  },
  emits: {
    /** 初始渲染后，归一化方向真实变化时发射。 */
    dirChange: (_direction: Direction) => true,
  },
  setup(props, {attrs, slots, emit, expose}) {
    const directionality = new Directionality(null, props.dir);
    provide(CDK_DIRECTIONALITY, directionality);

    const unsubscribe = directionality.change.subscribe(value => emit('dirChange', value));
    watch(
      () => props.dir,
      value => directionality.setDirection(value),
      {flush: 'sync'},
    );

    onBeforeUnmount(() => {
      unsubscribe();
      directionality.destroy();
    });

    expose(directionality);
    return () =>
      h(
        props.as,
        {...attrs, dir: props.dir},
        slots.default?.({
          direction: directionality.valueSignal.value,
          directionality,
        }),
      );
  },
});

/** Angular API 同名别名；Vue 模板中推荐使用 VDir 以遵循组件命名约定。 */
export const Dir = VDir;
