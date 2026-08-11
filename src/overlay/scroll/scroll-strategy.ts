import type {OverlayRef} from '../overlay-ref';

/**
 * 滚动策略接口：控制 overlay 打开期间对页面/容器滚动的响应方式。
 */
export interface ScrollStrategy {
  /** 启用策略（overlay 内容挂载时调用）。 */
  enable: () => void;
  /** 禁用策略（overlay 内容卸载时调用）。 */
  disable: () => void;
  /** 将策略绑定到某个 overlay。 */
  attach: (overlayRef: OverlayRef) => void;
  /** 解除与 overlay 的绑定（可选）。 */
  detach?: () => void;
}

/** 重复绑定同一个滚动策略时抛出的错误。 */
export function getScrollStrategyAlreadyAttachedError(): Error {
  return Error('Scroll strategy has already been attached.');
}
