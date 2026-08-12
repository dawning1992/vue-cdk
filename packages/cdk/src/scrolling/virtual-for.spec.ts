import {afterEach, describe, expect, it, vi} from 'vitest';
import {defineComponent, nextTick, ref} from 'vue';
import {mount} from '@vue/test-utils';
import {Emitter} from '../emitter';
import {DataSource, type CollectionViewer, type ListRange} from '../collections';
import {mockScrollMetrics} from '../../tests/helpers';
import {VVirtualFor} from './virtual-for';
import {VVirtualScrollViewport} from './virtual-scroll-viewport';

const DATA = Array.from({length: 100}, (_, i) => `item-${i}`);

async function flushViewport(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
}

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

function mountFor(options: {items?: unknown[]; trackBy?: (index: number, item: unknown) => unknown} = {}) {
  const items = ref(options.items ?? DATA);
  const Wrapper = defineComponent({
    components: {VVirtualScrollViewport, VVirtualFor},
    props: {
      trackBy: {type: Function, default: options.trackBy},
    },
    template: `
      <VVirtualScrollViewport item-size="50">
        <VVirtualFor :of="items" :track-by="trackBy" v-slot="{item, index, count, first, last, even, odd}">
          <div class="vf-item"
               :data-index="index"
               :data-count="count"
               :data-first="first"
               :data-last="last"
               :data-even="even"
               :data-odd="odd">{{ item }}</div>
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
    clientWidth: 400,
    scrollHeight: 5000,
    scrollWidth: 400,
    offsetHeight: 300,
    scrollTop: 0,
    scrollLeft: 0,
  });
  return {wrapper, root, items};
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VVirtualFor 插槽上下文', () => {
  it('提供 item/index/count/first/last/even/odd', async () => {
    const {wrapper} = mountFor();
    await flushViewport();

    const first = wrapper.find('.vf-item');
    expect(first.attributes('data-index')).toBe('0');
    expect(first.attributes('data-count')).toBe('100');
    expect(first.attributes('data-first')).toBe('true');
    expect(first.attributes('data-last')).toBe('false');
    expect(first.attributes('data-even')).toBe('true');
    expect(first.attributes('data-odd')).toBe('false');
    expect(first.text()).toBe('item-0');

    const second = wrapper.findAll('.vf-item')[1];
    expect(second.attributes('data-index')).toBe('1');
    expect(second.attributes('data-even')).toBe('false');
    expect(second.attributes('data-odd')).toBe('true');
    wrapper.unmount();
  });

  it('滚动后 index 反映数据中的绝对位置，count 保持总量', async () => {
    const {wrapper, root} = mountFor();
    await flushViewport();

    root.scrollTop = 1500;
    root.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();

    const first = wrapper.find('.vf-item');
    const index = Number(first.attributes('data-index'));
    expect(index).toBeGreaterThanOrEqual(20);
    expect(index).toBeLessThanOrEqual(30);
    expect(first.attributes('data-count')).toBe('100');
    wrapper.unmount();
  });

  it('trackBy 使用数据绝对索引调用', async () => {
    const trackBy = vi.fn((index: number, item: unknown) => `${index}-${item}`);
    const {wrapper, root} = mountFor({trackBy});
    await flushViewport();
    trackBy.mockClear();

    root.scrollTop = 1500;
    root.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();

    const calls = trackBy.mock.calls.map(([index]) => index as number);
    expect(Math.min(...calls)).toBeGreaterThanOrEqual(20);
    wrapper.unmount();
  });

  it('数据整体替换后重新渲染', async () => {
    const {wrapper, items} = mountFor();
    await flushViewport();
    expect(wrapper.find('.vf-item').text()).toBe('item-0');

    items.value = ['new-0', ...DATA.slice(1)];
    await flushViewport();
    expect(wrapper.find('.vf-item').text()).toBe('new-0');
    wrapper.unmount();
  });
});

describe('VVirtualFor 数据源', () => {
  it('DataSource：connect 返回流驱动渲染，卸载时 disconnect', async () => {
    const stream = new Emitter<readonly string[]>();
    const ranges: ListRange[] = [];
    let viewer: CollectionViewer | null = null;
    const disconnect = vi.fn();

    class CustomSource extends DataSource<string> {
      override connect(collectionViewer: CollectionViewer): Emitter<readonly string[]> {
        viewer = collectionViewer;
        collectionViewer.viewChange.subscribe(range => ranges.push(range));
        return stream;
      }
      override disconnect(collectionViewer: CollectionViewer): void {
        disconnect(collectionViewer);
      }
    }

    const source = new CustomSource();
    const items = ref(source);
    const Wrapper = defineComponent({
      components: {VVirtualScrollViewport, VVirtualFor},
      template: `
        <VVirtualScrollViewport item-size="50">
          <VVirtualFor :of="items" v-slot="{item, index}">
            <div class="vf-item" :data-index="index">{{ item }}</div>
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
      clientWidth: 400,
      scrollWidth: 400,
      scrollTop: 0,
      scrollLeft: 0,
    });

    stream.next(DATA);
    await flushViewport();
    expect(viewer).not.toBeNull();
    expect(wrapper.findAll('.vf-item').length).toBeGreaterThan(0);

    root.scrollTop = 1500;
    root.dispatchEvent(new Event('scroll'));
    await flushRafAndTick();
    expect(ranges.length).toBeGreaterThan(0);

    wrapper.unmount();
    expect(disconnect).toHaveBeenCalledWith(viewer);
  });
});

describe('VVirtualFor 约束', () => {
  it('在视口外使用抛错', () => {
    const Wrapper = defineComponent({
      components: {VVirtualFor},
      template: `<VVirtualFor :of="[]" v-slot="{item}"><div>{{ item }}</div></VVirtualFor>`,
    });
    expect(() => mount(Wrapper)).toThrow(/VVirtualScrollViewport/);
  });
});
