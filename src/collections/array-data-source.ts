/**
 * 数组数据源：把数组、响应式数组或事件流包装为 DataSource。
 * 对应 Angular CDK 的 ArrayDataSource，事件流改用自研 Emitter。
 */

import {isRef, watch, type Ref} from 'vue';
import {Emitter} from '../emitter';
import {DataSource} from './data-source';
import type {CollectionViewer} from './collection-viewer';

/** ArrayDataSource 可包装的数据形态。 */
export type ArrayDataSourceInput<T> =
  | readonly T[]
  | Ref<readonly T[]>
  | Emitter<readonly T[]>;

/**
 * 数组数据源。
 *
 * - 传入 Emitter 时直接透传其数据流；
 * - 传入 Ref 时随响应式变化持续派发；
 * - 传入普通数组时 connect 后派发一次。
 */
export class ArrayDataSource<T> extends DataSource<T> {
  constructor(private _data: ArrayDataSourceInput<T>) {
    super();
  }

  override connect(_collectionViewer?: CollectionViewer): Emitter<readonly T[]> {
    const data = this._data;
    if (data instanceof Emitter) {
      return data;
    }

    const emitter = new Emitter<readonly T[]>();
    if (isRef(data)) {
      watch(
        data,
        data => emitter.next(data),
        {deep: true},
      );
      // 初始值延迟到微任务派发，保证 connect 后同步订阅的消费方不会漏掉首帧。
      queueMicrotask(() => emitter.next(data.value));
    } else {
      queueMicrotask(() => emitter.next(data));
    }
    return emitter;
  }

  override disconnect(_collectionViewer?: CollectionViewer): void {
    // 数组数据源无连接期资源需要释放；watch 随 connect 调用方的作用域自动清理。
  }
}
