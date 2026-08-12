/**
 * 集合视图抽象，对齐 Angular CDK 的 `@angular/cdk/collections`。
 *
 * 虚拟滚动、表格等需要按需渲染的组件通过 `CollectionViewer` 与 `DataSource`
 * 解耦：数据源只负责对外提供数据流，渲染端自行决定何时消费。
 */

import type {Emitter} from '../emitter';

/** 表示一段索引区间：start 含、end 不含。 */
export type ListRange = {start: number; end: number};

/**
 * 对某个数据集合提供视图的组件接口。
 * `viewChange` 在视图查看的数据区间变化时派发。
 */
export interface CollectionViewer {
  /** 当前查看的数据区间变化流。 */
  viewChange: Emitter<ListRange>;
}
