/**
 * 虚拟滚动树组件 VVirtualScrollTree（vue-cdk/virtual-tree 模块）。
 *
 * 定位与设计：
 * - 复用 scrolling 模块的 VVirtualScrollViewport / VVirtualFor / 固定尺寸策略
 *   实现「只渲染视口附近行」的虚拟化；复用 tree 模块的 VTreeNode 与
 *   vTreeNodePadding / vTreeNodeToggle，通过 provide 兼容的 VCDK_TREE_CONTEXT
 *   让这些能力在 #node 插槽内原样可用；
 * - 支持全量（data）与懒加载（loadChildren 按父节点分页）两种数据模式；
 * - 懒加载模式下每一层（含根层）独立分页：渲染区间接近某个父节点的
 *   最后一个已加载子节点时，只请求该父节点的下一页；展开节点时请求首页；
 *   缓存为组件实例内存级，hasMore=false 后不再重复请求，折叠再展开命中缓存。
 */

import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  toRaw,
  watch,
  isRef,
  type ComputedRef,
  type PropType,
  type Ref,
  type VNode,
} from 'vue';
import {
  DataSource,
  isDataSource,
  SelectionModel,
  type CollectionViewer,
  type ListRange,
} from '../collections';
import {Emitter} from '../emitter';
import {getDirection} from '../bidi';
import {VVirtualFor} from '../scrolling/virtual-for';
import {VVirtualScrollViewport} from '../scrolling/virtual-scroll-viewport';
import {VCDK_TREE_CONTEXT, type VTreeContext} from '../tree/tree';
import type {VTreeNodePublicApi} from '../tree/node';
import {VirtualTreeBoundary} from './boundary';
import {flattenTree, type FlattenResult} from './flatten';
import {VirtualTreeKeyboard} from './keyboard';
import {createLevelState, ROOT_KEY, type LevelState} from './level-state';
import type {LoadChildren, PageInfo, VirtualScrollTreeSlotContext} from './types';

/** 视口暴露的最小方法集（用于滚动入视与读取渲染区间）。 */
interface VirtualTreeViewportApi {
  getRenderedRange(): ListRange;
  scrollToIndex(index: number, behavior?: ScrollBehavior): void;
}

/** VVirtualScrollTree 模板 ref 暴露的公共方法。 */
export interface VVirtualScrollTreePublicApi<T> {
  /** 展开节点（懒加载时触发子级加载）。 */
  expand(node: T): void;
  /** 收起节点。 */
  collapse(node: T): void;
  /** 切换节点展开状态。 */
  toggle(node: T): void;
  /** 查询节点展开状态。 */
  isExpanded(node: T): boolean;
  /** 一键展开：懒加载模式下递归加载全部层级（缓存去重，失败即停止）。 */
  expandAll(): Promise<void>;
  /** 一键折叠。 */
  collapseAll(): void;
  /** 滚动到指定节点所在行。 */
  scrollToNode(node: T): void;
  /** 清空内存缓存（懒加载模式）；已展开节点的子级需重新展开才会重新加载。 */
  clearCache(): void;
  /** 重试指定父节点（null 为根层级）失败的下一页加载。 */
  retry(parent: T | null): void;
}

/** 进行中的加载 Promise 集合：按父节点 key 防重入并支持并发等待。 */
type PendingLoadKey = typeof ROOT_KEY | unknown;

/**
 * 虚拟滚动树根组件。
 *
 * 数据入口二选一：
 * - `data`：全量模式，根节点数组（DataSource / Emitter / Ref / 普通数组）；
 * - `loadChildren`：懒加载模式，按父节点分页；同时提供 `data` 时以懒加载优先。
 *
 * `#node` 插槽上下文为 VirtualScrollTreeSlotContext，与 tree 模块的
 * VTreeNodeContext 对齐并扩展展开/加载状态；节点模板可直接使用 VTreeNode。
 */
export const VVirtualScrollTree = defineComponent({
  name: 'VVirtualScrollTree',
  props: {
    /** 全量模式数据源：DataSource、Emitter、Ref 或普通数组（普通数组只派发一次）。 */
    data: {
      type: [Object, Array] as PropType<
        | DataSource<any>
        | Emitter<readonly any[]>
        | Ref<readonly any[]>
        | readonly any[]
        | null
      >,
      default: null,
    },
    /** 懒加载函数：按父节点分页返回子节点；parent 为 null 表示根层级。 */
    loadChildren: {
      type: Function as unknown as PropType<LoadChildren<any> | null>,
      default: null,
    },
    /** 行高（像素），必填：虚拟滚动按固定行高换算偏移与渲染区间。 */
    itemSize: {type: Number, required: true},
    /** 每页条数（懒加载模式）。 */
    pageSize: {type: Number, default: 50},
    /** 距父节点最后一个已加载子节点多少行内触发下一页加载。 */
    loadMoreThreshold: {type: Number, default: 5},
    /** 节点稳定标识函数；缺省以节点自身为标识。 */
    getKey: {
      type: Function as PropType<(node: any) => unknown>,
      default: null,
    },
    /** 节点是否可展开；缺省按子节点/加载结果推断（见 types.ts）。 */
    isExpandable: {
      type: Function as PropType<(node: any) => boolean>,
      default: null,
    },
    /** 全量模式下获取节点直接子节点；缺省读取 node.children。 */
    getChildren: {
      type: Function as PropType<(node: any) => readonly any[] | null | undefined>,
      default: null,
    },
    /** 渲染 key 函数，签名 (index, node)；缺省用 getKey 结果。 */
    trackBy: {
      type: Function as PropType<(index: number, node: any) => unknown>,
      default: null,
    },
    /** 视口起点方向缓冲（透传虚拟滚动）。 */
    minBufferPx: {type: Number, default: 100},
    /** 视口终点方向缓冲（透传虚拟滚动）。 */
    maxBufferPx: {type: Number, default: 200},
    /** 容器高度：数字按 px，字符串原样作为 CSS 高度；不设置时由使用者 CSS 控制。 */
    height: {type: [Number, String], default: null},
    /** 初始展开的节点 key 集合（懒加载模式下命中的节点会递归展开并加载）。 */
    defaultExpandedKeys: {
      type: Array as PropType<readonly unknown[]>,
      default: () => [],
    },
  },
  emits: {
    /** 发起某父节点（null 为根层级）的分页加载请求时触发。 */
    loadMore: (_parent: any, _page: PageInfo) => true,
    /** 某父节点加载状态变化。 */
    loadingChange: (_parent: any, _loading: boolean) => true,
    /** 某父节点加载失败。 */
    error: (_parent: any, _error: Error) => true,
    /** 节点展开/收起状态变化。 */
    expandedChange: (_node: any, _expanded: boolean) => true,
    /** 节点被键盘激活（Enter/Space）时触发。 */
    activation: (_node: any) => true,
    /** 首个可见项索引变化（透传虚拟滚动）。 */
    scrolledIndexChange: (_index: number) => true,
  },
  setup(props, {slots, expose, emit}) {
    const isLazyMode = computed(() => typeof props.loadChildren === 'function');
    // 懒加载与全量互斥校验：同时提供时以懒加载优先（文档明示），无需抛错。
    if (!slots.node) {
      throw new Error('VVirtualScrollTree 必须提供 #node 插槽用于渲染节点模板。');
    }

    const rootEl = ref<HTMLElement | null>(null);
    const viewportRef = ref<VirtualTreeViewportApi | null>(null);
    const rawData = shallowRef<readonly unknown[]>([]);
    // 加载状态版本号：LevelState 存储在普通 Map 中，变更时 bump 该值驱动扁平化重算。
    const stateVersion = shallowRef(0);
    const expansionModel = new SelectionModel<unknown>(true);
    const rootState = createLevelState<unknown>(props.pageSize);
    const childStates = new Map<unknown, LevelState<unknown>>();
    const pendingLoads = new Map<PendingLoadKey, Promise<void>>();
    const nodes = new Map<unknown, VTreeNodePublicApi>();
    const directChildrenRefs = new Map<unknown, ComputedRef<readonly unknown[]>>();
    const keyIds = new WeakMap<object, number>();
    const viewChange = new Emitter<ListRange>();
    const viewer: CollectionViewer = {viewChange};

    let keyIdCounter = 0;
    let dataUnsubscribe: (() => void) | undefined;
    let dataWatchStop: (() => void) | undefined;
    let lastFocusedApi: VTreeNodePublicApi | null = null;
    // 仅记录「已成功连接」的数据源：首次连接前不调用 disconnect，
    // 避免实现方在 disconnect 中 complete 流导致首帧订阅失效。
    let connectedDataSource: DataSource<unknown> | null = null;

    // ---------- 数据接入 ----------

    /** 断开数据源连接与订阅（组件卸载或 data prop 变化时调用）。 */
    function disconnectDataSource(): void {
      dataUnsubscribe?.();
      dataUnsubscribe = undefined;
      dataWatchStop?.();
      dataWatchStop = undefined;
      if (connectedDataSource) {
        connectedDataSource.disconnect(viewer);
        connectedDataSource = null;
      }
    }

    /** 连接数据源并归一化为内部根节点数组（与 tree 模块 VTree 语义一致）。 */
    function connectDataSource(): void {
      disconnectDataSource();
      const source = props.data;
      rawData.value = [];

      if (isDataSource(source)) {
        connectedDataSource = source as DataSource<unknown>;
        dataUnsubscribe = source.connect(viewer).subscribe(next => {
          rawData.value = [...toRaw(next)];
        });
      } else if (source instanceof Emitter) {
        dataUnsubscribe = source.subscribe(next => {
          rawData.value = [...toRaw(next)];
        });
      } else if (typeof source === 'object' && source !== null && isRef(source)) {
        rawData.value = [...toRaw(source.value ?? [])];
        dataWatchStop = watch(source, next => {
          rawData.value = [...toRaw(next)];
        }, {deep: true});
      } else if (Array.isArray(source)) {
        // 普通数组只派发一次，对应 Angular `of()` 语义。
        rawData.value = [...toRaw(source)];
      } else if (source == null) {
        rawData.value = [];
      } else {
        throw new Error('VVirtualScrollTree: 未提供合法的 data 数据源。');
      }

      viewChange.next({start: 0, end: Number.MAX_VALUE});
      applyDefaultExpanded();
    }

    watch(
      () => props.data,
      () => connectDataSource(),
      {immediate: true},
    );

    // ---------- 节点接入与加载状态 ----------

    /**
     * 节点稳定标识。
     * 一律基于 toRaw 后的原始对象计算：VVirtualFor 内部以响应式 ref 承载列表，
     * 插槽收到的节点可能是 reactive 代理，统一归一化后才能与扁平列表/注册表/展开模型对齐。
     */
    function getKey(node: unknown): unknown {
      const raw = toRaw(node);
      return props.getKey ? props.getKey(raw as never) : raw;
    }

    /** 全量模式子节点来源；缺省读取 node.children。 */
    function getChildrenAccessor(node: unknown): readonly unknown[] | null {
      if (props.getChildren) {
        return props.getChildren(node as never) ?? null;
      }
      const raw = (node as {children?: unknown})?.children;
      return Array.isArray(raw) ? raw : null;
    }

    /** 获取父节点（null 为根层级）的分页状态；不存在时创建。 */
    function getLevelState(parent: unknown | null): LevelState<unknown> {
      if (parent === null) {
        return rootState;
      }
      const key = getKey(parent);
      let state = childStates.get(key);
      if (!state) {
        state = createLevelState<unknown>(props.pageSize);
        childStates.set(key, state);
      }
      return state;
    }

    /** 节点已加载的直接子节点：懒加载取缓存，全量取 getChildren 结果。 */
    function getLoadedChildren(node: unknown): readonly unknown[] {
      return isLazyMode.value ? getLevelState(node).children : (getChildrenAccessor(node) ?? []);
    }

    /** 根节点来源：懒加载模式为根层级缓存，全量模式为数据源。 */
    function getRoots(): readonly unknown[] {
      return isLazyMode.value ? rootState.children : rawData.value;
    }

    /**
     * 节点是否可展开。
     * 懒加载缺省策略：未加载前视为可展开，首次加载返回空且无更多时自动修正为叶子。
     */
    function isExpandableNode(node: unknown): boolean {
      if (props.isExpandable) {
        return props.isExpandable(node as never);
      }
      if (isLazyMode.value) {
        const state = getLevelState(node);
        if (state.loaded) {
          return state.children.length > 0 || state.hasMore;
        }
        return true;
      }
      const children = getChildrenAccessor(node);
      return !!children && children.length > 0;
    }

    /** 加载指定父节点的下一页；进行中返回同一 Promise，防重入。 */
    function loadPage(parent: unknown | null): Promise<void> {
      const rawParent = parent === null ? null : toRaw(parent);
      const state = getLevelState(rawParent);
      if (state.loading) {
        // 已存在进行中的请求：直接等待其完成，避免重复请求。
        return pendingLoads.get(rawParent === null ? ROOT_KEY : getKey(rawParent)) ?? Promise.resolve();
      }
      if (state.loaded && !state.hasMore) {
        return Promise.resolve();
      }
      if (state.error) {
        // 错误后不自动重试，需 retry()/clearCache() 显式恢复。
        return Promise.resolve();
      }

      const loadKey: PendingLoadKey = rawParent === null ? ROOT_KEY : getKey(rawParent);
      const promise = doLoadPage(rawParent, state);
      pendingLoads.set(loadKey, promise);
      return promise.finally(() => {
        pendingLoads.delete(loadKey);
      });
    }

    /** 实际执行一页加载：请求 → 合并缓存 → 状态落地。 */
    async function doLoadPage(parent: unknown | null, state: LevelState<unknown>): Promise<void> {
      state.loading = true;
      stateVersion.value++;
      emit('loadingChange', parent, true);

      const pageInfo: PageInfo = {
        page: state.page,
        pageSize: state.pageSize,
        offset: state.children.length,
      };
      emit('loadMore', parent, pageInfo);

      try {
        const result = await props.loadChildren!(parent, pageInfo);
        const children = Array.isArray(result.children) ? result.children : [];
        state.children = [...state.children, ...children];
        // hasMore 缺省 false：未声明更多视为该层已全部加载，不再请求。
        state.hasMore = result.hasMore !== false;
        state.page += 1;
        state.loaded = true;
        state.error = null;
      } catch (error) {
        state.error = error instanceof Error ? error : new Error(String(error));
        emit('error', parent, state.error);
      } finally {
        state.loading = false;
        stateVersion.value++;
        emit('loadingChange', parent, false);
        applyDefaultExpanded();
        void nextTick(() => checkBoundaries());
      }
    }

    // ---------- 展开/折叠 ----------

    /** 节点是否展开。 */
    function isExpanded(node: unknown): boolean {
      return expansionModel.isSelected(getKey(node));
    }

    /** 展开节点：懒加载模式同步触发子级首页加载。 */
    function expand(node: unknown): void {
      const key = getKey(node);
      const changed = expansionModel.select(key);
      if (changed) {
        emit('expandedChange', node, true);
      }
      if (isLazyMode.value) {
        // 仅首次展开触发首页加载；再次展开命中缓存，后续页由滚动边界触发。
        const state = getLevelState(node);
        if (!state.loaded) {
          void loadPage(node);
        }
      }
      void nextTick(() => checkBoundaries());
    }

    /** 收起节点。 */
    function collapse(node: unknown): void {
      const changed = expansionModel.deselect(getKey(node));
      if (changed) {
        emit('expandedChange', node, false);
      }
      void nextTick(() => checkBoundaries());
    }

    /** 切换节点展开状态。 */
    function toggle(node: unknown): void {
      isExpanded(node) ? collapse(node) : expand(node);
    }

    /** 收集节点已加载的后代（懒加载下仅已加载部分）。 */
    function collectDescendants(node: unknown, out: unknown[] = []): unknown[] {
      for (const child of getLoadedChildren(node)) {
        out.push(child);
        collectDescendants(child, out);
      }
      return out;
    }

    /** 收集整棵已加载树（expandAll 全量模式使用）。 */
    function collectAll(nodes: readonly unknown[], out: unknown[]): void {
      for (const node of nodes) {
        out.push(node);
        collectAll(getLoadedChildren(node), out);
      }
    }

    /** 逐页加载某父节点的全部子级（懒加载 expandAll/展开子树使用）。 */
    async function loadAllPages(parent: unknown | null): Promise<void> {
      const state = getLevelState(parent);
      while (state.hasMore && !state.error) {
        await loadPage(parent);
      }
    }

    /** 懒加载模式递归全量加载并展开：按 BFS 逐层加载全部子级。 */
    async function loadAllDescendants(parent: unknown | null): Promise<void> {
      await loadAllPages(parent);
      const queue: unknown[] = [...getLevelState(parent).children];
      while (queue.length) {
        const node = queue.shift()!;
        if (!isExpandableNode(node)) {
          continue;
        }
        expansionModel.select(getKey(node));
        emit('expandedChange', node, true);
        await loadAllPages(node);
        queue.push(...getLevelState(node).children);
      }
    }

    /** 展开节点及其全部后代（懒加载递归加载，全量模式展开已加载后代）。 */
    async function expandDescendants(node: unknown): Promise<void> {
      expansionModel.select(getKey(node));
      if (isLazyMode.value) {
        await loadAllDescendants(node);
      } else {
        expansionModel.select(...collectDescendants(node).map(child => getKey(child)));
      }
      void nextTick(() => checkBoundaries());
    }

    /** 收起节点及其全部已加载后代。 */
    function collapseDescendants(node: unknown): void {
      expansionModel.deselect(getKey(node));
      expansionModel.deselect(...collectDescendants(node).map(child => getKey(child)));
      void nextTick(() => checkBoundaries());
    }

    /** 切换节点子树展开状态。 */
    function toggleDescendants(node: unknown): void {
      isExpanded(node) ? collapseDescendants(node) : void expandDescendants(node);
    }

    /** 一键展开：懒加载递归加载全部层级，全量模式展开全部已加载节点。 */
    async function expandAll(): Promise<void> {
      if (isLazyMode.value) {
        await loadAllDescendants(null);
      } else {
        const all: unknown[] = [];
        collectAll(getRoots(), all);
        expansionModel.select(...all.map(node => getKey(node)));
      }
      void nextTick(() => checkBoundaries());
    }

    /** 一键折叠。 */
    function collapseAll(): void {
      expansionModel.clear();
      void nextTick(() => checkBoundaries());
    }

    /** 清空内存缓存（懒加载模式）；展开状态保留。 */
    function clearCache(): void {
      childStates.clear();
      Object.assign(rootState, createLevelState<unknown>(props.pageSize));
      directChildrenRefs.clear();
      stateVersion.value++;
    }

    /** 重试指定父节点（null 为根层级）失败的加载。 */
    function retry(parent: unknown | null): void {
      const state = getLevelState(parent);
      state.error = null;
      stateVersion.value++;
      void loadPage(parent);
    }

    /**
     * 初始展开 key 应用：按 BFS 遍历已加载树，展开 key 命中的节点并触发懒加载；
     * 每次加载完成后再次调用，使深层命中的节点随加载逐步展开。
     */
    function applyDefaultExpanded(): void {
      const keys = props.defaultExpandedKeys;
      if (!keys.length) {
        return;
      }
      const queue: unknown[] = [...getRoots()];
      const seen = new Set<unknown>();
      while (queue.length) {
        const node = queue.shift()!;
        const key = getKey(node);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        if (keys.includes(key) && !isExpanded(node)) {
          expansionModel.select(key);
          emit('expandedChange', node, true);
          if (isLazyMode.value) {
            const state = getLevelState(node);
            if (!state.loaded) {
              void loadPage(node);
            }
          }
        }
        queue.push(...getLoadedChildren(node));
      }
      void nextTick(() => checkBoundaries());
    }

    // ---------- 扁平化与边界触发 ----------

    /** 扁平化结果：可见列表 + 索引映射（响应 stateVersion 与展开模型）。 */
    const flattenResult = computed<FlattenResult<unknown, unknown>>(() => {
      void stateVersion.value;
      return flattenTree({
        roots: getRoots(),
        getKey,
        isExpanded,
        isExpandable: isExpandableNode,
        getLoadedChildren,
      });
    });

    /** 可见节点列表（虚拟滚动数据源）。 */
    const flatVisible = computed(() => flattenResult.value.flat);

    /**
     * 滚动边界检查：对每个「最后一个已加载子节点」落在渲染区间 + 阈值内的父节点，
     * 发起下一页请求；根层级（ROOT_KEY）同样处理。加载中/已加载完/出错均跳过。
     */
    function checkBoundaries(range?: ListRange): void {
      if (!isLazyMode.value) {
        return;
      }
      const currentRange = range ?? viewportRef.value?.getRenderedRange();
      if (!currentRange) {
        return;
      }
      const threshold = Math.max(0, props.loadMoreThreshold);
      const {boundaryLastChild, nodesByKey} = flattenResult.value;
      for (const [parentKey, lastChildIndex] of boundaryLastChild) {
        if (currentRange.end + threshold < lastChildIndex) {
          continue;
        }
        let parent: unknown | null = null;
        if (parentKey !== ROOT_KEY) {
          const parentNode = nodesByKey.get(parentKey as never);
          if (!parentNode || !isExpanded(parentNode)) {
            continue;
          }
          parent = parentNode;
        }
        const state = getLevelState(parent);
        if (state.hasMore && !state.loading && !state.error) {
          void loadPage(parent);
        }
      }
    }

    /** 渲染区间回调：转发给 viewChange（DataSource 契约）并做边界检查。 */
    function onRenderedRange(range: ListRange): void {
      viewChange.next(range);
      keyboard.updateRendered();
      checkBoundaries(range);
    }

    // 数据/展开/加载变化后（nextTick 后）复查边界：数据变长时区间可能未变化，
    // 但边界位置后移/前移都可能改变触发条件。
    watch(flatVisible, () => {
      void nextTick(() => {
        ensureInitialFocusable();
        checkBoundaries();
      });
    });

    // ---------- 节点注册与 tree 上下文 ----------

    function registerNode(node: VTreeNodePublicApi): void {
      nodes.set(getKey(node.data), node);
    }

    function unregisterNode(node: VTreeNodePublicApi): void {
      const key = getKey(node.data);
      if (nodes.get(key) === node) {
        nodes.delete(key);
      }
    }

    function getNode(data: unknown): VTreeNodePublicApi | undefined {
      return nodes.get(getKey(data));
    }

    /** 解析 v-for key：trackBy 优先，对象引用分配稳定数字 id。 */
    function vueKey(node: unknown, index: number): string | number | symbol {
      const rawKey = props.trackBy ? props.trackBy(index, node as never) : getKey(node);
      if (typeof rawKey === 'string' || typeof rawKey === 'number' || typeof rawKey === 'symbol') {
        return rawKey;
      }
      if (rawKey !== null && typeof rawKey === 'object') {
        let id = keyIds.get(rawKey as object);
        if (id === undefined) {
          id = ++keyIdCounter;
          keyIds.set(rawKey as object, id);
        }
        return id;
      }
      return String(rawKey);
    }

    /** 获取节点的父节点数据；根节点返回 null。 */
    function getParentData(node: unknown): unknown | null {
      const parentKey = flattenResult.value.parents.get(getKey(node));
      if (parentKey === undefined || parentKey === ROOT_KEY) {
        return null;
      }
      return flattenResult.value.nodesByKey.get(parentKey as never) ?? null;
    }

    function getLevel(node: unknown): number | undefined {
      return flattenResult.value.levels.get(getKey(node));
    }

    function getSetSize(node: unknown): number {
      return flattenResult.value.setSizes.get(getKey(node)) ?? 1;
    }

    function getPositionInSet(node: unknown): number {
      return flattenResult.value.posInSets.get(getKey(node)) ?? 1;
    }

    /** 节点的直接子节点（响应式）：懒加载为缓存子级，全量为 getChildren 结果。 */
    function getDirectChildren(node: unknown): Ref<readonly unknown[] | null | undefined> | null {
      const key = getKey(node);
      let ref = directChildrenRefs.get(key);
      if (!ref) {
        ref = computed(() => {
          void stateVersion.value;
          return getLoadedChildren(node);
        });
        directChildrenRefs.set(key, ref);
      }
      return ref;
    }

    // ---------- 键盘导航 ----------

    /** 查找节点在扁平列表中的索引。 */
    function flatIndexOfKey(key: unknown): number {
      return flattenResult.value.flat.findIndex(node => getKey(node) === key);
    }

    /** 聚焦扁平索引对应的已渲染节点；未渲染返回 false。 */
    function focusFlatIndex(index: number): boolean {
      const node = flattenResult.value.flat[index];
      if (!node) {
        return false;
      }
      const api = getNode(node);
      if (!api) {
        return false;
      }
      if (lastFocusedApi && lastFocusedApi !== api) {
        lastFocusedApi.unfocus();
      }
      lastFocusedApi = api;
      keyboard.setActiveIndex(index);
      api.focus();
      return true;
    }

    const keyboard = new VirtualTreeKeyboard<unknown>({
      getFlat: () => flattenResult.value.flat,
      getRenderedRange: () => viewportRef.value?.getRenderedRange() ?? null,
      scrollToIndex: index => viewportRef.value?.scrollToIndex(index),
      focusIndex: focusFlatIndex,
      isDisabled: node => getNode(node)?.isDisabled ?? false,
      isExpandable: isExpandableNode,
      isExpanded,
      getParentIndex: index => {
        const node = flattenResult.value.flat[index];
        if (!node) {
          return null;
        }
        const parentKey = flattenResult.value.parents.get(getKey(node));
        if (parentKey === undefined || parentKey === ROOT_KEY) {
          return null;
        }
        const parent = flattenResult.value.nodesByKey.get(parentKey as never);
        return parent ? flatIndexOfKey(getKey(parent)) : null;
      },
      getSiblingIndices: index => {
        const node = flattenResult.value.flat[index];
        if (!node) {
          return [];
        }
        const parentKey = flattenResult.value.parents.get(getKey(node));
        const indices: number[] = [];
        flattenResult.value.flat.forEach((flatNode, flatIndex) => {
          if (flattenResult.value.parents.get(getKey(flatNode)) === parentKey) {
            indices.push(flatIndex);
          }
        });
        return indices;
      },
      expand,
      collapse,
      emitActivation: node => emit('activation', node),
      getLabel: node => getNode(node)?.getLabel() ?? '',
      getDirection: () => getDirection(rootEl.value),
    });

    /** 键盘事件目标限定为树根或节点元素，避免干扰节点内容中的键盘交互。 */
    function onKeydown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      if (target === rootEl.value) {
        keyboard.onKeydown(event);
        return;
      }
      for (const [, node] of nodes) {
        if (target === node.element) {
          keyboard.onKeydown(event);
          return;
        }
      }
    }

    /** 焦点来自点击等节点实例入口：记录活动索引并聚焦。 */
    function focusNode(node: VTreeNodePublicApi): void {
      focusFlatIndex(flatIndexOfKey(getKey(node.data)));
    }

    /** 首次聚焦：让第一个未禁用节点可聚焦（roving tabindex 初始项）。 */
    function ensureInitialFocusable(): void {
      if (keyboard.getActiveIndex() !== null) {
        return;
      }
      for (const node of flattenResult.value.flat) {
        const api = getNode(node);
        if (api && !api.isDisabled) {
          api.makeFocusable();
          return;
        }
      }
    }

    // ---------- 插槽上下文与渲染 ----------

    function buildSlotContext(node: unknown, index: number): VirtualScrollTreeSlotContext<unknown> {
      const state = isLazyMode.value ? getLevelState(node) : null;
      return {
        node: toRaw(node),
        level: getLevel(node) ?? 0,
        index,
        count: flattenResult.value.flat.length,
        isExpanded: isExpanded(node),
        isExpandable: isExpandableNode(node),
        isLoading: state?.loading ?? false,
        hasMore: state?.hasMore ?? false,
        isError: state?.error != null,
      };
    }

    /** 行渲染：固定高度行容器内渲染 #node 插槽，保证虚拟滚动测量对齐。 */
    function renderRow(item: unknown, index: number): VNode {
      const slotResult = slots.node?.(buildSlotContext(item, index));
      if (!slotResult) {
        return h('div', {class: 'vcdk-virtual-tree-row'});
      }
      const content = Array.isArray(slotResult) ? slotResult : [slotResult];
      return h(
        'div',
        {
          class: 'vcdk-virtual-tree-row',
          style: {height: `${props.itemSize}px`, boxSizing: 'border-box'},
        },
        content,
      );
    }

    const treeContext: VTreeContext<any, any> = {
      get treeControl() {
        return null;
      },
      getExpansionKey: getKey,
      getLevel,
      getParentData,
      getSetSize,
      getPositionInSet,
      isExpanded,
      isLeafNode: node => !isExpandableNode(node),
      expand,
      collapse,
      toggle,
      toggleDescendants,
      expandDescendants,
      collapseDescendants,
      getDirectChildren,
      getNode,
      registerNode,
      unregisterNode,
      setNodeTypeIfUnset: () => undefined,
      focusNode,
      get keyManager() {
        return null;
      },
      get nodeSlot() {
        return slots.node ?? null;
      },
      vueKey,
      viewChange,
    };
    provide(VCDK_TREE_CONTEXT, treeContext);

    onMounted(() => {
      ensureInitialFocusable();
      void nextTick(() => checkBoundaries());
    });

    onBeforeUnmount(() => {
      keyboard.destroy();
      disconnectDataSource();
      directChildrenRefs.clear();
      childStates.clear();
      viewChange.complete();
    });

    expose({
      expand,
      collapse,
      toggle,
      isExpanded,
      expandAll,
      collapseAll,
      scrollToNode: (node: unknown) => {
        const index = flatIndexOfKey(getKey(node));
        if (index >= 0) {
          viewportRef.value?.scrollToIndex(index);
        }
      },
      clearCache,
      retry,
    });

    return () => {
      const heightStyle = props.height == null || props.height === ''
        ? null
        : {height: typeof props.height === 'number' ? `${props.height}px` : props.height};

      return h(
        'div',
        {ref: rootEl, class: 'vcdk-virtual-tree', style: heightStyle, onKeydown},
        [
          h(
            VVirtualScrollViewport,
            {
              ref: viewportRef,
              class: 'vcdk-virtual-tree-viewport',
              style: {height: '100%'},
              itemSize: props.itemSize,
              minBufferPx: props.minBufferPx,
              maxBufferPx: props.maxBufferPx,
              onScrolledIndexChange: (index: number) => emit('scrolledIndexChange', index),
            },
            () => [
              h(
                VVirtualFor,
                {of: flatVisible, trackBy: (index: number, item: unknown) => vueKey(item, index)},
                {
                  default: ({item, index}: {item: unknown; index: number}) =>
                    renderRow(item, index),
                },
              ),
              h(VirtualTreeBoundary, {onRange: onRenderedRange}),
            ],
          ),
        ],
      );
    };
  },
});
