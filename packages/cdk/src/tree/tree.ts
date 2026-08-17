/**
 * 树根组件，对应 Angular CDK tree 的 CdkTree
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 设计要点（Vue 等价映射）：
 * - 数据源归一化为响应式 Ref：DataSource 走 connect/disconnect，Emitter 直接订阅，
 *   Ref 深层监听，普通数组一次性派发（与 Angular `of()` 语义一致）；
 * - 节点类型由首个渲染的节点决定（VTreeNode→flat / VNestedTreeNode→nested），
 *   混用类型时 console.warn；
 * - `watchEffect({flush: 'sync'})` 维护 flattened/levels/parents/ariaSets 缓存，
 *   展开状态通过 SelectionModel 的响应式读取自动触发重算；
 * - 渲染使用 v-for 等价物（Fragment + key），key 由 trackBy/expansionKey 解析，
 *   对象引用自动分配稳定数字 id（对应 Angular 引用型 trackBy）；
 * - 键盘导航由 a11y 模块的 TreeKeyManager 承担，事件目标限定为树根或节点元素。
 */

import {
  computed,
  defineComponent,
  Fragment,
  h,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  toRaw,
  watch,
  watchEffect,
  type InjectionKey,
  type PropType,
  isRef,
  type Ref,
  type Slot,
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
import {TreeKeyManager, type TreeKeyManagerStrategy} from '../a11y/key-manager/tree-key-manager';
import type {TreeControl} from './control/tree-control';
import {
  getMultipleTreeControlsError,
  getTreeControlMissingError,
  getTreeMissingMatchingNodeDefError,
  getTreeNoValidDataSourceError,
} from './tree-errors';
import type {VTreeNodeContext, VTreeNodePublicApi} from './node';

/** 树子节点来源：数组或 Emitter 流统一缓存为响应式 Ref。 */
interface ChildrenSource {
  ref: Ref<readonly unknown[] | null | undefined>;
  unsubscribe: () => void;
}

/**
 * VTree 通过 provide 提供给后代节点/指令的上下文。
 * 该接口同时是节点组件与指令访问树能力的唯一通道。
 */
export interface VTreeContext<T = any, K = any> {
  /** 树控制实例；使用 accessors 时为 null。 */
  readonly treeControl: TreeControl<T, K> | null;
  /** 获取节点的展开标识。 */
  getExpansionKey(node: T): K;
  /** 获取节点层级；缓存未建立时返回 undefined。 */
  getLevel(node: T): number | undefined;
  /** 获取节点的父节点数据；根节点为 null。 */
  getParentData(node: T): T | null | undefined;
  /** 节点在其父节点子集（aria-setsize）中的数量。 */
  getSetSize(node: T): number;
  /** 节点在其父节点子集（aria-posinset）中的位置，从 1 起。 */
  getPositionInSet(node: T): number;
  /** 节点是否展开。 */
  isExpanded(node: T): boolean;
  /** 节点是否为叶子节点（treeControl 场景）。 */
  isLeafNode(node: T): boolean;
  /** 展开节点。 */
  expand(node: T): void;
  /** 收起节点。 */
  collapse(node: T): void;
  /** 切换节点。 */
  toggle(node: T): void;
  /** 递归切换子树。 */
  toggleDescendants(node: T): void;
  /** 展开子树。 */
  expandDescendants(node: T): void;
  /** 收起子树。 */
  collapseDescendants(node: T): void;
  /** 获取节点的直接子节点来源（响应式）。 */
  getDirectChildren(node: T): Ref<readonly T[] | null | undefined> | null;
  /** 按数据查找已注册的节点实例。 */
  getNode(data: T): VTreeNodePublicApi<T, K> | undefined;
  /** 注册节点实例（节点挂载时调用）。 */
  registerNode(node: VTreeNodePublicApi<T, K>): void;
  /** 注销节点实例（节点卸载时调用）。 */
  unregisterNode(node: VTreeNodePublicApi<T, K>): void;
  /** 首次渲染的节点决定树的类型；类型冲突时告警。 */
  setNodeTypeIfUnset(type: 'flat' | 'nested'): void;
  /** 让键盘管理器聚焦节点。 */
  focusNode(node: VTreeNodePublicApi<T, K>): void;
  /** 当前键盘管理器（挂载后可用）。 */
  readonly keyManager: TreeKeyManagerStrategy<VTreeNodePublicApi<T, K>> | null;
  /** `#node` 插槽渲染函数，供嵌套节点递归渲染子节点。 */
  readonly nodeSlot: Slot | null;
  /** 解析 v-for 所需的稳定 key。 */
  vueKey(node: T, index: number): string | number | symbol;
  /** 视图区间流（CollectionViewer 契约）。 */
  readonly viewChange: Emitter<ListRange>;
}

/** VTree 上下文注入键。 */
export const VCDK_TREE_CONTEXT: InjectionKey<VTreeContext<any, any>> = Symbol('vcdk-tree');

/** VTree 通过模板 ref 暴露的公共方法。 */
export interface VTreePublicApi<T> {
  isExpanded(dataNode: T): boolean;
  toggle(dataNode: T): void;
  expand(dataNode: T): void;
  collapse(dataNode: T): void;
  toggleDescendants(dataNode: T): void;
  expandDescendants(dataNode: T): void;
  collapseDescendants(dataNode: T): void;
  expandAll(): void;
  collapseAll(): void;
  readonly viewChange: Emitter<ListRange>;
}

/**
 * 树根组件：连接数据源并渲染 `#node` 插槽。
 *
 * 数据入口三选一（对应 Angular 的 treeControl / levelAccessor / childrenAccessor）：
 * - `treeControl`：FlatTreeControl（扁平）或 NestedTreeControl（嵌套）；
 * - `levelAccessor`：数据源提供全部扁平节点，函数返回每个节点的层级；
 * - `childrenAccessor`：数据源只提供根节点，函数返回每个节点的子节点。
 */
export const VTree = defineComponent({
  name: 'VTree',
  props: {
    /**
     * 数据源：DataSource 实例、Emitter 流、响应式数组或普通数组。
     * 普通数组只派发一次（对应 Angular `of()`）；Ref 深层监听持续更新。
     */
    dataSource: {
      type: [Object, Array] as PropType<
        | DataSource<any>
        | Emitter<readonly any[]>
        | Ref<readonly any[]>
        | readonly any[]
        | null
      >,
      default: null,
    },
    /** 树控制实例（三选一）。 */
    treeControl: {type: Object as PropType<TreeControl<any, any> | null>, default: null},
    /** 节点层级函数（三选一）。 */
    levelAccessor: {
      type: Function as PropType<(node: any) => number>,
      default: null,
    },
    /** 子节点函数（三选一），返回数组或 Emitter 流。 */
    childrenAccessor: {
      type: Function as PropType<
        (node: any) => any[] | Emitter<any[]> | null | undefined
      >,
      default: null,
    },
    /** 渲染 key 函数，签名 (index, node)；缺省用 expansionKey。 */
    trackBy: {
      type: Function as PropType<(index: number, node: any) => unknown>,
      default: null,
    },
    /** 展开状态标识函数；缺省以节点自身为标识。 */
    expansionKey: {
      type: Function as PropType<(node: any) => unknown>,
      default: null,
    },
    /** 根元素标签。 */
    tag: {type: String, default: 'div'},
  },
  setup(props, {slots, expose, attrs}) {
    // 与 Angular 一致：treeControl / levelAccessor / childrenAccessor 必须且只能提供一个。
    let numTreeControls = 0;
    if (props.treeControl) numTreeControls++;
    if (typeof props.levelAccessor === 'function') numTreeControls++;
    if (typeof props.childrenAccessor === 'function') numTreeControls++;
    if (!numTreeControls) throw getTreeControlMissingError();
    if (numTreeControls > 1) throw getMultipleTreeControlsError();

    if (!slots.node) {
      throw getTreeMissingMatchingNodeDefError();
    }

    const rootEl = ref<HTMLElement | null>(null);
    const nodeType = shallowRef<'flat' | 'nested' | null>(null);
    // 节点注册表：普通 Map + 版本计数驱动键盘条目重算，
    // 避免 reactive() 代理节点实例带来的类型与开销问题。
    const nodes = new Map<unknown, VTreeNodePublicApi>();
    const nodesVersion = shallowRef(0);
    const rawData = shallowRef<readonly unknown[]>([]);
    // 缓存使用 shallowRef + 整体替换：watchEffect 内只写不读自身依赖，
    // 避免对 reactive Map 的读写形成自触发循环。
    const levels = shallowRef<Map<unknown, number>>(new Map());
    const parents = shallowRef<Map<unknown, unknown>>(new Map());
    const ariaSets = shallowRef<Map<unknown, unknown[]>>(new Map());
    const flattenedNodes = shallowRef<readonly unknown[]>([]);
    const viewChange = new Emitter<ListRange>();
    const viewer: CollectionViewer = {viewChange};
    const internalModel = new SelectionModel<unknown>(true);
    const keyIds = new WeakMap<object, number>();
    let keyIdCounter = 0;

    // 子节点来源缓存：对象用 WeakMap（随数据回收），原始值用 Map（树卸载时清空）。
    const childrenSourceCache = new WeakMap<object, ChildrenSource>();
    const primitiveChildrenSourceCache = new Map<unknown, ChildrenSource>();
    const allChildrenSources = new Set<ChildrenSource>();
    const directChildrenCache = new WeakMap<object, Ref<readonly unknown[] | null | undefined>>();
    const primitiveDirectChildrenCache = new Map<unknown, Ref<readonly unknown[] | null | undefined>>();

    let dataUnsubscribe: (() => void) | undefined;
    let dataWatchStop: (() => void) | undefined;
    let keyManager: TreeKeyManagerStrategy<VTreeNodePublicApi> | null = null;

    /** 释放数据源连接与订阅。 */
    function disconnectDataSource(): void {
      dataUnsubscribe?.();
      dataUnsubscribe = undefined;
      dataWatchStop?.();
      dataWatchStop = undefined;
      if (
        props.dataSource &&
        typeof (props.dataSource as DataSource<unknown>).disconnect === 'function'
      ) {
        (props.dataSource as DataSource<unknown>).disconnect(viewer);
      }
    }

    /** 连接数据源并归一化为内部响应式数组。 */
    function connectDataSource(): void {
      disconnectDataSource();
      const source = props.dataSource;
      rawData.value = [];

      if (isDataSource(source)) {
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
        // 普通数组只派发一次，与 Angular `of()` 语义一致。
        // toRaw 防止响应式包装后的数组在展开时把节点元素代理化，
        // 否则树内节点标识与调用方持有的原始节点不一致。
        rawData.value = [...toRaw(source)];
      } else if (source == null) {
        rawData.value = [];
      } else {
        throw getTreeNoValidDataSourceError();
      }

      viewChange.next({start: 0, end: Number.MAX_VALUE});
    }

    watch(
      () => props.dataSource,
      () => connectDataSource(),
      {immediate: true},
    );

    /** 归一化层级来源：treeControl.getLevel 优先。 */
    function getLevelAccessor(): ((node: unknown) => number) | null {
      return props.treeControl?.getLevel?.bind(props.treeControl) ?? props.levelAccessor ?? null;
    }

    /** 归一化子节点来源：treeControl.getChildren 优先。 */
    function getChildrenAccessor(): ((
      node: unknown,
    ) => unknown[] | Emitter<unknown[]> | null | undefined) | null {
      return props.treeControl?.getChildren?.bind(props.treeControl) ?? props.childrenAccessor ?? null;
    }

    /** 获取节点的展开标识。 */
    function getExpansionKey(node: unknown): unknown {
      return props.expansionKey ? props.expansionKey(node) : node;
    }

    /** 获取/创建节点子节点来源（数组或 Emitter 统一为响应式 Ref）。 */
    function getChildrenSource(node: unknown): ChildrenSource | null {
      const accessor = getChildrenAccessor();
      if (!accessor) {
        return null;
      }

      const useWeak = node !== null && (typeof node === 'object' || typeof node === 'function');
      const existing = useWeak
        ? childrenSourceCache.get(node as object)
        : primitiveChildrenSourceCache.get(node);
      if (existing) {
        return existing;
      }

      let source: ChildrenSource;
      const initial = accessor(node);
      if (Array.isArray(initial)) {
        source = {
          ref: shallowRef<readonly unknown[] | null | undefined>(initial),
          unsubscribe: () => undefined,
        };
      } else if (initial instanceof Emitter) {
        const childrenRef = shallowRef<readonly unknown[] | null | undefined>(undefined);
        const unsubscribe = initial.subscribe(children => {
          childrenRef.value = children;
        });
        source = {ref: childrenRef, unsubscribe};
      } else {
        source = {
          ref: shallowRef<readonly unknown[] | null | undefined>(null),
          unsubscribe: () => undefined,
        };
      }

      if (useWeak) {
        childrenSourceCache.set(node as object, source);
      } else {
        primitiveChildrenSourceCache.set(node, source);
      }
      allChildrenSources.add(source);
      return source;
    }

    /** 在扁平数组中按层级范围查找节点后代（对应 Angular _findChildrenByLevel）。 */
    function findChildrenByLevel(
      levelAccessor: (node: unknown) => number,
      flattened: readonly unknown[],
      dataNode: unknown,
      levelDelta: number,
    ): unknown[] {
      const key = getExpansionKey(dataNode);
      const startIndex = flattened.findIndex(node => getExpansionKey(node) === key);
      const dataNodeLevel = levelAccessor(dataNode);
      const expectedLevel = dataNodeLevel + levelDelta;
      const results: unknown[] = [];

      for (let i = startIndex + 1; i < flattened.length; i++) {
        const currentLevel = levelAccessor(flattened[i]);
        if (currentLevel <= dataNodeLevel) {
          break;
        }
        if (currentLevel <= expectedLevel) {
          results.push(flattened[i]);
        }
      }
      return results;
    }

    /** 获取节点的直接子节点来源：层级函数用扁平数组扫描，否则用子节点函数。 */
    function getDirectChildren(
      node: unknown,
    ): Ref<readonly unknown[] | null | undefined> | null {
      const levelAccessor = getLevelAccessor();
      if (levelAccessor) {
        const useWeak = node !== null && (typeof node === 'object' || typeof node === 'function');
        let ref = useWeak
          ? directChildrenCache.get(node as object)
          : primitiveDirectChildrenCache.get(node);
        if (!ref) {
          ref = computed<readonly unknown[]>(() =>
            findChildrenByLevel(levelAccessor, flattenedNodes.value, node, 1),
          );
          if (useWeak) {
            directChildrenCache.set(node as object, ref);
          } else {
            primitiveDirectChildrenCache.set(node, ref);
          }
        }
        return ref;
      }
      return getChildrenSource(node)?.ref ?? null;
    }

    /** 扁平树：回溯最近的更低层级节点作为父节点。 */
    function findParentForNode(
      node: unknown,
      index: number,
      cachedNodes: readonly unknown[],
      currentLevels: Map<unknown, number>,
    ): unknown | null {
      if (!cachedNodes.length) {
        return null;
      }
      const currentLevel = currentLevels.get(getExpansionKey(node)) ?? 0;
      for (let parentIndex = index - 1; parentIndex >= 0; parentIndex--) {
        const parentNode = cachedNodes[parentIndex];
        const parentLevel = currentLevels.get(getExpansionKey(parentNode)) ?? 0;
        if (parentLevel < currentLevel) {
          return parentNode;
        }
      }
      return null;
    }

    /** 扁平树：计算层级、父节点与 aria 分组。 */
    function calculateParents(
      data: readonly unknown[],
      levelAccessor: (node: unknown) => number,
      nextLevels: Map<unknown, number>,
      nextParents: Map<unknown, unknown>,
      nextAriaSets: Map<unknown, unknown[]>,
    ): void {
      for (let index = 0; index < data.length; index++) {
        const node = data[index];
        const key = getExpansionKey(node);
        nextLevels.set(key, levelAccessor(node));
        const parent = findParentForNode(node, index, data, nextLevels);
        nextParents.set(key, parent);
        const parentKey = parent ? getExpansionKey(parent) : null;
        const group = nextAriaSets.get(parentKey) ?? [];
        group.push(node);
        nextAriaSets.set(parentKey, group);
      }
    }

    /** 嵌套树：按展开状态递归扁平化，同时维护层级/父节点/aria 分组缓存。 */
    function flattenNested(
      nodes: readonly unknown[],
      level: number,
      nextLevels: Map<unknown, number>,
      nextParents: Map<unknown, unknown>,
      nextAriaSets: Map<unknown, unknown[]>,
    ): unknown[] {
      const result: unknown[] = [];
      for (const node of nodes) {
        const key = getExpansionKey(node);
        if (!nextParents.has(key)) {
          nextParents.set(key, null);
        }
        nextLevels.set(key, level);
        result.push(node);

        const children = getChildrenSource(node)?.ref.value ?? null;
        if (children && children.length) {
          nextAriaSets.set(key, [...children]);
          for (const child of children) {
            nextParents.set(getExpansionKey(child), node);
            nextLevels.set(getExpansionKey(child), level + 1);
          }
          if (isExpanded(node)) {
            result.push(...flattenNested(children, level + 1, nextLevels, nextParents, nextAriaSets));
          }
        } else {
          nextAriaSets.set(key, []);
        }
      }
      return result;
    }

    /** 节点是否展开：treeControl 委托其模型，否则用内部模型。 */
    function isExpanded(node: unknown): boolean {
      if (props.treeControl) {
        return props.treeControl.isExpanded(node);
      }
      return internalModel.isSelected(getExpansionKey(node));
    }

    /** 节点是否为叶子节点（treeControl 场景推断用）。 */
    function isLeafNode(node: unknown): boolean {
      const control = props.treeControl;
      if (control) {
        if (control.isExpandable !== undefined && !control.isExpandable(node)) {
          return true;
        }
        if (control.isExpandable === undefined && control.getDescendants(node).length === 0) {
          return true;
        }
      }
      return false;
    }

    // 渲染缓存：数据、节点类型、展开状态任一变化时同步重算。
    watchEffect(
      () => {
        const data = rawData.value;
        const type = nodeType.value;
        const levelAccessor = getLevelAccessor();
        const childrenAccessor = getChildrenAccessor();
        const nextLevels = new Map<unknown, number>();
        const nextParents = new Map<unknown, unknown>();
        const nextAriaSets = new Map<unknown, unknown[]>();

        if (!type) {
          flattenedNodes.value = [];
          levels.value = nextLevels;
          parents.value = nextParents;
          ariaSets.value = nextAriaSets;
          return;
        }

        if (childrenAccessor) {
          // childrenAccessor + flat：扁平化后整体渲染；childrenAccessor + nested：渲染根节点。
          nextAriaSets.set(null, [...data]);
          flattenedNodes.value = flattenNested(data, 0, nextLevels, nextParents, nextAriaSets);
        } else if (levelAccessor) {
          flattenedNodes.value = data;
          calculateParents(data, levelAccessor, nextLevels, nextParents, nextAriaSets);
        } else {
          flattenedNodes.value = data;
        }
        levels.value = nextLevels;
        parents.value = nextParents;
        ariaSets.value = nextAriaSets;
      },
      {flush: 'sync'},
    );

    /** 待渲染节点：nested 只渲染根节点，flat + childrenAccessor 渲染扁平化结果。 */
    const renderNodes = computed<readonly unknown[]>(() => {
      const data = rawData.value;
      const type = nodeType.value;
      if (type === null) {
        return data;
      }
      const levelAccessor = getLevelAccessor();
      const childrenAccessor = getChildrenAccessor();
      if (type === 'nested') {
        return levelAccessor ? data.filter(node => levelAccessor(node) === 0) : data;
      }
      return childrenAccessor ? flattenedNodes.value : filterVisibleFlatNodes(data);
    });

    /**
     * 扁平树节点是否可展开：treeControl 场景沿用其判断，
     * levelAccessor 场景按扁平数组中的层级关系推断（存在更低层级后代即视为可展开）。
     */
    function isExpandableNode(node: unknown): boolean {
      if (props.treeControl) {
        return !isLeafNode(node);
      }
      const levelAccessor = getLevelAccessor();
      return levelAccessor
        ? findChildrenByLevel(levelAccessor, flattenedNodes.value, node, 1).length > 0
        : false;
    }

    /**
     * 扁平树可见节点过滤，对应 Angular MatTreeFlattener.expandFlattenedNodes 的渲染语义：
     * 节点可见当且仅当从根到其父节点的各级均处于展开状态；根节点始终可见。
     * 该过滤只影响渲染列表，flattenedNodes/parents/ariaSets 仍基于全量数据计算，
     * 保证展开时无需重新扫描即可恢复子节点渲染。
     */
    function filterVisibleFlatNodes(data: readonly unknown[]): readonly unknown[] {
      const levelAccessor = getLevelAccessor();
      if (!levelAccessor) {
        return data;
      }
      const results: unknown[] = [];
      // levelVisible[i] 表示层级 i 的节点当前是否可见，根层级恒为 true。
      const levelVisible: boolean[] = [true];
      for (const node of data) {
        const level = levelAccessor(node) ?? 0;
        let visible = true;
        for (let i = 0; i <= level; i++) {
          if (!levelVisible[i]) {
            visible = false;
            break;
          }
        }
        if (visible) {
          results.push(node);
        }
        // 仅可展开节点会改变下一层级的可见性；叶子节点沿用当前层的展开标记。
        if (isExpandableNode(node)) {
          levelVisible[level + 1] = isExpanded(node);
        }
      }
      return results;
    }

    /** 解析 v-for key：字符串/数字/symbol 直接使用，对象引用分配稳定数字 id。 */
    function vueKey(node: unknown, index: number): string | number | symbol {
      const rawKey = props.trackBy ? props.trackBy(index, node) : getExpansionKey(node);
      if (typeof rawKey === 'string' || typeof rawKey === 'number' || typeof rawKey === 'symbol') {
        return rawKey;
      }
      if (rawKey !== null && (typeof rawKey === 'object' || typeof rawKey === 'function')) {
        let id = keyIds.get(rawKey as object);
        if (id === undefined) {
          id = ++keyIdCounter;
          keyIds.set(rawKey as object, id);
        }
        return id;
      }
      return String(rawKey);
    }

    /** 节点注册表：keyed by expansionKey。 */
    function registerNode(node: VTreeNodePublicApi): void {
      nodes.set(getExpansionKey(node.data), node);
      nodesVersion.value++;
    }

    function unregisterNode(node: VTreeNodePublicApi): void {
      const key = getExpansionKey(node.data);
      if (nodes.get(key) === node) {
        nodes.delete(key);
        nodesVersion.value++;
      }
    }

    /** 首次渲染的节点决定树类型；类型冲突时告警。 */
    function setNodeTypeIfUnset(type: 'flat' | 'nested'): void {
      const currentType = nodeType.value;
      if (currentType === null) {
        nodeType.value = type;
      } else if (currentType !== type) {
        console.warn(
          `Tree is using conflicting node types which can cause unexpected behavior. ` +
            `Please use tree nodes of the same type (e.g. only flat or only nested). ` +
            `Current node type: "${currentType}", new node type "${type}".`,
        );
      }
    }

    /** 收集节点全部后代（内部模型子树操作使用，仅同步子节点）。 */
    function getDescendantsData(node: unknown): unknown[] {
      if (props.treeControl) {
        return props.treeControl.getDescendants(node);
      }
      const levelAccessor = getLevelAccessor();
      if (levelAccessor) {
        return findChildrenByLevel(levelAccessor, flattenedNodes.value, node, Infinity);
      }
      const result: unknown[] = [];
      collectChildren(result, node);
      return result;
    }

    function collectChildren(out: unknown[], node: unknown): void {
      const children = getChildrenSource(node)?.ref.value;
      if (!children) {
        return;
      }
      for (const child of children) {
        out.push(child);
        collectChildren(out, child);
      }
    }

    /** 收集整棵树全部节点（内部 expandAll 使用）。 */
    function collectAllNodes(nodes: readonly unknown[], out: unknown[]): void {
      for (const node of nodes) {
        out.push(node);
        const children = getChildrenSource(node)?.ref.value;
        if (children) {
          collectAllNodes(children, out);
        }
      }
    }

    function toggle(node: unknown): void {
      if (props.treeControl) {
        props.treeControl.toggle(node);
      } else {
        internalModel.toggle(getExpansionKey(node));
      }
    }

    function expand(node: unknown): void {
      if (props.treeControl) {
        props.treeControl.expand(node);
      } else {
        internalModel.select(getExpansionKey(node));
      }
    }

    function collapse(node: unknown): void {
      if (props.treeControl) {
        props.treeControl.collapse(node);
      } else {
        internalModel.deselect(getExpansionKey(node));
      }
    }

    function toggleDescendants(node: unknown): void {
      if (props.treeControl) {
        props.treeControl.toggleDescendants(node);
      } else if (isExpanded(node)) {
        collapseDescendants(node);
      } else {
        expandDescendants(node);
      }
    }

    function expandDescendants(node: unknown): void {
      if (props.treeControl) {
        props.treeControl.expandDescendants(node);
        return;
      }
      internalModel.select(getExpansionKey(node));
      internalModel.select(...getDescendantsData(node).map(child => getExpansionKey(child)));
    }

    function collapseDescendants(node: unknown): void {
      if (props.treeControl) {
        props.treeControl.collapseDescendants(node);
        return;
      }
      internalModel.deselect(getExpansionKey(node));
      internalModel.deselect(...getDescendantsData(node).map(child => getExpansionKey(child)));
    }

    function expandAll(): void {
      if (props.treeControl) {
        props.treeControl.expandAll();
        return;
      }
      const allNodes: unknown[] = [];
      collectAllNodes(rawData.value, allNodes);
      internalModel.select(...allNodes.map(node => getExpansionKey(node)));
    }

    function collapseAll(): void {
      if (props.treeControl) {
        props.treeControl.collapseAll();
      } else {
        internalModel.clear();
      }
    }

    /** 键盘事件目标限定为树根或节点元素，避免干扰投影内容中的键盘交互。 */
    function onKeydown(event: KeyboardEvent): void {
      if (!keyManager) {
        return;
      }
      const target = event.target;
      if (target === rootEl.value) {
        keyManager.onKeydown(event);
        return;
      }
      for (const [, node] of nodes) {
        if (target === node.element) {
          keyManager.onKeydown(event);
          return;
        }
      }
    }

    /** 键盘管理器条目：扁平化节点映射到已注册的节点实例。 */
    const keyManagerItems = computed<VTreeNodePublicApi[]>(() => {
      // 读取版本号使注册/注销触发重算。
      void nodesVersion.value;
      const items: VTreeNodePublicApi[] = [];
      for (const node of flattenedNodes.value) {
        const api = nodes.get(getExpansionKey(node));
        if (api) {
          items.push(api);
        }
      }
      return items;
    });

    onMounted(() => {
      keyManager = new TreeKeyManager<VTreeNodePublicApi>(keyManagerItems, {
        trackBy: node => getExpansionKey(node.data),
        skipPredicate: node => node.isDisabled,
        typeAheadDebounceInterval: true,
        horizontalOrientation: getDirection(rootEl.value),
      });
    });

    onBeforeUnmount(() => {
      keyManager?.destroy();
      keyManager = null;
      disconnectDataSource();
      for (const source of allChildrenSources) {
        source.unsubscribe();
      }
      allChildrenSources.clear();
      primitiveChildrenSourceCache.clear();
      primitiveDirectChildrenCache.clear();
      viewChange.complete();
    });

    const context: VTreeContext<any, any> = {
      get treeControl() {
        return props.treeControl ?? null;
      },
      getExpansionKey,
      getLevel: node => levels.value.get(getExpansionKey(node)),
      getParentData: node => parents.value.get(getExpansionKey(node)),
      getSetSize: node => {
        const parent = parents.value.get(getExpansionKey(node));
        const parentKey = parent ? getExpansionKey(parent) : null;
        return ariaSets.value.get(parentKey)?.length ?? 1;
      },
      getPositionInSet: node => {
        const key = getExpansionKey(node);
        const parent = parents.value.get(key);
        const parentKey = parent ? getExpansionKey(parent) : null;
        const set = ariaSets.value.get(parentKey);
        if (!set) {
          return 1;
        }
        return set.findIndex(n => getExpansionKey(n) === key) + 1;
      },
      isExpanded,
      isLeafNode,
      expand,
      collapse,
      toggle,
      toggleDescendants,
      expandDescendants,
      collapseDescendants,
      getDirectChildren,
      getNode: data => nodes.get(getExpansionKey(data)),
      registerNode,
      unregisterNode,
      setNodeTypeIfUnset,
      focusNode: node => keyManager?.focusItem(node),
      get keyManager() {
        return keyManager;
      },
      get nodeSlot() {
        return slots.node ?? null;
      },
      vueKey,
      viewChange,
    };
    provide(VCDK_TREE_CONTEXT, context);

    const publicApi: VTreePublicApi<any> = {
      isExpanded,
      toggle,
      expand,
      collapse,
      toggleDescendants,
      expandDescendants,
      collapseDescendants,
      expandAll,
      collapseAll,
      viewChange,
    };
    expose(publicApi);

    return () => {
      const data = renderNodes.value;
      const nodeSlot = slots.node!;
      const count = data.length;

      return h(
        props.tag,
        {
          ref: rootEl,
          ...attrs,
          class: ['vcdk-tree', attrs.class],
          role: 'tree',
          onKeydown,
        },
        data.map((node, index) => {
          const context: VTreeNodeContext<unknown> = {
            node,
            level: levels.value.get(getExpansionKey(node)) ?? 0,
            index,
            count,
          };
          const vnodes = nodeSlot(context);
          return h(
            Fragment,
            {key: vueKey(node, index)},
            Array.isArray(vnodes) ? vnodes : [vnodes],
          );
        }),
      );
    };
  },
});
