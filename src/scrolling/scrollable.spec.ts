import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {defineComponent, h, nextTick, ref} from 'vue';
import {mount} from '@vue/test-utils';
import {mockScrollMetrics} from '../../tests/helpers';
import {RtlScrollAxisType} from '../platform';
import {scrollDispatcher} from './scroll-dispatcher';
import {Scrollable, useScrollable, vScrollable} from './scrollable';

// 平台模块整体 mock：仅替换 RTL 轴类型与 scroll-behavior 探测结果，
// 其余能力保持真实实现，从而覆盖三种 RTL 轴类型分支。
const mockState = vi.hoisted(() => ({rtlAxisType: 0, supportsBehavior: false}));

vi.mock('../platform', async importOriginal => {
  const actual = await importOriginal<typeof import('../platform')>();
  return {
    ...actual,
    getRtlScrollAxisType: () => mockState.rtlAxisType,
    supportsScrollBehavior: () => mockState.supportsBehavior,
  };
});

/** 创建带滚动几何指标的容器。 */
function createScrollContainer(options: {
  clientWidth?: number;
  clientHeight?: number;
  scrollWidth?: number;
  scrollHeight?: number;
  dir?: string;
} = {}): HTMLElement {
  const el = document.createElement('div');
  if (options.dir) {
    el.setAttribute('dir', options.dir);
  }
  mockScrollMetrics(el, {
    clientWidth: options.clientWidth ?? 100,
    clientHeight: options.clientHeight ?? 100,
    scrollWidth: options.scrollWidth ?? 500,
    scrollHeight: options.scrollHeight ?? 500,
    scrollTop: 0,
    scrollLeft: 0,
  });
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  vi.useRealTimers();
  mockState.rtlAxisType = RtlScrollAxisType.NORMAL;
  mockState.supportsBehavior = false;
});

describe('Scrollable 测量与滚动（LTR）', () => {
  let el: HTMLElement;
  let scrollable: Scrollable;

  beforeEach(() => {
    el = createScrollContainer();
    scrollable = new Scrollable(() => el);
  });

  it('初始各边偏移：top/left/start 为 0，bottom/right/end 为最大值', () => {
    expect(scrollable.measureScrollOffset('top')).toBe(0);
    expect(scrollable.measureScrollOffset('bottom')).toBe(400);
    expect(scrollable.measureScrollOffset('left')).toBe(0);
    expect(scrollable.measureScrollOffset('right')).toBe(400);
    expect(scrollable.measureScrollOffset('start')).toBe(0);
    expect(scrollable.measureScrollOffset('end')).toBe(400);
  });

  it('scrollTo top/left 直接写入 scrollTop/scrollLeft', () => {
    scrollable.scrollTo({top: 120, left: 40});
    expect(el.scrollTop).toBe(120);
    expect(el.scrollLeft).toBe(40);
  });

  it('scrollTo bottom/right 换算为 top/left', () => {
    scrollable.scrollTo({bottom: 0, right: 0});
    expect(el.scrollTop).toBe(400);
    expect(el.scrollLeft).toBe(400);
  });

  it('支持 scroll-behavior 时调用原生 scrollTo', () => {
    mockState.supportsBehavior = true;
    const scrollTo = vi.fn();
    // jsdom 的元素上没有原生 scrollTo，直接替换为 spy。
    el.scrollTo = scrollTo as unknown as typeof el.scrollTo;
    scrollable.scrollTo({top: 10, left: 10});
    expect(scrollTo).toHaveBeenCalledWith({top: 10, left: 10, behavior: undefined});
  });

  it('不修改调用方传入的 options 对象', () => {
    const options = {top: 10, left: 10};
    scrollable.scrollTo(options);
    expect(options).toEqual({top: 10, left: 10});
  });
});

describe('Scrollable 测量与滚动（RTL NORMAL）', () => {
  it('start 映射到 right、end 映射到 left', () => {
    const el = createScrollContainer({dir: 'rtl'});
    const scrollable = new Scrollable(() => el);
    el.scrollLeft = 400;

    expect(scrollable.measureScrollOffset('start')).toBe(0);
    expect(scrollable.measureScrollOffset('end')).toBe(400);

    scrollable.scrollTo({start: 0});
    expect(el.scrollLeft).toBe(400);
    scrollable.scrollTo({end: 0});
    expect(el.scrollLeft).toBe(0);
  });
});

describe('Scrollable 测量与滚动（RTL NEGATED / INVERTED）', () => {
  it('NEGATED：left 偏移 = scrollLeft + max，scrollTo start 写入负值', () => {
    mockState.rtlAxisType = RtlScrollAxisType.NEGATED;
    const el = createScrollContainer({dir: 'rtl'});
    const scrollable = new Scrollable(() => el);
    el.scrollLeft = -300;

    expect(scrollable.measureScrollOffset('left')).toBe(100);
    expect(scrollable.measureScrollOffset('right')).toBe(300);

    scrollable.scrollTo({start: 0});
    // NEGATED 中完全靠右（start 起点）时 scrollLeft 为 0。
    expect(el.scrollLeft).toBe(0);
    scrollable.scrollTo({end: 0});
    expect(el.scrollLeft).toBe(-400);
  });

  it('INVERTED：left 偏移 = max - scrollLeft，scrollTo end 写入正值', () => {
    mockState.rtlAxisType = RtlScrollAxisType.INVERTED;
    const el = createScrollContainer({dir: 'rtl'});
    const scrollable = new Scrollable(() => el);
    el.scrollLeft = 100;

    expect(scrollable.measureScrollOffset('left')).toBe(300);
    expect(scrollable.measureScrollOffset('right')).toBe(100);

    scrollable.scrollTo({start: 0});
    // INVERTED 中完全靠右（start 起点）时 scrollLeft 为 0。
    expect(el.scrollLeft).toBe(0);
    scrollable.scrollTo({end: 0});
    expect(el.scrollLeft).toBe(400);
  });
});

describe('Scrollable 生命周期', () => {
  it('attach 后注册到分发器，destroy 后注销', () => {
    const dispatcher = scrollDispatcher;
    const el = createScrollContainer();
    const scrollable = new Scrollable(() => el);

    scrollable.attach();
    expect(dispatcher.scrollContainers.has(scrollable)).toBe(true);

    scrollable.destroy();
    expect(dispatcher.scrollContainers.has(scrollable)).toBe(false);
    el.remove();
  });

  it('attach 与 destroy 均幂等', () => {
    const el = createScrollContainer();
    const scrollable = new Scrollable(() => el);
    scrollable.attach();
    scrollable.attach();
    expect(scrollDispatcher.scrollContainers.size).toBe(1);
    scrollable.destroy();
    scrollable.destroy();
    expect(scrollDispatcher.scrollContainers.size).toBe(0);
    el.remove();
  });

  it('destroy 后 elementScrolled 结束，不再派发', () => {
    const el = createScrollContainer();
    const scrollable = new Scrollable(() => el);
    const spy = vi.fn();
    const unsubscribe = scrollable.elementScrolled().subscribe(spy);
    scrollable.destroy();
    el.dispatchEvent(new Event('scroll'));
    expect(spy).not.toHaveBeenCalled();
    unsubscribe();
    el.remove();
  });
});

describe('vScrollable 指令', () => {
  it('挂载注册、卸载注销，滚动转发到分发器', async () => {
    const Comp = defineComponent({
      directives: {scrollable: vScrollable},
      template: `<div v-scrollable ref="el" style="overflow:auto"></div>`,
    });
    const wrapper = mount(Comp);
    const el = wrapper.element as HTMLElement;
    expect(scrollDispatcher.scrollContainers.size).toBe(1);

    let hits = 0;
    const unsubscribe = scrollDispatcher.scrolled(0).subscribe(() => hits++);
    el.dispatchEvent(new Event('scroll'));
    expect(hits).toBe(1);
    unsubscribe();

    wrapper.unmount();
    expect(scrollDispatcher.scrollContainers.size).toBe(0);
  });
});

describe('useScrollable', () => {
  it('随组件挂载注册、卸载注销', async () => {
    const Comp = defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null);
        const scrollable = useScrollable(el);
        return {el, scrollable};
      },
      template: `<div ref="el"></div>`,
    });
    const wrapper = mount(Comp);
    await nextTick();

    const scrollable = wrapper.vm.scrollable as Scrollable;
    expect(scrollDispatcher.scrollContainers.has(scrollable)).toBe(true);

    wrapper.unmount();
    expect(scrollDispatcher.scrollContainers.has(scrollable)).toBe(false);
  });

  it('接受延迟解析函数形式的元素', async () => {
    const el = createScrollContainer();
    let scrollable: Scrollable | null = null;
    const Comp = defineComponent({
      setup() {
        scrollable = useScrollable(() => el);
        return () => h('div');
      },
    });
    const wrapper = mount(Comp);
    await nextTick();
    expect(scrollDispatcher.scrollContainers.has(scrollable!)).toBe(true);
    wrapper.unmount();
    expect(scrollDispatcher.scrollContainers.has(scrollable!)).toBe(false);
    el.remove();
  });
});
