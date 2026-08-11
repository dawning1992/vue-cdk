/**
 * 类型化事件发射器，替代 RxJS Subject 的最小实现。
 *
 * 设计要点：
 * - 订阅与退订均返回幂等操作，退订后再次退订无副作用；
 * - `next` 遍历的是订阅快照，允许监听器在回调中安全地退订；
 * - `complete` 后清空监听器并拒绝后续订阅，与 RxJS Subject 的语义一致。
 */
export class Emitter<T = void> {
  private _listeners = new Set<(value: T) => void>();
  private _completed = false;

  /** 订阅事件，返回退订函数。完成后的发射器返回空退订函数。 */
  subscribe(listener: (value: T) => void): () => void {
    if (this._completed) {
      return () => undefined;
    }
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /** 同步向所有订阅者派发事件。 */
  next(value: T): void {
    if (this._completed) {
      return;
    }
    for (const listener of [...this._listeners]) {
      listener(value);
    }
  }

  /** 结束事件流并释放监听器，后续 `next` 不再派发。 */
  complete(): void {
    this._completed = true;
    this._listeners.clear();
  }

  /** 是否存在至少一个监听者（分发器据此决定是否跳过空流）。 */
  get hasListeners(): boolean {
    return this._listeners.size > 0;
  }
}
