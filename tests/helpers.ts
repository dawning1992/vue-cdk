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

/** 创建真实 OverlayRef 用于策略/生命周期测试。 */
export function createTestOverlay(config?: OverlayConfig): OverlayRef {
  return createOverlayRef(config);
}

/** 等待 Vue 调度队列（nextTick 链）完成。 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
