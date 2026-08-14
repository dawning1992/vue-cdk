import type {ApiGroup} from '../api';

/** virtual-tree 模块 API 分组：组件、类型、插槽与事件、公共方法。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '组件',
    rows: [
      {
        name: 'VVirtualScrollTree',
        signature:
          'component VVirtualScrollTree<T>：data? / loadChildren? / itemSize（必填）/ pageSize? / loadMoreThreshold? / height? / defaultExpandedKeys? / getKey? / isExpandable? / getChildren? / trackBy? / minBufferPx? / maxBufferPx?',
        description:
          '虚拟滚动树组件：固定行高 + 视口附近渲染；数据入口二选一——data（全量模式，支持 DataSource / Emitter / Ref / 数组）与 loadChildren（懒加载模式，按父节点分页，parent=null 表示根层级）；懒加载时每层独立分页，滚动接近某父节点最后一个已加载子节点时自动加载下一页。',
      },
      {
        name: '#node 插槽',
        signature:
          'VirtualScrollTreeSlotContext<T> = VTreeNodeContext<T> & {isExpanded; isExpandable; isLoading; hasMore; isError}',
        description:
          '节点模板作用域插槽：字段与 tree 模块 VTreeNodeContext 对齐（node/level/index/count），并扩展 isExpanded/isExpandable/isLoading/hasMore/isError；插槽内可直接使用 VTreeNode、vTreeNodePadding、vTreeNodeToggle（组件 provide 了兼容的 VCDK_TREE_CONTEXT）。',
      },
    ],
  },
  {
    title: '类型',
    rows: [
      {
        name: 'LoadChildren<T>',
        signature: 'type LoadChildren<T> = (parent: T | null, page: PageInfo) => Promise<LoadChildrenResult<T>> | LoadChildrenResult<T>',
        description:
          '懒加载函数：parent 为 null 时加载根层级，否则加载该父节点的子级；返回 Promise 或同步结果，组件内部统一异步处理。',
      },
      {
        name: 'LoadChildrenResult<T>',
        signature: 'interface LoadChildrenResult<T> { children: T[]; hasMore?: boolean }',
        description:
          '一页加载结果：children 为本页子节点；hasMore 缺省 false，为 false 后该层不再发起任何请求（缓存标记）。',
      },
      {
        name: 'PageInfo',
        signature: 'interface PageInfo { page: number; pageSize: number; offset: number }',
        description:
          '分页信息：page 从 0 起；pageSize 为组件 pageSize prop；offset 为已加载条数（等价 page * pageSize），服务端可直接作为查询偏移。',
      },
      {
        name: 'VirtualScrollTreeAccessors<T, K>',
        signature: 'interface VirtualScrollTreeAccessors<T, K = T> { getKey?; isExpandable?; getChildren? }',
        description:
          '节点接入函数集合：getKey 缺省以节点自身为标识（服务器数据建议返回 node.id）；isExpandable 缺省在全量模式按子节点非空推断、懒加载模式先按 true 请求并在首帧空结果后自动修正为叶子；getChildren 缺省读取 node.children（全量模式）。',
      },
    ],
  },
  {
    title: '事件',
    rows: [
      {
        name: 'loadMore',
        signature: 'emit loadMore(parent: T | null, page: PageInfo)',
        description: '某父节点（null 为根层级）发起分页加载请求时触发，可用于埋点或调试。',
      },
      {
        name: 'loadingChange',
        signature: 'emit loadingChange(parent: T | null, loading: boolean)',
        description: '某父节点加载状态变化：请求开始 loading=true，结束（成功或失败）loading=false。',
      },
      {
        name: 'error',
        signature: 'emit error(parent: T | null, error: Error)',
        description:
          '某父节点加载失败时触发；失败后该层停止自动重试，可通过 expose 的 retry(parent) 或 clearCache() 恢复。',
      },
      {
        name: 'expandedChange',
        signature: 'emit expandedChange(node: T, expanded: boolean)',
        description: '节点展开/收起状态变化时触发。',
      },
      {
        name: 'activation',
        signature: 'emit activation(node: T)',
        description: '节点被键盘激活（Enter/Space）时触发。',
      },
      {
        name: 'scrolledIndexChange',
        signature: 'emit scrolledIndexChange(index: number)',
        description: '首个可见行索引变化（透传虚拟滚动视口事件）。',
      },
    ],
  },
  {
    title: '公共方法（模板 ref 暴露）',
    rows: [
      {
        name: 'expand / collapse / toggle / isExpanded',
        signature: 'expand(node: T) / collapse(node: T) / toggle(node: T) / isExpanded(node: T): boolean',
        description:
          '单节点展开/收起/切换/查询：懒加载模式下首次展开才请求子级首页，折叠再展开命中缓存不重复请求。',
      },
      {
        name: 'expandAll / collapseAll',
        signature: 'expandAll(): Promise<void> / collapseAll(): void',
        description:
          '一键展开/折叠：懒加载模式下 expandAll 按 BFS 逐页递归加载全部层级（缓存去重，任一节点失败即停止并派发 error）；全量模式直接展开全部已加载节点。',
      },
      {
        name: 'scrollToNode',
        signature: 'scrollToNode(node: T): void',
        description: '滚动到指定节点所在行（行高固定，按扁平索引换算偏移）。',
      },
      {
        name: 'clearCache',
        signature: 'clearCache(): void',
        description:
          '清空内存缓存（懒加载模式）：展开状态保留，已清空的父节点需重新展开才会重新加载。',
      },
      {
        name: 'retry',
        signature: 'retry(parent: T | null): void',
        description: '重试指定父节点（null 为根层级）失败的下一页加载。',
      },
    ],
  },
];
