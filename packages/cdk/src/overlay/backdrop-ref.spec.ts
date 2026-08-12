import {describe, expect, it, vi} from 'vitest';
import {BackdropRef} from './backdrop-ref';

describe('BackdropRef', () => {
  it('创建遮罩元素并监听点击', () => {
    const onClick = vi.fn();
    const backdrop = new BackdropRef(document, onClick);
    expect(backdrop.element.classList.contains('vcdk-overlay-backdrop')).toBe(true);
    backdrop.element.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    backdrop.dispose();
  });

  it('detach 进入淡出状态并最终移除', () => {
    vi.useFakeTimers();
    const backdrop = new BackdropRef(document, vi.fn());
    document.body.appendChild(backdrop.element);
    backdrop.element.classList.add('vcdk-overlay-backdrop-showing');

    backdrop.detach();
    expect(backdrop.element.classList.contains('vcdk-overlay-backdrop-showing')).toBe(false);
    expect(backdrop.element.style.pointerEvents).toBe('none');

    // jsdom 不派发 transitionend，依赖 500ms 兜底定时器移除。
    vi.advanceTimersByTime(600);
    expect(document.body.contains(backdrop.element)).toBe(false);
    vi.useRealTimers();
  });

  it('transitionend 事件立即移除元素', () => {
    const backdrop = new BackdropRef(document, vi.fn());
    document.body.appendChild(backdrop.element);
    backdrop.detach();
    backdrop.element.dispatchEvent(new Event('transitionend'));
    expect(document.body.contains(backdrop.element)).toBe(false);
  });

  it('dispose 幂等', () => {
    const backdrop = new BackdropRef(document, vi.fn());
    backdrop.dispose();
    backdrop.dispose();
  });
});
