import {afterEach} from 'vitest';
import {overlayContainer} from '../src/overlay/overlay-container';

/**
 * 每个用例执行结束后清理 overlay 容器与 body 残留，保证用例间隔离。
 */
afterEach(() => {
  // 重置全局容器单例，避免其缓存被测试清理移除的 DOM 元素。
  overlayContainer.dispose();
  document.querySelectorAll('.vcdk-overlay-container').forEach(el => el.remove());
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.cssText = '';
});
