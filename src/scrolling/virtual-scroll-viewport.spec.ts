import {afterEach, describe, expect, it, vi} from 'vitest';
import {defineComponent, nextTick, ref} from 'vue';
import {mount} from '@vue/test-utils';
import {Emitter} from '../emitter';
import {DataSource, type ListRange} from '../collections';
import {mockRect, mockScrollMetrics} from '../../tests/helpers';
import {RtlScrollAxisType} from '../platform';
import {scrollDispatcher} from './scroll-dispatcher';
import {VVirtualFor} from './virtual-for';
import {vVirtualScrollableElement} from './virtual-scrollable-element';
import {VVirtualScrollViewport} from './virtual-scroll-viewport';

const ITEM_SIZE = 50;
const VIEWPORT_HEIGHT = 300;
const DATA = Array.from({length: 100}, (_, i) => `item-${i}`);

/** 视口 defineExpose 的方法签名（测试侧视图）。 */
type ViewportVm = {
  scrollToIndex(index: number, behavior?: ScrollBehavior): void;
  measureRangeSize(range: ListRange): number;
  measureScrollOffset(from?: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end'): number;
  getRenderedRange(): ListRange;
};

function viewportVm(viewport: ReturnType<typeof mountViewport>['viewport']): ViewportVm {
  // @vue/test-utils 嵌套组件的 vm 代理不暴露 expose 出的方法，
  // 通过内部实例的 exposed 对象访问（真实使用场景下父组件 ref 即为暴露实例）。
  const internal = viewport.vm.$ as unknown as {exposed?: ViewportVm};
  return internal.exposed as ViewportVm;
}

// 让 scrollTo 走手动赋值路径（jsdom 未实现原生 scrollTo），
// 并固定 RTL 轴类型为 NORMAL，保证测量语义可预期。
vi.mock('../platform', async importOriginal => {
  const actual = await importOriginal<typeof import('../platform')>();
  return {
    ...actual,
    supportsScrollBehavior: () => false,
    getRtlScrollAxisType: () => RtlScrollAxisType.NORMAL,
  };
});

/** 等待微任务初始化（Promise + Vue nextTick + rAF 合并）完成。 */
async function flushViewport(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
}

/** 等待下一帧，让按帧合并的滚动回调执行。 */
async function flushRafAndTick(): Promise<void> {
  await new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve(undefined));
    } else {
      setTimeout(resolve, 16);
    }
  });
  await nextTick();
}

function mountViewport(options: {
  items?: unknown[];
  itemSize?: number;
  orientation?: 'vertical' | 'horizontal';
  appendOnly?: boolean;
  minBufferPx?: number;
  maxBufferPx?: number;
  scrollWindow?: boolean;
  trackBy?: (index: number, item: unknown) => unknown;
} = {}) {
  const items = ref(options.items ?? DATA);

  const Wrapper = defineComponent({
    components: {VVirtualScrollViewport, VVirtualFor},
    props: {
      itemSize: {type: Number, default: options.itemSize ?? ITEM_SIZE},
      orientation: {type: String, default: options.orientation ?? 'vertical'},
      appendOnly: {type: Boolean, default: options.appendOnly ?? false},
      minBufferPx: {type: Number, default: options.minBufferPx ?? 100},
      maxBufferPx: {type: Number, default: options.maxBufferPx ?? 200},
      scrollWindow: {type: Boolean, default: options.scrollWindow ?? false},
      trackBy: {type: Function, default: options.trackBy},
    },
    setup(props) {
      const scrolledIndices: number[] = [];
      return {items, props, scrolledIndices};
    },
    template: `
      <VVirtualScrollViewport
        ref="viewport"
        :item-size="props.itemSize"
        :orientation="props.orientation"
        :append-only="props.appendOnly"
        :min-buffer-px="props.minBufferPx"
        :max-buffer-px="props.maxBufferPx"
        :scroll-window="props.scrollWindow"
        @scrolled-index-change="scrolledIndices.push($event)"
      >
        <VVirtualFor :of="items" :track-by="props.trackBy" v-slot="{item, index}">
          <div class="vs-item" :data-index="index" :style="{height: '50px'}">{{ item }}</div>
        </VVirtualFor>
      </VVirtualScrollViewport>
    `,
  });

  const wrapper = mount(Wrapper);
  const root = wrapper.element as HTMLElement;
  mockScrollMetrics(root, {
    clientWidth: 400,
    clientHeight: options.orientation === 'horizontal' ? 400 : VIEWPORT_HEIGHT,
    scrollWidth: options.orientation === 'horizontal' ? 5000 : 400,
    scrollHeight: options.orientation === 'horizontal' ? 400 : 5000,
    offsetWidth: 400,
    offsetHeight: options.orientation === 'horizontal' ? 400 : VIEWPORT_HEIGHT,
    scrollTop: 0,
    scrollLeft: 0,
  });

  return {wrapper, root, items, viewport: wrapper.findComponent(VVirtualScrollViewport)};
}

function renderedItems(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('.vs-item').map(node => node.text());
}

afterEach(() => {
  document.documentElement.removeAttribute('dir');
  mockScrollMetrics(document.documentElement, {
    scrollTop: 0,
    scrollLeft: 0,
    clientHeight: 0,
    scrollHeight: 0,
  });
});

describe('VVirtualScrollViewport（固定尺寸纵向）', () => {
  it('初始渲染覆盖视口并设置 spacer 与内容偏移', async () => {
    const {wrapper} = mountViewport();
    await flushViewport();

    const items = renderedItems(wrapper);
    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items[0]).toBe('item-0');

    const spacer = wrapper.find('.vcdk-virtual-scroll-spacer');
    expect(spacer.attributes('style')).toContain('height: 5000px');

    const contentWrapper = wrapper.find('.vcdk-virtual-scroll-content-wrapper');
    expect(contentWrapper.attributes('style')).toContain('translateY(0px)');
    expect(wrapper.find('.vcdk-virtual-scroll-viewport').exists()).toBe(true);
    expect(wrapper.find('.vcdk-virtual-scroll-orientation-vertical').exists()).toBe(true);
    expect(wrapper.find('.vcdk-virtual-scrollable').exists()).toBe(true);

    wrapper.unmount();
  });

  it('滚动后重算渲染区间、偏移并派发 scrolledIndexChange', async () => {
    const {wrapper, root} = mountViewport();
    await flushViewport();

    root.scrollTop = 1500;
    root.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();

    const items = renderedItems(wrapper);
    expect(items.length).toBeGreaterThan(6);
    expect(Number(items[0].slice(5))).toBeGreaterThanOrEqual(20);

    const firstIndex = Number(wrapper.findAll('.vs-item')[0].attributes('data-index'));
    expect(firstIndex).toBeGreaterThanOrEqual(20);
    expect(firstIndex).toBeLessThanOrEqual(30);

    const contentWrapper = wrapper.find('.vcdk-virtual-scroll-content-wrapper');
    // 纵向模式下内容向下位移，把渲染区间起点推到视口可见位置。
    expect(contentWrapper.attributes('style')).toContain(
      `translateY(${firstIndex * ITEM_SIZE}px)`,
    );

    const emitted = wrapper.vm.scrolledIndices as number[];
    expect(emitted).toContain(30);
    wrapper.unmount();
  });

  it('scrollToIndex 滚动到 itemSize * index', async () => {
    const {wrapper, root, viewport} = mountViewport();
    await flushViewport();

    viewportVm(viewport).scrollToIndex(50);
    await nextTick();
    expect(root.scrollTop).toBe(2500);
    wrapper.unmount();
  });

  it('动态追加数据后总内容尺寸增长', async () => {
    const {wrapper, items} = mountViewport();
    await flushViewport();
    expect(wrapper.find('.vcdk-virtual-scroll-spacer').attributes('style')).toContain(
      'height: 5000px',
    );

    items.value = [...items.value, ...Array.from({length: 50}, (_, i) => `extra-${i}`)];
    await flushViewport();
    expect(wrapper.find('.vcdk-virtual-scroll-spacer').attributes('style')).toContain(
      'height: 7500px',
    );
    wrapper.unmount();
  });

  it('原地修改数据内容触发重渲染', async () => {
    const {wrapper, items} = mountViewport();
    await flushViewport();
    expect(renderedItems(wrapper)[0]).toBe('item-0');

    items.value = ['changed-0', ...items.value.slice(1)];
    await flushViewport();
    expect(renderedItems(wrapper)[0]).toBe('changed-0');
    wrapper.unmount();
  });

  it('appendOnly 模式起点保持 0，已渲染项滚出后保留', async () => {
    const {wrapper, root} = mountViewport({appendOnly: true});
    await flushViewport();
    const initialCount = renderedItems(wrapper).length;

    root.scrollTop = 1500;
    root.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();
    const scrolledCount = renderedItems(wrapper).length;
    expect(scrolledCount).toBeGreaterThan(initialCount);
    expect(renderedItems(wrapper)[0]).toBe('item-0');
    wrapper.unmount();
  });

  it('随视口 resize 重新测量并重算', async () => {
    const {wrapper, root} = mountViewport();
    await flushViewport();
    const before = renderedItems(wrapper).length;

    mockScrollMetrics(root, {clientHeight: 600});
    window.dispatchEvent(new Event('resize'));
    await flushRafAndTick();
    const after = renderedItems(wrapper).length;
    expect(after).toBeGreaterThan(before);
    wrapper.unmount();
  });

  it('卸载时从 ScrollDispatcher 注销', async () => {
    const before = scrollDispatcher.scrollContainers.size;
    const {wrapper} = mountViewport();
    await flushViewport();
    expect(scrollDispatcher.scrollContainers.size).toBe(before + 1);
    wrapper.unmount();
    expect(scrollDispatcher.scrollContainers.size).toBe(before);
  });

  it('未提供 itemSize 且无注入策略时抛错', () => {
    const Wrapper = defineComponent({
      components: {VVirtualScrollViewport, VVirtualFor},
      template: `<VVirtualScrollViewport><VVirtualFor :of="[]" v-slot="{item}"><div>{{ item }}</div></VVirtualFor></VVirtualScrollViewport>`,
    });
    expect(() => mount(Wrapper)).toThrow(/itemSize/);
  });
});

describe('VVirtualScrollViewport 横向与 RTL', () => {
  it('横向模式按 scrollLeft 计算渲染区间，spacer 撑宽', async () => {
    const {wrapper, root} = mountViewport({orientation: 'horizontal'});
    await flushViewport();

    expect(wrapper.find('.vcdk-virtual-scroll-orientation-horizontal').exists()).toBe(true);
    expect(wrapper.find('.vcdk-virtual-scroll-spacer').attributes('style')).toContain(
      'width: 5000px',
    );

    root.scrollLeft = 1500;
    root.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();

    const firstIndex = Number(wrapper.findAll('.vs-item')[0].attributes('data-index'));
    expect(firstIndex).toBeGreaterThanOrEqual(20);
    expect(firstIndex).toBeLessThanOrEqual(30);
    wrapper.unmount();
  });

  it('RTL 横向模式下内容沿负 x 轴位移', async () => {
    const {wrapper, root} = mountViewport({orientation: 'horizontal'});
    await flushViewport();
    root.setAttribute('dir', 'rtl');
    await nextTick();

    root.scrollLeft = 1500;
    root.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();

    const transform = wrapper
      .find('.vcdk-virtual-scroll-content-wrapper')
      .attributes('style');
    expect(transform).toContain('translateX(-');
    wrapper.unmount();
  });
});

describe('VVirtualScrollViewport 滚动容器模式', () => {
  it('scrollWindow 使用窗口滚动：自身不加滚动类，document 滚动驱动重算', async () => {
    mockScrollMetrics(document.documentElement, {
      clientHeight: 600,
      scrollHeight: 6000,
      scrollTop: 0,
    });
    const {wrapper} = mountViewport({scrollWindow: true});
    await flushViewport();

    expect(wrapper.find('.vcdk-virtual-scrollable').exists()).toBe(false);
    document.documentElement.scrollTop = 1500;
    document.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();

    const firstIndex = Number(wrapper.findAll('.vs-item')[0].attributes('data-index'));
    expect(firstIndex).toBeGreaterThanOrEqual(20);
    wrapper.unmount();
  });

  it('vVirtualScrollableElement 父容器作为滚动容器', async () => {
    const items = ref(DATA);
    let viewportTop = 0;
    const Wrapper = defineComponent({
      components: {VVirtualScrollViewport, VVirtualFor},
      directives: {virtualScrollableElement: vVirtualScrollableElement},
      template: `
        <div v-virtual-scrollable-element class="scroller" style="overflow:auto;height:300px">
          <VVirtualScrollViewport item-size="50">
            <VVirtualFor :of="items" v-slot="{item, index}">
              <div class="vs-item" :data-index="index" style="height:50px">{{ item }}</div>
            </VVirtualFor>
          </VVirtualScrollViewport>
        </div>
      `,
      setup() {
        return {items};
      },
    });

    const wrapper = mount(Wrapper);
    const scroller = wrapper.element as HTMLElement;
    mockScrollMetrics(scroller, {
      clientHeight: 300,
      clientWidth: 400,
      scrollHeight: 5000,
      scrollWidth: 400,
      scrollTop: 0,
      scrollLeft: 0,
    });
    await flushViewport();

    // 视口不自带滚动类，由父容器滚动。
    expect(wrapper.find('.vcdk-virtual-scroll-viewport .vcdk-virtual-scrollable').exists()).toBe(
      false,
    );

    // 模拟真实浏览器：容器滚动后，作为内容一部分的视口矩形随之上移。
    const viewportRoot = wrapper.find('.vcdk-virtual-scroll-viewport').element as HTMLElement;
    vi.spyOn(viewportRoot, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: viewportTop,
          left: 0,
          right: 400,
          bottom: viewportTop + 300,
          width: 400,
          height: 300,
        }) as DOMRect,
    );

    scroller.scrollTop = 1500;
    viewportTop = -1500;
    scroller.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();

    const firstIndex = Number(wrapper.findAll('.vs-item')[0].attributes('data-index'));
    expect(firstIndex).toBeGreaterThanOrEqual(20);
    wrapper.unmount();
  });
});

describe('VVirtualScrollViewport 数据源', () => {
  it('DataSource 数据流驱动渲染，卸载时 disconnect', async () => {
    const stream = new Emitter<readonly string[]>();
    const connect = vi.fn(() => stream);
    const disconnect = vi.fn();
    const source = {connect, disconnect} as unknown as DataSource<string>;

    const items = ref(source);
    const Wrapper = defineComponent({
      components: {VVirtualScrollViewport, VVirtualFor},
      template: `
        <VVirtualScrollViewport item-size="50">
          <VVirtualFor :of="items" v-slot="{item, index}">
            <div class="vs-item" :data-index="index">{{ item }}</div>
          </VVirtualFor>
        </VVirtualScrollViewport>
      `,
      setup() {
        return {items};
      },
    });
    const wrapper = mount(Wrapper);
    const root = wrapper.element as HTMLElement;
    mockScrollMetrics(root, {
      clientHeight: 300,
      scrollHeight: 5000,
      scrollTop: 0,
      clientWidth: 400,
      scrollWidth: 400,
    });

    // 视口初始化前先发出数据（connect 在 VVirtualFor setup 中完成）。
    stream.next(Array.from({length: 100}, (_, i) => `ds-${i}`));
    await flushViewport();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(renderedItems(wrapper).length).toBeGreaterThan(0);

    stream.next(Array.from({length: 200}, (_, i) => `ds-${i}`));
    await flushViewport();
    expect(wrapper.find('.vcdk-virtual-scroll-spacer').attributes('style')).toContain(
      'height: 10000px',
    );

    wrapper.unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe('VVirtualScrollViewport 测量能力', () => {
  it('measureRangeSize 返回区间内渲染项的组合尺寸', async () => {
    const {wrapper, viewport} = mountViewport();
    await flushViewport();

    const first = wrapper.findAll('.vs-item')[0].element as HTMLElement;
    const second = wrapper.findAll('.vs-item')[1].element as HTMLElement;
    mockRect(first, {top: 0, height: 50, bottom: 50});
    mockRect(second, {top: 50, height: 50, bottom: 100});

    expect(viewportVm(viewport).measureRangeSize({start: 0, end: 2})).toBe(100);
    wrapper.unmount();
  });

  it('measureScrollOffset 以视口起点为基准', async () => {
    const {wrapper, root, viewport} = mountViewport();
    await flushViewport();
    root.scrollTop = 300;
    expect(viewportVm(viewport).measureScrollOffset()).toBe(300);
    wrapper.unmount();
  });

  it('renderRanges 暴露当前渲染区间', async () => {
    const {wrapper, viewport} = mountViewport();
    await flushViewport();
    const range = viewportVm(viewport).getRenderedRange();
    expect(range.start).toBe(0);
    expect(range.end).toBeGreaterThan(0);
    wrapper.unmount();
  });
});
