import {describe, expect, it} from 'vitest';
import {FullscreenOverlayContainer, OverlayContainer, overlayContainer} from './overlay-container';
import {injectOverlayStyles} from './style-inject';

describe('OverlayContainer', () => {
  it('首次访问时懒创建容器并挂到 body', () => {
    const container = new OverlayContainer();
    expect(container.hasContainerElement()).toBe(false);
    const element = container.getContainerElement();
    expect(container.hasContainerElement()).toBe(true);
    expect(element.classList.contains('vcdk-overlay-container')).toBe(true);
    expect(document.body.contains(element)).toBe(true);
    container.dispose();
  });

  it('重复获取返回同一个容器元素', () => {
    const container = new OverlayContainer();
    const first = container.getContainerElement();
    const second = container.getContainerElement();
    expect(first).toBe(second);
    container.dispose();
  });

  it('创建容器时注入结构样式', () => {
    const container = new OverlayContainer();
    container.getContainerElement();
    const style = document.head.querySelector<HTMLStyleElement>('style[data-vcdk-overlay]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.vcdk-overlay-container');
    container.dispose();
  });

  it('dispose 移除容器元素', () => {
    const container = new OverlayContainer();
    const element = container.getContainerElement();
    container.dispose();
    expect(document.body.contains(element)).toBe(false);
    expect(container.hasContainerElement()).toBe(false);
  });

  it('全局单例在测试清理后可以重建', () => {
    const first = overlayContainer.getContainerElement();
    overlayContainer.dispose();
    const second = overlayContainer.getContainerElement();
    expect(first).not.toBe(second);
    overlayContainer.dispose();
  });
});

describe('FullscreenOverlayContainer', () => {
  it('全屏变化时把容器移入全屏元素，退出后移回 body', () => {
    const container = new FullscreenOverlayContainer();
    const element = container.getContainerElement();
    const fullscreenTarget = document.createElement('div');
    document.body.appendChild(fullscreenTarget);

    Object.defineProperty(document, 'fullscreenElement', {
      value: fullscreenTarget,
      configurable: true,
    });
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(fullscreenTarget.contains(element)).toBe(true);

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      configurable: true,
    });
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(document.body.contains(element)).toBe(true);

    fullscreenTarget.remove();
    container.dispose();
  });
});

describe('injectOverlayStyles', () => {
  it('幂等注入样式', () => {
    injectOverlayStyles();
    const count = document.head.querySelectorAll('style[data-vcdk-overlay]').length;
    injectOverlayStyles();
    expect(document.head.querySelectorAll('style[data-vcdk-overlay]').length).toBe(count);
  });
});
