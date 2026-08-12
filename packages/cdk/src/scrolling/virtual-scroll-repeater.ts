/**
 * 虚拟滚动重复器接口，对应 Angular CDK 的 CdkVirtualScrollRepeater。
 * VVirtualFor 实现该接口并注册到视口，视口据此获取数据与测量已渲染内容。
 */

import type {Emitter} from '../emitter';
import type {ListRange} from '../collections';

/** 可被虚拟滚动视口重复渲染的数据源。 */
export interface CdkVirtualScrollRepeater<T> {
  /** 数据流：每次派发都代表数据集合整体已更新。 */
  dataStream: Emitter<readonly T[]>;

  /**
   * 测量指定区间内所有渲染项的组合尺寸。
   * @param range 待测量区间（含 start、不含 end）。
   * @param orientation 测量方向。
   * @throws 当区间包含未渲染项时抛错。
   */
  measureRangeSize(range: ListRange, orientation: 'horizontal' | 'vertical'): number;
}
