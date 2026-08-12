import type {OverlayRef} from '../overlay-ref';

/**
 * 定位策略接口，与 Angular CDK 的 PositionStrategy 一致。
 *
 * 实现方需要遵守的生命周期约定：
 * - `attach` 在 overlay 内容挂载后调用，可读取面板尺寸并注册全局监听；
 * - `apply` 由 overlay 在内容渲染完成、窗口 resize 或显式 updatePosition 时调用；
 * - `detach` 可选，在 overlay 内容卸载时调用；
 * - `dispose` 在 overlay 销毁时调用，必须清理所有监听与 DOM 修改。
 */
export interface PositionStrategy {
  /** 将定位策略绑定到某个 overlay。 */
  attach(overlayRef: OverlayRef): void;

  /** 根据当前状态更新 overlay 位置。 */
  apply(): void;

  /** overlay 内容卸载时调用（可选）。 */
  detach?(): void;

  /** 清理策略持有的资源与 DOM 修改。 */
  dispose(): void;

  /**
   * 当 overlay 以原生 Popover 渲染时，返回 DOM 插入点；
   * 返回 null 表示使用全局容器，返回元素表示插到该元素之后，
   * 返回 `{type: 'parent'}` 表示作为该元素子节点。
   */
  getPopoverInsertionPoint?(): Element | null | {type: 'parent'; element: Element};
}
