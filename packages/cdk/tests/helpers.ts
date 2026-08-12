import {vi} from 'vitest';
import {createOverlayRef} from '../src/overlay/overlay';
import type {OverlayConfig} from '../src/overlay/overlay-config';
import type {OverlayRef} from '../src/overlay/overlay-ref';

/** 模拟视口几何信息（jsdom 默认 documentElement.clientWidth 为 0）。 */
export function mockViewport(width: number, height: number): void {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: height,
    configurable: true,
  });
  Object.defineProperty(window, 'innerWidth', {value: width, configurable: true});
  Object.defineProperty(window, 'innerHeight', {value: height, configurable: true});
}

/** 模拟元素的 getBoundingClientRect。 */
export function mockRect(
  element: Element,
  rect: Partial<DOMRect>,
): ReturnType<typeof vi.spyOn> {
  const full: Record<string, number | (() => object)> = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  };
  Object.assign(full, rect);
  // 派生未显式提供的 right/bottom，避免 origin 端点计算拿不到正确值。
  if (rect.right == null && rect.left != null && rect.width != null) {
    full.right = rect.left + rect.width;
  }
  if (rect.bottom == null && rect.top != null && rect.height != null) {
    full.bottom = rect.top + rect.height;
  }
  return vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(full as unknown as DOMRect);
}

/**
 * 模拟元素的滚动与几何指标。
 * scrollTop/scrollLeft 提供 getter/setter，便于测试中直接赋值后派发滚动事件。
 */
export function mockScrollMetrics(
  element: Element,
  metrics: Partial<{
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
    offsetWidth: number;
    offsetHeight: number;
    scrollTop: number;
    scrollLeft: number;
  }>,
): void {
  for (const [key, value] of Object.entries(metrics)) {
    if (key === 'scrollTop' || key === 'scrollLeft') {
      let current = value ?? 0;
      Object.defineProperty(element, key, {
        get: () => current,
        set: next => {
          current = next;
        },
        configurable: true,
      });
    } else {
      Object.defineProperty(element, key, {value: value ?? 0, configurable: true});
    }
  }
}

/**
 * 等待下一动画帧：jsdom 无 requestAnimationFrame 时退化为 16ms 定时器。
 * 用于虚拟滚动「按帧合并滚动事件」的测试。
 */
export function flushRaf(): Promise<void> {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 16);
    }
  });
}

/** 创建真实 OverlayRef 用于策略/生命周期测试。 */
export function createTestOverlay(config?: OverlayConfig): OverlayRef {
  return createOverlayRef(config);
}

/** 等待 Vue 调度队列（nextTick 链）完成。 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * 使元素在 jsdom 中拥有几何尺寸。
 * jsdom 默认 offsetWidth/offsetHeight 为 0，会导致可见性判断失败；
 * 需要通过 defineProperty 模拟真实浏览器行为。
 */
export function mockVisible(element: Element): void {
  Object.defineProperty(element, 'offsetWidth', {value: 100, configurable: true});
  Object.defineProperty(element, 'offsetHeight', {value: 100, configurable: true});
}

/** 创建带 keyCode 的键盘事件（jsdom 支持构造器传入 keyCode）。 */
export function createKeyboardEvent(
  type: string,
  keyCode: number,
  init: {
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    key?: string;
  } = {},
): KeyboardEvent {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...init,
    keyCode,
  } as KeyboardEventInit);
}

/** 派发鼠标事件并返回事件对象。 */
export type TestMouseEventInit = MouseEventInit & {
  pageX?: number;
  pageY?: number;
};

export function dispatchMouseEvent(
  target: EventTarget,
  type: string,
  init: TestMouseEventInit = {},
): MouseEvent {
  const event = new MouseEvent(type, {bubbles: true, cancelable: true, ...init});
  target.dispatchEvent(event);
  return event;
}

/** 派发触摸事件；jsdom 的 Touch/TouchEvent 能力有限，必要时用 defineProperty 补充 touches。 */
export function dispatchTouchEvent(
  target: EventTarget,
  typeOrTouches: string | unknown[] = 'touchstart',
  touches?: unknown[],
): TouchEvent {
  const type = typeof typeOrTouches === 'string' ? typeOrTouches : 'touchstart';
  const touchList = typeof typeOrTouches === 'string' ? touches : typeOrTouches;
  const event = new TouchEvent(type, {bubbles: true, cancelable: true});
  if (touchList) {
    Object.defineProperty(event, 'touches', {get: () => touchList});
    Object.defineProperty(event, 'targetTouches', {get: () => touchList});
    Object.defineProperty(event, 'changedTouches', {get: () => touchList});
  }
  target.dispatchEvent(event);
  return event;
}
