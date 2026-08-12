/**
 * 数据源抽象，对齐 Angular CDK 的 DataSource。
 *
 * 与 Angular 的差异：`connect` 返回仓库自研 `Emitter` 而非 RxJS Observable，
 * 订阅语义（subscribe 返回退订函数）保持一致。
 */

import type {CollectionViewer} from './collection-viewer';
import type {Emitter} from '../emitter';

/**
 * 数据源基类。
 *
 * 约定：
 * - `connect` 返回的数据流每次「发出新数据」即表示数据集合已变化；
 * - `disconnect` 由消费方在销毁时调用，用于释放连接期间的资源；
 * - 同一 viewer 不应重复 connect，重复连接属于数据源自身的实现错误。
 */
export abstract class DataSource<T> {
  /** 连接一个集合查看器，返回其可订阅的数据流。 */
  abstract connect(collectionViewer: CollectionViewer): Emitter<readonly T[]>;

  /** 断开与集合查看器的连接，释放连接期间注册的资源。 */
  abstract disconnect(collectionViewer: CollectionViewer): void;
}

/**
 * 判断值是否为 DataSource。
 *
 * 与 Angular 一致采用结构判定（存在 connect 方法即可），
 * 这样使用者无需继承 DataSource 也能接入虚拟滚动。
 */
export function isDataSource(value: unknown): value is DataSource<unknown> {
  return !!value && typeof (value as DataSource<unknown>).connect === 'function';
}
