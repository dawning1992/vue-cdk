import {describe, expect, it, vi} from 'vitest';
import {Emitter} from './emitter';

describe('Emitter', () => {
  it('订阅后能收到 next 派发的事件', () => {
    const emitter = new Emitter<number>();
    const listener = vi.fn();
    emitter.subscribe(listener);
    emitter.next(42);
    expect(listener).toHaveBeenCalledWith(42);
  });

  it('退订后不再收到事件，且重复退订无副作用', () => {
    const emitter = new Emitter<number>();
    const listener = vi.fn();
    const unsubscribe = emitter.subscribe(listener);
    unsubscribe();
    unsubscribe();
    emitter.next(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('next 遍历订阅快照，监听器可在回调中安全退订', () => {
    const emitter = new Emitter<number>();
    const first = vi.fn(() => {
      unsubscribeSecond();
    });
    const second = vi.fn();
    emitter.subscribe(first);
    const unsubscribeSecond = emitter.subscribe(second);
    emitter.next(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    emitter.next(2);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('complete 后不再派发事件并清空监听器', () => {
    const emitter = new Emitter<void>();
    const listener = vi.fn();
    emitter.subscribe(listener);
    emitter.complete();
    emitter.next();
    expect(listener).not.toHaveBeenCalled();
    expect(emitter.hasListeners).toBe(false);
    // complete 后订阅返回空退订函数且不注册监听。
    emitter.subscribe(listener);
    emitter.next();
    expect(listener).not.toHaveBeenCalled();
  });

  it('hasListeners 反映是否有活跃订阅', () => {
    const emitter = new Emitter<void>();
    expect(emitter.hasListeners).toBe(false);
    const unsubscribe = emitter.subscribe(() => undefined);
    expect(emitter.hasListeners).toBe(true);
    unsubscribe();
    expect(emitter.hasListeners).toBe(false);
  });
});
