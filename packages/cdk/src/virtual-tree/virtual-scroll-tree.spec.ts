import {afterEach, describe, expect, it, vi} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent, nextTick, ref} from 'vue';
import {DataSource} from '../collections';
import {Emitter} from '../emitter';
import {createKeyboardEvent, flushRaf, mockScrollMetrics} from '../../tests/helpers';
import {VTreeNode} from '../tree/node';
import {RtlScrollAxisType} from '../platform';
import type {PageInfo} from './types';
import {VVirtualScrollTree, type VVirtualScrollTreePublicApi} from './virtual-scroll-tree';

// jsdom 未实现原生 scrollTo / RTL 轴测量：与 scrolling 模块测试一致，
// 固定 RTL 轴类型并让 scrollTo 走手动赋值路径。
vi.mock('../platform', async importOriginal => {
  const actual = await importOriginal<typeof import('../platform')>();
  return {
    ...actual,
    supportsScrollBehavior: () => false,
    getRtlScrollAxisType: () => RtlScrollAxisType.NORMAL,
  };
});

interface TestNode {
  id: string;
  name: string;
  children?: TestNode[];
  disabled?: boolean;
}

function node(id: string, name: string, children: TestNode[] = [], disabled = false): TestNode {
  return {id, name, children, disabled};
}

/** 生成一批叶子节点，name 与 id 使用统一前缀。 */
function rangeNodes(prefix: string, count: number, start = 0): TestNode[] {
  return Array.from({length: count}, (_, i) => node(`${prefix}-${start + i}`, `${prefix}${start + i}`));
}

const ITEM_SIZE = 50;
const VIEWPORT_HEIGHT = 300;

type LoaderResult = {children: TestNode[]; hasMore?: boolean};
type Loader = (parent: TestNode | null, page: PageInfo) => Promise<LoaderResult> | LoaderResult;

function mountTree(options: {
  data?: unknown;
  loadChildren?: Loader;
  itemSize?: number;
  pageSize?: number;
  loadMoreThreshold?: number;
  height?: number | string;
  defaultExpandedKeys?: unknown[];
  trackBy?: (index: number, node: TestNode) => unknown;
  getKey?: (node: TestNode) => unknown;
} = {}) {
  const props: Record<string, unknown> = {
    data: options.data ?? null,
    loadChildren: options.loadChildren ?? null,
    itemSize: options.itemSize ?? ITEM_SIZE,
    pageSize: options.pageSize ?? 50,
    loadMoreThreshold: options.loadMoreThreshold ?? 5,
    height: options.height ?? VIEWPORT_HEIGHT,
    defaultExpandedKeys: options.defaultExpandedKeys ?? [],
    trackBy: options.trackBy ?? null,
    getKey: options.getKey ?? null,
  };

  const Wrapper = defineComponent({
    components: {VVirtualScrollTree, VTreeNode},
    props: {
      data: {type: Object, default: null},
      loadChildren: {type: Function, default: null},
      itemSize: {type: Number, default: ITEM_SIZE},
      pageSize: {type: Number, default: 50},
      loadMoreThreshold: {type: Number, default: 5},
      height: {type: [Number, String], default: VIEWPORT_HEIGHT},
      defaultExpandedKeys: {type: Array, default: () => []},
      trackBy: {type: Function, default: null},
      getKey: {type: Function, default: null},
    },
    setup(props) {
      const treeApi = ref<VVirtualScrollTreePublicApi<TestNode> | null>(null);
      const loadMoreCalls = ref<{parent: TestNode | null; page: PageInfo}[]>([]);
      const errors = ref<{parent: TestNode | null; error: Error}[]>([]);
      const activations = ref<TestNode[]>([]);
      const expandedChanges = ref<{node: TestNode; expanded: boolean}[]>([]);
      return {
        props,
        treeApi,
        loadMoreCalls,
        errors,
        activations,
        expandedChanges,
      };
    },
    template: `
      <VVirtualScrollTree
        ref="treeApi"
        :data="props.data"
        :load-children="props.loadChildren"
        :item-size="props.itemSize"
        :page-size="props.pageSize"
        :load-more-threshold="props.loadMoreThreshold"
        :height="props.height"
        :default-expanded-keys="props.defaultExpandedKeys"
        :track-by="props.trackBy"
        :get-key="props.getKey"
        @load-more="(parent, page) => loadMoreCalls.push({parent, page})"
        @error="(parent, error) => errors.push({parent, error})"
        @activation="(node) => activations.push(node)"
        @expanded-change="(node, expanded) => expandedChanges.push({node, expanded})"
      >
        <template #node="{node, isExpandable, isExpanded}">
          <VTreeNode
            :node="node"
            :is-expandable="isExpandable"
            :is-disabled="!!node.disabled"
            class="tree-node"
          >
            <span class="node-name">{{ node.name }}</span>
          </VTreeNode>
        </template>
      </VVirtualScrollTree>
    `,
  });

  // attachTo 让组件挂载到文档中：jsdom 只允许已连接元素获得焦点（键盘测试依赖）。
  const wrapper = mount(Wrapper, {props, attachTo: document.body});
  const viewportEl = wrapper.find('.vcdk-virtual-scroll-viewport').element as HTMLElement;
  mockScrollMetrics(viewportEl, {
    clientHeight: VIEWPORT_HEIGHT,
    clientWidth: 400,
    scrollHeight: 100000,
    scrollWidth: 400,
    offsetHeight: VIEWPORT_HEIGHT,
    scrollTop: 0,
    scrollLeft: 0,
  });
  return {wrapper, viewportEl};
}

function treeApi(wrapper: ReturnType<typeof mountTree>['wrapper']): VVirtualScrollTreePublicApi<TestNode> {
  const api = (wrapper.vm as {treeApi?: VVirtualScrollTreePublicApi<TestNode> | null}).treeApi;
  if (!api) {
    throw new Error('尚未捕获到树实例，请先挂载测试组件。');
  }
  return api;
}

function nodeNames(wrapper: ReturnType<typeof mountTree>['wrapper']): string[] {
  return wrapper.findAll('.node-name').map(item => item.text()?.trim() ?? '');
}

function treeNodeElements(wrapper: ReturnType<typeof mountTree>['wrapper']): HTMLElement[] {
  return wrapper.findAll('.tree-node').map(item => item.element as HTMLElement);
}

async function flushViewport(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
}

async function flushRafAndTick(): Promise<void> {
  await flushRaf();
  await nextTick();
}

async function scrollTo(viewportEl: HTMLElement, top: number): Promise<void> {
  viewportEl.scrollTop = top;
  viewportEl.dispatchEvent(new Event('scroll'));
  await flushRafAndTick();
}

function keydownOn(target: HTMLElement, key: string, keyCode: number): void {
  target.dispatchEvent(createKeyboardEvent('keydown', keyCode, {key}));
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('dir');
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('VVirtualScrollTree 全量模式', () => {
  it('只渲染视口附近的行（虚拟化）', async () => {
    const data = rangeNodes('root', 1000);
    const {wrapper} = mountTree({data});
    await flushViewport();

    const rendered = treeNodeElements(wrapper);
    // 300px 视口 + 缓冲：预期渲染约 10 行，远小于 1000。
    expect(rendered.length).toBeGreaterThanOrEqual(6);
    expect(rendered.length).toBeLessThanOrEqual(20);
    expect(nodeNames(wrapper)[0]).toBe('root0');
    wrapper.unmount();
  });

  it('行容器使用固定行高并撑出滚动条', async () => {
    const {wrapper} = mountTree({data: rangeNodes('root', 100)});
    await flushViewport();

    const row = wrapper.find('.vcdk-virtual-tree-row');
    expect(row.attributes('style')).toContain('height: 50px');
    const spacer = wrapper.find('.vcdk-virtual-scroll-spacer');
    expect(spacer.attributes('style')).toContain('height: 5000px');
    wrapper.unmount();
  });

  it('展开/折叠子节点并维护 ARIA 属性', async () => {
    const data = [node('a', 'A', [node('a1', 'A1'), node('a2', 'A2')]), node('b', 'B')];
    const {wrapper} = mountTree({data});
    await flushViewport();
    expect(nodeNames(wrapper)).toEqual(['A', 'B']);

    treeApi(wrapper).expand(data[0]);
    await flushViewport();
    expect(nodeNames(wrapper)).toEqual(['A', 'A1', 'A2', 'B']);

    const [aRow, a1Row] = treeNodeElements(wrapper);
    expect(aRow.getAttribute('role')).toBe('treeitem');
    expect(aRow.getAttribute('aria-expanded')).toBe('true');
    expect(aRow.getAttribute('aria-level')).toBe('1');
    expect(a1Row.getAttribute('aria-level')).toBe('2');
    expect(a1Row.getAttribute('aria-setsize')).toBe('2');
    expect(a1Row.getAttribute('aria-posinset')).toBe('1');

    treeApi(wrapper).collapse(data[0]);
    await flushViewport();
    expect(nodeNames(wrapper)).toEqual(['A', 'B']);
    wrapper.unmount();
  });

  it('expandAll / collapseAll 一键展开折叠', async () => {
    const data = [
      node('a', 'A', [node('a1', 'A1', [node('a1-1', 'A1-1')]), node('a2', 'A2')]),
      node('b', 'B'),
    ];
    const {wrapper} = mountTree({data});
    await flushViewport();

    await treeApi(wrapper).expandAll();
    await flushViewport();
    expect(nodeNames(wrapper)).toEqual(['A', 'A1', 'A1-1', 'A2', 'B']);

    treeApi(wrapper).collapseAll();
    await flushViewport();
    expect(nodeNames(wrapper)).toEqual(['A', 'B']);
    wrapper.unmount();
  });

  it('支持 Ref / DataSource / Emitter / 普通数组四种数据源形态', async () => {
    const refData = ref(rangeNodes('ref', 3));
    const refMount = mountTree({data: refData});
    await flushViewport();
    expect(nodeNames(refMount.wrapper)).toEqual(['ref0', 'ref1', 'ref2']);
    refMount.wrapper.unmount();

    class DemoSource extends DataSource<TestNode> {
      readonly stream = new Emitter<readonly TestNode[]>();
      override connect() {
        return this.stream;
      }
      override disconnect() {
        this.stream.complete();
      }
    }
    const source = new DemoSource();
    const sourceMount = mountTree({data: source});
    source.stream.next(rangeNodes('ds', 3));
    await flushViewport();
    expect(nodeNames(sourceMount.wrapper)).toEqual(['ds0', 'ds1', 'ds2']);
    sourceMount.wrapper.unmount();

    const emitter = new Emitter<readonly TestNode[]>();
    const emitterMount = mountTree({data: emitter});
    emitter.next(rangeNodes('em', 3));
    await flushViewport();
    expect(nodeNames(emitterMount.wrapper)).toEqual(['em0', 'em1', 'em2']);
    emitterMount.wrapper.unmount();

    const plainMount = mountTree({data: rangeNodes('plain', 3)});
    await flushViewport();
    expect(nodeNames(plainMount.wrapper)).toEqual(['plain0', 'plain1', 'plain2']);
    plainMount.wrapper.unmount();
  });
});

describe('VVirtualScrollTree 懒加载模式', () => {
  it('挂载后自动加载根层级首页', async () => {
    const loader = vi.fn<Loader>((parent, page) => {
      expect(parent).toBeNull();
      expect(page).toEqual({page: 0, pageSize: 50, offset: 0});
      return {children: [node('r1', 'R1'), node('r2', 'R2')], hasMore: false};
    });
    const {wrapper} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    expect(loader).toHaveBeenCalledTimes(1);
    expect(nodeNames(wrapper)).toEqual(['R1', 'R2']);
    wrapper.unmount();
  });

  it('展开节点加载子级首页；多父节点独立分页', async () => {
    const a = node('a', 'A');
    const b = node('b', 'B');
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a, b], hasMore: false};
      }
      if (parent === a) {
        const children = rangeNodes('a', 20, page.offset);
        return {children, hasMore: page.page === 0};
      }
      return {children: rangeNodes('b', 5, page.offset), hasMore: false};
    });
    const {wrapper, viewportEl} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    treeApi(wrapper).expand(a);
    await flushViewport();
    await flushViewport();

    const calls = loader.mock.calls as [TestNode | null, PageInfo][];
    expect(calls).toContainEqual([null, {page: 0, pageSize: 50, offset: 0}]);
    expect(calls).toContainEqual([a, {page: 0, pageSize: 50, offset: 0}]);
    // 未展开的 B 不应触发任何加载。
    expect(calls.filter(([parent]) => parent === b)).toHaveLength(0);

    // 滚动接近 a 的最后一个已加载子节点 → 只触发 a 的下一页。
    await scrollTo(viewportEl, 900);
    await flushViewport();
    expect(calls).toContainEqual([a, {page: 1, pageSize: 50, offset: 20}]);
    expect(calls.filter(([parent, page]) => parent === a && page.page === 0)).toHaveLength(1);
    expect(calls.filter(([parent]) => parent === b)).toHaveLength(0);
    wrapper.unmount();
  });

  it('第二层（更深层级）子节点按各自父节点边界加载', async () => {
    const a = node('a', 'A');
    const x = node('x', 'X');
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      if (parent === a) {
        return {children: [x], hasMore: false};
      }
      if (parent === x) {
        const children = rangeNodes('x', 20, page.offset);
        return {children, hasMore: page.page === 0};
      }
      return {children: [], hasMore: false};
    });
    const {wrapper, viewportEl} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    treeApi(wrapper).expand(a);
    await flushViewport();
    await flushViewport();
    treeApi(wrapper).expand(x);
    await flushViewport();
    await flushViewport();

    const calls = loader.mock.calls as [TestNode | null, PageInfo][];
    expect(calls).toContainEqual([x, {page: 0, pageSize: 50, offset: 0}]);
    const xPage0Count = calls.filter(([parent, page]) => parent === x && page.page === 0).length;
    expect(xPage0Count).toBe(1);

    // 滚动到 x 的最后一个已加载子节点附近 → 只触发 x 的下一页，A 不再请求。
    await scrollTo(viewportEl, 950);
    await flushViewport();
    expect(calls).toContainEqual([x, {page: 1, pageSize: 50, offset: 20}]);
    expect(calls.filter(([parent]) => parent === a)).toHaveLength(1);
    wrapper.unmount();
  });

  it('hasMore=false 后滚动到边界不再重复请求', async () => {
    const a = node('a', 'A');
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      if (parent === a) {
        return {children: rangeNodes('a', 20, page.offset), hasMore: false};
      }
      return {children: [], hasMore: false};
    });
    const {wrapper, viewportEl} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    treeApi(wrapper).expand(a);
    await flushViewport();
    await flushViewport();
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(1);

    await scrollTo(viewportEl, 1500);
    await flushViewport();
    await scrollTo(viewportEl, 2500);
    await flushViewport();
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(1);
    wrapper.unmount();
  });

  it('折叠再展开命中缓存，不重新请求已加载数据', async () => {
    const a = node('a', 'A');
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      return {children: rangeNodes('a', 20, page.offset), hasMore: page.page === 0};
    });
    const {wrapper} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    treeApi(wrapper).expand(a);
    await flushViewport();
    await flushViewport();
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(1);

    treeApi(wrapper).collapse(a);
    await flushViewport();
    treeApi(wrapper).expand(a);
    await flushViewport();
    await flushViewport();
    // 缓存命中：仅首页一次请求，且不因 hasMore 重新请求下一页。
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(1);
    expect(nodeNames(wrapper)).toContain('a0');
    wrapper.unmount();
  });

  it('加载进行中防重入（不重复请求）', async () => {
    const a = node('a', 'A');
    let resolveA: ((result: LoaderResult) => void) | undefined;
    const loader = vi.fn<Loader>(parent => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      return new Promise<LoaderResult>(resolve => {
        resolveA = resolve;
      });
    });
    const {wrapper} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    const api = treeApi(wrapper);
    api.expand(a);
    api.expand(a);
    api.expand(a);
    await flushViewport();
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(1);

    resolveA?.({children: rangeNodes('a', 5), hasMore: false});
    await flushViewport();
    await flushViewport();
    expect(nodeNames(wrapper)).toContain('a0');
    wrapper.unmount();
  });

  it('clearCache 后重新加载', async () => {
    const a = node('a', 'A');
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      return {children: rangeNodes('a', 5, page.offset), hasMore: false};
    });
    const {wrapper} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    const api = treeApi(wrapper);
    api.expand(a);
    await flushViewport();
    await flushViewport();
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(1);

    api.clearCache();
    api.collapse(a);
    await flushViewport();
    api.expand(a);
    await flushViewport();
    await flushViewport();
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(2);
    wrapper.unmount();
  });

  it('滚动加载失败 emit error 且不自动重试，retry 后恢复', async () => {
    const a = node('a', 'A');
    let failNext = true;
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      if (page.page === 1 && failNext) {
        failNext = false;
        return Promise.reject(new Error('load failed'));
      }
      const children = rangeNodes('a', 20, page.offset);
      return {children, hasMore: page.page === 0};
    });
    const {wrapper, viewportEl} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    treeApi(wrapper).expand(a);
    await flushViewport();
    await flushViewport();
    // 首页加载成功。
    expect(nodeNames(wrapper)).toContain('a0');

    const errors = (wrapper.vm as {errors: {parent: TestNode | null; error: Error}[]}).errors;
    // 滚动接近边界触发第二页 → 请求失败并派发 error。
    await scrollTo(viewportEl, 900);
    await flushViewport();
    expect(errors).toHaveLength(1);
    expect(errors[0].parent).toEqual(a);

    // 错误后滚动边界不自动重试。
    await scrollTo(viewportEl, 950);
    await flushViewport();
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(2);

    treeApi(wrapper).retry(a);
    await flushViewport();
    await flushViewport();
    expect(loader.mock.calls.filter(([parent]) => parent === a)).toHaveLength(3);
    // 第二页到达后滚动到末尾，确认新子节点已渲染。
    await scrollTo(viewportEl, 1800);
    await flushViewport();
    expect(nodeNames(wrapper)).toContain('a35');
    wrapper.unmount();
  });

  it('根层级按滚动边界分页加载', async () => {
    const loader = vi.fn<Loader>((parent, page) => {
      expect(parent).toBeNull();
      const children = rangeNodes('root', 30, page.offset);
      return {children, hasMore: page.page === 0};
    });
    const {wrapper, viewportEl} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();
    expect(loader).toHaveBeenCalledTimes(1);

    await scrollTo(viewportEl, 1400);
    await flushViewport();
    const calls = loader.mock.calls as [TestNode | null, PageInfo][];
    expect(calls).toHaveLength(2);
    expect(calls[1]).toEqual([null, {page: 1, pageSize: 50, offset: 30}]);
    // 第二页到达后再次滚动到末尾，确认新根节点已渲染。
    await scrollTo(viewportEl, 2900);
    await flushViewport();
    expect(nodeNames(wrapper)).toContain('root59');
    wrapper.unmount();
  });

  it('defaultExpandedKeys 递归展开命中的节点', async () => {
    const a = node('a', 'A');
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      return {children: rangeNodes('a', 5, page.offset), hasMore: false};
    });
    const {wrapper} = mountTree({
      loadChildren: loader,
      defaultExpandedKeys: ['a'],
      getKey: n => n.id,
    });
    await flushViewport();
    await flushViewport();
    await flushViewport();

    expect(nodeNames(wrapper)).toContain('A');
    expect(nodeNames(wrapper)).toContain('a0');
    expect(treeApi(wrapper).isExpanded(a)).toBe(true);
    wrapper.unmount();
  });
});

describe('VVirtualScrollTree 键盘导航', () => {
  it('方向键在行间移动并聚焦节点', async () => {
    const {wrapper} = mountTree({data: rangeNodes('root', 10)});
    await flushViewport();
    await flushViewport();

    const root = wrapper.element as HTMLElement;
    keydownOn(root, 'ArrowDown', 40);
    await nextTick();
    expect(document.activeElement?.textContent).toContain('root0');

    keydownOn(root, 'ArrowDown', 40);
    await nextTick();
    expect(document.activeElement?.textContent).toContain('root1');

    keydownOn(root, 'ArrowUp', 38);
    await nextTick();
    expect(document.activeElement?.textContent).toContain('root0');
    wrapper.unmount();
  });

  it('Home / End 跨虚拟窗口滚动并聚焦', async () => {
    const {wrapper, viewportEl} = mountTree({data: rangeNodes('root', 1000)});
    await flushViewport();
    await flushViewport();

    const root = wrapper.element as HTMLElement;
    keydownOn(root, 'End', 35);
    await flushViewport();
    // 虚拟窗口未渲染目标行：先滚动到末尾，再等待渲染后聚焦。
    expect(viewportEl.scrollTop).toBe(999 * ITEM_SIZE);
    await scrollTo(viewportEl, viewportEl.scrollTop);
    await new Promise(resolve => setTimeout(resolve, 100));
    await nextTick();
    expect(document.activeElement?.textContent).toContain('root999');

    keydownOn(root, 'Home', 36);
    await flushViewport();
    expect(viewportEl.scrollTop).toBe(0);
    wrapper.unmount();
  });

  it('左右键展开/收起（懒加载模式）', async () => {
    const a = node('a', 'A');
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      return {children: rangeNodes('a', 5, page.offset), hasMore: false};
    });
    const {wrapper} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    const root = wrapper.element as HTMLElement;
    keydownOn(root, 'ArrowDown', 40);
    await nextTick();
    keydownOn(root, 'ArrowRight', 39);
    await flushViewport();
    await flushViewport();
    expect(nodeNames(wrapper)).toContain('a0');
    expect(treeApi(wrapper).isExpanded(a)).toBe(true);

    keydownOn(root, 'ArrowLeft', 37);
    await flushViewport();
    expect(treeApi(wrapper).isExpanded(a)).toBe(false);
    wrapper.unmount();
  });

  it('RTL 布局左右键语义互换', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const a = node('a', 'A');
    const loader = vi.fn<Loader>((parent, page) => {
      if (parent === null) {
        return {children: [a], hasMore: false};
      }
      return {children: rangeNodes('a', 5, page.offset), hasMore: false};
    });
    const {wrapper} = mountTree({loadChildren: loader});
    await flushViewport();
    await flushViewport();

    const root = wrapper.element as HTMLElement;
    keydownOn(root, 'ArrowDown', 40);
    await nextTick();
    // RTL 下左键等价于 LTR 的右键：展开。
    keydownOn(root, 'ArrowLeft', 37);
    await flushViewport();
    await flushViewport();
    expect(treeApi(wrapper).isExpanded(a)).toBe(true);
    wrapper.unmount();
  });

  it('禁用节点被方向键跳过', async () => {
    const data = [node('n0', 'N0'), node('n1', 'N1', [], true), node('n2', 'N2')];
    const {wrapper} = mountTree({data});
    await flushViewport();
    await flushViewport();

    const root = wrapper.element as HTMLElement;
    keydownOn(root, 'ArrowDown', 40);
    await nextTick();
    expect(document.activeElement?.textContent).toContain('N0');
    keydownOn(root, 'ArrowDown', 40);
    await nextTick();
    expect(document.activeElement?.textContent).toContain('N2');
    wrapper.unmount();
  });

  it('Enter 激活节点并派发 activation 事件', async () => {
    const {wrapper} = mountTree({data: rangeNodes('root', 5)});
    await flushViewport();
    await flushViewport();

    const root = wrapper.element as HTMLElement;
    keydownOn(root, 'ArrowDown', 40);
    await nextTick();
    keydownOn(root, 'Enter', 13);
    await nextTick();

    const activations = (wrapper.vm as {activations: TestNode[]}).activations;
    expect(activations).toHaveLength(1);
    expect(activations[0].name).toBe('root0');
    wrapper.unmount();
  });

  it('scrollToNode 滚动到指定节点', async () => {
    const data = rangeNodes('root', 100);
    const {wrapper, viewportEl} = mountTree({data});
    await flushViewport();
    await flushViewport();

    treeApi(wrapper).scrollToNode(data[80]);
    await nextTick();
    expect(viewportEl.scrollTop).toBe(80 * ITEM_SIZE);
    wrapper.unmount();
  });
});
