import {afterEach, describe, expect, it, vi} from 'vitest';
import {mockViewport} from '../../tests/helpers';
import {ViewportRuler} from './viewport-ruler';

afterEach(() => {
  vi.useRealTimers();
});

describe('ViewportRuler', () => {
  it('返回窗口尺寸（innerWidth/innerHeight）', () => {
    mockViewport(1024, 768);
    const ruler = new ViewportRuler();
    expect(ruler.getViewportSize()).toEqual({width: 1024, height: 768});
    ruler.dispose();
  });

  it('getViewportRect 综合滚动位置与尺寸', () => {
    mockViewport(800, 600);
    Object.defineProperty(window, 'pageYOffset', {value: 120, configurable: true});
    Object.defineProperty(window, 'pageXOffset', {value: 30, configurable: true});
    const ruler = new ViewportRuler();
    expect(ruler.getViewportRect()).toEqual({
      top: 120,
      left: 30,
      bottom: 720,
      right: 830,
      width: 800,
      height: 600,
    });
    ruler.dispose();
  });

  it('getViewportScrollPosition 返回当前滚动位置', () => {
    Object.defineProperty(window, 'pageYOffset', {value: 66, configurable: true});
    Object.defineProperty(window, 'pageXOffset', {value: 11, configurable: true});
    const ruler = new ViewportRuler();
    expect(ruler.getViewportScrollPosition()).toEqual({top: 66, left: 11});
    ruler.dispose();
  });

  it('change 在 resize 与 orientationchange 时派发', () => {
    const ruler = new ViewportRuler();
    const events: Event[] = [];
    const unsubscribe = ruler.change(0).subscribe(event => events.push(event));

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
    expect(events.length).toBe(2);

    unsubscribe();
    ruler.dispose();
  });

  it('resize 后尺寸缓存失效并重新测量', () => {
    mockViewport(100, 100);
    const ruler = new ViewportRuler();
    expect(ruler.getViewportSize().width).toBe(100);

    mockViewport(500, 300);
    window.dispatchEvent(new Event('resize'));
    expect(ruler.getViewportSize()).toEqual({width: 500, height: 300});
    ruler.dispose();
  });

  it('change 支持节流', () => {
    vi.useFakeTimers();
    const ruler = new ViewportRuler();
    let hits = 0;
    const unsubscribe = ruler.change(50).subscribe(() => hits++);

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    expect(hits).toBe(1);
    vi.advanceTimersByTime(60);
    expect(hits).toBe(2);

    unsubscribe();
    ruler.dispose();
  });

  it('dispose 后移除监听且事件流结束', () => {
    const ruler = new ViewportRuler();
    const spy = vi.fn();
    const unsubscribe = ruler.change(0).subscribe(spy);
    ruler.dispose();

    window.dispatchEvent(new Event('resize'));
    expect(spy).not.toHaveBeenCalled();

    const lateSpy = vi.fn();
    const lateUnsubscribe = ruler.change(0).subscribe(lateSpy);
    window.dispatchEvent(new Event('resize'));
    expect(lateSpy).not.toHaveBeenCalled();

    unsubscribe();
    lateUnsubscribe();
  });
});
