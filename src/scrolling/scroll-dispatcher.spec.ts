import {afterEach, describe, expect, it, vi} from 'vitest';
import {Emitter} from '../emitter';
import {ScrollDispatcher, type ScrollDispatcherTarget} from './scroll-dispatcher';

/** 测试用滚动目标：elementScrolled 事件流 + 独立容器元素。 */
class FakeScrollable implements ScrollDispatcherTarget {
  readonly scrolledEmitter = new Emitter<Event>();
  readonly element: HTMLElement;

  constructor(tag = 'div') {
    this.element = document.createElement(tag);
    document.body.appendChild(this.element);
  }

  elementScrolled(): Emitter<Event> {
    return this.scrolledEmitter;
  }

  getElementRef(): {nativeElement: HTMLElement} {
    return {nativeElement: this.element};
  }

  dispose(): void {
    this.scrolledEmitter.complete();
    this.element.remove();
  }
}

function scrollWindow(): void {
  window.dispatchEvent(new Event('scroll'));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ScrollDispatcher', () => {
  it('注册后目标滚动会以目标身份派发', () => {
    const dispatcher = new ScrollDispatcher();
    const target = new FakeScrollable();
    dispatcher.register(target);

    const received: (ScrollDispatcherTarget | void)[] = [];
    const unsubscribe = dispatcher.scrolled(0).subscribe(value => received.push(value));

    target.scrolledEmitter.next(new Event('scroll'));
    expect(received).toEqual([target]);

    unsubscribe();
    dispatcher.deregister(target);
    target.dispose();
  });

  it('重复注册同一目标只订阅一次', () => {
    const dispatcher = new ScrollDispatcher();
    const target = new FakeScrollable();
    dispatcher.register(target);
    dispatcher.register(target);
    expect(dispatcher.scrollContainers.size).toBe(1);

    let hits = 0;
    const unsubscribe = dispatcher.scrolled(0).subscribe(() => hits++);
    target.scrolledEmitter.next(new Event('scroll'));
    expect(hits).toBe(1);

    unsubscribe();
    dispatcher.deregister(target);
    target.dispose();
  });

  it('注销后不再派发该目标的滚动', () => {
    const dispatcher = new ScrollDispatcher();
    const target = new FakeScrollable();
    dispatcher.register(target);

    let hits = 0;
    const unsubscribe = dispatcher.scrolled(0).subscribe(() => hits++);
    dispatcher.deregister(target);
    target.scrolledEmitter.next(new Event('scroll'));
    expect(hits).toBe(0);

    unsubscribe();
    target.dispose();
  });

  it('窗口滚动派发 void 事件', () => {
    const dispatcher = new ScrollDispatcher();
    const received: (ScrollDispatcherTarget | void)[] = [];
    const unsubscribe = dispatcher.scrolled(0).subscribe(value => received.push(value));

    scrollWindow();
    expect(received).toEqual([undefined]);

    unsubscribe();
  });

  it('支持节流：窗口内首事件立即派发，窗口结束补发最后一次', () => {
    vi.useFakeTimers();
    const dispatcher = new ScrollDispatcher();
    let hits = 0;
    const unsubscribe = dispatcher.scrolled(50).subscribe(() => hits++);

    scrollWindow();
    scrollWindow();
    expect(hits).toBe(1);
    vi.advanceTimersByTime(10);
    expect(hits).toBe(1);
    vi.advanceTimersByTime(50);
    expect(hits).toBe(2);

    unsubscribe();
  });

  it('全部退订后卸载全局监听', () => {
    const dispatcher = new ScrollDispatcher();
    const spy = vi.fn();
    const unsubscribe = dispatcher.scrolled(0).subscribe(spy);
    unsubscribe();

    scrollWindow();
    expect(spy).not.toHaveBeenCalled();
  });

  it('多个订阅者各自独立接收事件', () => {
    const dispatcher = new ScrollDispatcher();
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = dispatcher.scrolled(0).subscribe(first);
    const unsubscribeSecond = dispatcher.scrolled(0).subscribe(second);

    scrollWindow();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    unsubscribeSecond();
  });

  it('ancestorScrolled 只派发滚动祖先与窗口滚动', () => {
    const dispatcher = new ScrollDispatcher();
    const ancestor = new FakeScrollable();
    const unrelated = new FakeScrollable();
    dispatcher.register(ancestor);
    dispatcher.register(unrelated);

    const child = document.createElement('div');
    ancestor.element.appendChild(child);

    const received: (ScrollDispatcherTarget | void)[] = [];
    const unsubscribe = dispatcher.ancestorScrolled(child, 0).subscribe(value => received.push(value));

    ancestor.scrolledEmitter.next(new Event('scroll'));
    unrelated.scrolledEmitter.next(new Event('scroll'));
    scrollWindow();
    expect(received).toEqual([ancestor, undefined]);

    unsubscribe();
    dispatcher.deregister(ancestor);
    dispatcher.deregister(unrelated);
    ancestor.dispose();
    unrelated.dispose();
  });

  it('getAncestorScrollContainers 返回包含元素的已注册容器', () => {
    const dispatcher = new ScrollDispatcher();
    const container = new FakeScrollable();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const inside = document.createElement('div');
    container.element.appendChild(inside);
    dispatcher.register(container);

    expect(dispatcher.getAncestorScrollContainers(inside)).toEqual([container]);
    expect(dispatcher.getAncestorScrollContainers(outside)).toEqual([]);

    dispatcher.deregister(container);
    container.dispose();
    outside.remove();
  });

  it('dispose 后注销全部目标且新订阅不再收到事件', () => {
    const dispatcher = new ScrollDispatcher();
    const target = new FakeScrollable();
    dispatcher.register(target);
    const spy = vi.fn();
    const unsubscribe = dispatcher.scrolled(0).subscribe(spy);

    dispatcher.dispose();
    expect(dispatcher.scrollContainers.size).toBe(0);

    target.scrolledEmitter.next(new Event('scroll'));
    scrollWindow();
    expect(spy).not.toHaveBeenCalled();

    const lateSpy = vi.fn();
    const lateUnsubscribe = dispatcher.scrolled(0).subscribe(lateSpy);
    scrollWindow();
    expect(lateSpy).not.toHaveBeenCalled();
    lateUnsubscribe();
    unsubscribe();
    target.dispose();
  });
});
