import {describe, expect, it, vi} from 'vitest';
import {h, nextTick} from 'vue';
import {createTestOverlay, mockViewport} from '../../../tests/helpers';
import {createCloseScrollStrategy} from './close-scroll-strategy';
import {createBlockScrollStrategy} from './block-scroll-strategy';
import {createRepositionScrollStrategy} from './reposition-scroll-strategy';
import {createNoopScrollStrategy} from './noop-scroll-strategy';
import {viewportRuler} from '../../scrolling';

describe('NoopScrollStrategy', () => {
  it('各方法为空操作', () => {
    const strategy = createNoopScrollStrategy();
    expect(() => strategy.attach()).not.toThrow();
    expect(() => strategy.enable()).not.toThrow();
    expect(() => strategy.disable()).not.toThrow();
  });
});

describe('CloseScrollStrategy', () => {
  it('滚动立即关闭 overlay', async () => {
    const ref = createTestOverlay({scrollStrategy: createCloseScrollStrategy()});
    ref.attach(h('div'));
    await nextTick();
    expect(ref.hasAttached()).toBe(true);
    window.dispatchEvent(new Event('scroll'));
    expect(ref.hasAttached()).toBe(false);
    ref.dispose();
  });

  it('滚动超过阈值才关闭，未超过时重新定位', async () => {
    let scrollTop = 0;
    vi.spyOn(viewportRuler, 'getViewportScrollPosition').mockImplementation(() => ({
      top: scrollTop,
      left: 0,
    }));
    const ref = createTestOverlay({
      scrollStrategy: createCloseScrollStrategy({threshold: 50}),
    });
    const updateSpy = vi.spyOn(ref, 'updatePosition');
    ref.attach(h('div'));
    await nextTick();
    updateSpy.mockClear();

    scrollTop = 20;
    window.dispatchEvent(new Event('scroll'));
    expect(ref.hasAttached()).toBe(true);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    scrollTop = 100;
    window.dispatchEvent(new Event('scroll'));
    expect(ref.hasAttached()).toBe(false);
    ref.dispose();
  });

  it('忽略 overlay 面板内部的滚动', async () => {
    const ref = createTestOverlay({scrollStrategy: createCloseScrollStrategy()});
    ref.attach(h('div', {style: 'overflow: auto; height: 100px;'}));
    await nextTick();
    const inner = ref.overlayElement.querySelector('div')!;
    inner.dispatchEvent(new Event('scroll'));
    expect(ref.hasAttached()).toBe(true);
    ref.dispose();
  });

  it('重复 attach 抛错', () => {
    const strategy = createCloseScrollStrategy();
    const first = createTestOverlay({scrollStrategy: strategy});
    // OverlayRef 构造时即绑定策略，第二个 overlay 复用同一策略会抛错。
    expect(() => createTestOverlay({scrollStrategy: strategy})).toThrow(/already been attached/);
    first.dispose();
  });
});

describe('BlockScrollStrategy', () => {
  it('锁定页面滚动并在禁用时恢复', async () => {
    mockViewport(1024, 768);
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollWidth', {
      value: 1024,
      configurable: true,
    });
    vi.spyOn(viewportRuler, 'getViewportScrollPosition').mockReturnValue({top: 120, left: 30});

    const ref = createTestOverlay({scrollStrategy: createBlockScrollStrategy()});
    ref.attach(h('div'));
    await nextTick();

    const html = document.documentElement;
    expect(html.classList.contains('vcdk-overlay-global-scrollblock')).toBe(true);
    expect(html.style.left).toBe('-30px');
    expect(html.style.top).toBe('-120px');

    ref.detach();
    expect(html.classList.contains('vcdk-overlay-global-scrollblock')).toBe(false);
    expect(html.style.left).toBe('');
    expect(html.style.top).toBe('');
    ref.dispose();
  });

  it('多个 overlay 同时开启时只锁定一次', async () => {
    mockViewport(1024, 768);
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    const first = createTestOverlay({scrollStrategy: createBlockScrollStrategy()});
    const second = createTestOverlay({scrollStrategy: createBlockScrollStrategy()});
    first.attach(h('div'));
    await nextTick();
    second.attach(h('div'));
    await nextTick();
    expect(document.documentElement.classList.contains('vcdk-overlay-global-scrollblock')).toBe(true);
    second.detach();
    // 第二个从未参与锁定，解锁仍由第一个负责。
    expect(document.documentElement.classList.contains('vcdk-overlay-global-scrollblock')).toBe(true);
    first.detach();
    expect(document.documentElement.classList.contains('vcdk-overlay-global-scrollblock')).toBe(false);
    first.dispose();
    second.dispose();
  });
});

describe('RepositionScrollStrategy', () => {
  it('滚动时重新定位', async () => {
    const ref = createTestOverlay({scrollStrategy: createRepositionScrollStrategy()});
    const spy = vi.spyOn(ref, 'updatePosition');
    ref.attach(h('div'));
    await nextTick();
    spy.mockClear();
    window.dispatchEvent(new Event('scroll'));
    expect(spy).toHaveBeenCalledTimes(1);
    ref.dispose();
  });

  it('支持节流与尾部调用', async () => {
    vi.useFakeTimers();
    const ref = createTestOverlay({
      scrollStrategy: createRepositionScrollStrategy({scrollThrottle: 50}),
    });
    const spy = vi.spyOn(ref, 'updatePosition');
    ref.attach(h('div'));
    await nextTick();
    spy.mockClear();

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(10);
    expect(spy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
    ref.dispose();
  });

  it('autoClose 在 overlay 完全移出视口时关闭', async () => {
    mockViewport(1024, 768);
    const ref = createTestOverlay({
      scrollStrategy: createRepositionScrollStrategy({autoClose: true}),
    });
    ref.attach(h('div'));
    await nextTick();
    vi.spyOn(ref.overlayElement, 'getBoundingClientRect').mockReturnValue({
      top: 2000,
      bottom: 2400,
      left: 0,
      right: 300,
      width: 300,
      height: 400,
      x: 0,
      y: 2000,
      toJSON: () => ({}),
    } as DOMRect);
    window.dispatchEvent(new Event('scroll'));
    expect(ref.hasAttached()).toBe(false);
    ref.dispose();
  });
});
