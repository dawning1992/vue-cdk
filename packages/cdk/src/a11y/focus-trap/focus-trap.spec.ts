import {describe, expect, it, vi} from 'vitest';
import {mockVisible} from '../../../tests/helpers';
import {FocusTrap, FocusTrapFactory, focusTrapFactory} from './focus-trap';
import {InteractivityChecker} from './interactivity-checker';

function createRegion(): {
  container: HTMLElement;
  first: HTMLInputElement;
  second: HTMLInputElement;
} {
  const container = document.createElement('div');
  const first = document.createElement('input');
  const second = document.createElement('input');
  first.className = 'first';
  second.className = 'second';
  container.append(first, second);
  document.body.appendChild(container);
  mockVisible(first);
  mockVisible(second);
  return {container, first, second};
}

function createTrap() {
  const region = createRegion();
  const trap = new FocusTrap(region.container, new InteractivityChecker(), document);
  return {...region, trap};
}

function anchorsOf(element: HTMLElement): [HTMLElement | null, HTMLElement | null] {
  const children = element.parentElement?.children ?? [];
  const index = Array.from(children).indexOf(element);
  return [
    (children[index - 1] as HTMLElement | undefined) ?? null,
    (children[index + 1] as HTMLElement | undefined) ?? null,
  ];
}

describe('FocusTrap', () => {
  it('构造时在目标元素前后插入两个视觉隐藏锚点', () => {
    const {container, trap} = createTrap();
    expect(trap.hasAttached()).toBe(true);

    const [start, end] = anchorsOf(container);
    expect(start?.classList.contains('vcdk-focus-trap-anchor')).toBe(true);
    expect(end?.classList.contains('vcdk-focus-trap-anchor')).toBe(true);
    expect(start?.classList.contains('vcdk-visually-hidden')).toBe(true);
    expect(start?.getAttribute('aria-hidden')).toBe('true');
    expect(start?.getAttribute('tabindex')).toBe('0');
    expect(end?.getAttribute('tabindex')).toBe('0');
  });

  it('enabled 切换锚点 tabindex', () => {
    const {container, trap} = createTrap();
    const [start, end] = anchorsOf(container);

    trap.enabled = false;
    expect(start?.hasAttribute('tabindex')).toBe(false);
    expect(end?.hasAttribute('tabindex')).toBe(false);

    trap.enabled = true;
    expect(start?.getAttribute('tabindex')).toBe('0');
    expect(end?.getAttribute('tabindex')).toBe('0');
  });

  it('defer 模式下元素未挂载时 attachAnchors 返回 false，挂载后成功', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    container.appendChild(input);

    const trap = new FocusTrap(container, new InteractivityChecker(), document, true);
    expect(trap.attachAnchors()).toBe(false);
    expect(anchorsOf(container)[0]).toBeNull();

    document.body.appendChild(container);
    expect(trap.attachAnchors()).toBe(true);
    expect(anchorsOf(container)[0]).not.toBeNull();
  });

  it('focusInitialElement 聚焦第一个可 Tab 元素', () => {
    const {first, trap} = createTrap();
    expect(trap.focusInitialElement()).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('vcdk-focus-initial 标记优先于默认元素', () => {
    const {second, trap} = createTrap();
    second.setAttribute('vcdk-focus-initial', '');

    expect(trap.focusInitialElement()).toBe(true);
    expect(document.activeElement).toBe(second);
  });

  it('camelCase 标记（vcdkFocusInitial）同样生效', () => {
    const {second, trap} = createTrap();
    second.setAttribute('vcdkFocusInitial', '');

    expect(trap.focusInitialElement()).toBe(true);
    expect(document.activeElement).toBe(second);
  });

  it('focusInitialElement 指向不可聚焦元素时回退到其内部第一个可 Tab 元素并告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const {container, trap} = createTrap();
    const marker = document.createElement('div');
    const inner = document.createElement('input');
    mockVisible(inner);
    marker.setAttribute('vcdk-focus-initial', '');
    marker.appendChild(inner);
    container.prepend(marker);

    expect(trap.focusInitialElement()).toBe(true);
    expect(document.activeElement).toBe(inner);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('focusFirst/focusLastTabbableElement 支持区域边界标记', () => {
    const {first, second, trap} = createTrap();
    first.setAttribute('vcdk-focus-region-end', '');
    second.setAttribute('vcdk-focus-region-start', '');

    expect(trap.focusFirstTabbableElement()).toBe(true);
    expect(document.activeElement).toBe(second);

    expect(trap.focusLastTabbableElement()).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('focusLastTabbableElement 聚焦最后一个可 Tab 元素', () => {
    const {second, trap} = createTrap();
    expect(trap.focusLastTabbableElement()).toBe(true);
    expect(document.activeElement).toBe(second);
  });

  it('聚焦开始锚点会把焦点拉回区域内最后一个元素', () => {
    const {container, second, trap} = createTrap();
    const [start] = anchorsOf(container);

    (start as HTMLElement).focus();
    expect(document.activeElement).toBe(second);
    expect(trap.hasAttached()).toBe(true);
  });

  it('WhenReady 系列在 nextTick 后聚焦并返回 Promise<boolean>', async () => {
    const {first, trap} = createTrap();
    await expect(trap.focusInitialElementWhenReady()).resolves.toBe(true);
    expect(document.activeElement).toBe(first);

    await expect(trap.focusFirstTabbableElementWhenReady()).resolves.toBe(true);
    await expect(trap.focusLastTabbableElementWhenReady()).resolves.toBe(true);
  });

  it('空区域聚焦失败返回 false', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const trap = new FocusTrap(container, new InteractivityChecker(), document);

    expect(trap.focusInitialElement()).toBe(false);
    expect(trap.focusFirstTabbableElement()).toBe(false);
    expect(trap.focusLastTabbableElement()).toBe(false);
  });

  it('destroy 移除锚点并清空状态', () => {
    const {container, trap} = createTrap();
    trap.destroy();

    expect(trap.hasAttached()).toBe(false);
    expect(anchorsOf(container)[0]).toBeNull();
    expect(anchorsOf(container)[1]).toBeNull();

    // 销毁后不应残留可聚焦锚点。
    expect(document.querySelectorAll('.vcdk-focus-trap-anchor').length).toBe(0);
  });

  it('FocusTrapFactory 与全局单例均可创建陷阱', () => {
    const region = createRegion();
    const viaFactory = new FocusTrapFactory().create(region.container);
    expect(viaFactory.hasAttached()).toBe(true);

    const region2 = createRegion();
    const viaSingleton = focusTrapFactory.create(region2.container);
    expect(viaSingleton.hasAttached()).toBe(true);
  });
});
