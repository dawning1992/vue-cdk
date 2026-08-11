import {afterEach, describe, expect, it, vi} from 'vitest';
import {flushPromises, mockVisible} from '../../../tests/helpers';
import {ConfigurableFocusTrapFactory, configurableFocusTrapFactory} from './configurable-focus-trap-factory';
import type {FocusTrap} from './focus-trap';
import {FocusTrapManager} from './focus-trap-manager';
import type {FocusTrapInertStrategy} from './focus-trap-inert-strategy';

/** 记录本用例创建的陷阱，afterEach 统一销毁，避免污染共享管理器栈。 */
let created: FocusTrap[] = [];

afterEach(() => {
  created.forEach(trap => trap.destroy());
  created = [];
});

function createRegion(): {container: HTMLElement; first: HTMLInputElement} {
  const container = document.createElement('div');
  const first = document.createElement('input');
  first.className = 'first';
  container.appendChild(first);
  document.body.appendChild(container);
  mockVisible(first);
  return {container, first};
}

function anchorsTabIndex(element: HTMLElement): (string | null)[] {
  const children = Array.from(element.parentElement?.children ?? []);
  const index = children.indexOf(element);
  const candidates = [children[index - 1], children[index + 1]];
  // 只有真正的陷阱锚点才参与断言，避免把相邻普通元素误判为锚点。
  return candidates.map(candidate =>
    candidate?.classList.contains('vcdk-focus-trap-anchor')
      ? candidate.getAttribute('tabindex')
      : null,
  );
}

describe('ConfigurableFocusTrap 与 FocusTrapManager', () => {
  it('注册后成为栈顶并启用，新陷阱会停用旧陷阱', () => {
    const preventFocus = vi.fn();
    const allowFocus = vi.fn();
    const inertStrategy: FocusTrapInertStrategy = {preventFocus, allowFocus};
    const factory = new ConfigurableFocusTrapFactory({inertStrategy});

    const region1 = createRegion();
    const trap1 = factory.create(region1.container);
    created.push(trap1);
    expect(preventFocus).toHaveBeenCalledTimes(1);
    expect(anchorsTabIndex(region1.container)).toEqual(['0', '0']);

    const region2 = createRegion();
    const trap2 = factory.create(region2.container);
    created.push(trap2);

    // 第一个陷阱被停用（惰性策略撤销 + 锚点关闭），第二个启用。
    expect(allowFocus).toHaveBeenCalledTimes(1);
    expect(preventFocus).toHaveBeenCalledTimes(2);
    expect(anchorsTabIndex(region1.container)).toEqual([null, null]);
    expect(anchorsTabIndex(region2.container)).toEqual(['0', '0']);
  });

  it('销毁栈顶陷阱后恢复前一个陷阱', () => {
    const preventFocus = vi.fn();
    const allowFocus = vi.fn();
    const factory = new ConfigurableFocusTrapFactory({
      inertStrategy: {preventFocus, allowFocus},
    });

    const region1 = createRegion();
    const trap1 = factory.create(region1.container);
    const region2 = createRegion();
    const trap2 = factory.create(region2.container);
    created.push(trap1, trap2);

    // 记录销毁前的锚点引用，销毁后断言其已从 DOM 移除，
    // 避免与相邻区域（region1）的锚点混淆。
    const region2Start = region2.container.previousElementSibling as HTMLElement;
    const region2End = region2.container.nextElementSibling as HTMLElement;

    trap2.destroy();
    expect(anchorsTabIndex(region1.container)).toEqual(['0', '0']);
    expect(region2Start.isConnected).toBe(false);
    expect(region2End.isConnected).toBe(false);
    // 创建 trap1(1) + 创建 trap2(2) + 销毁 trap2 后恢复 trap1(3)。
    expect(preventFocus).toHaveBeenCalledTimes(3);
  });

  it('enabled=false 使陷阱退出栈并停用，重新启用后回到栈顶', () => {
    const factory = new ConfigurableFocusTrapFactory({
      inertStrategy: {preventFocus: vi.fn(), allowFocus: vi.fn()},
    });
    const region1 = createRegion();
    const trap1 = factory.create(region1.container);
    const region2 = createRegion();
    const trap2 = factory.create(region2.container);
    created.push(trap1, trap2);

    trap2.enabled = false;
    expect(anchorsTabIndex(region2.container)).toEqual([null, null]);
    expect(anchorsTabIndex(region1.container)).toEqual(['0', '0']);

    trap2.enabled = true;
    expect(anchorsTabIndex(region2.container)).toEqual(['0', '0']);
    expect(anchorsTabIndex(region1.container)).toEqual([null, null]);
  });

  it('FocusTrapManager 独立单元测试：注册/注销顺序', () => {
    const manager = new FocusTrapManager();
    const trapA = {
      _enable: vi.fn(),
      _disable: vi.fn(),
      focusInitialElementWhenReady: vi.fn(),
    };
    const trapB = {
      _enable: vi.fn(),
      _disable: vi.fn(),
      focusInitialElementWhenReady: vi.fn(),
    };

    manager.register(trapA);
    expect(trapA._enable).toHaveBeenCalledTimes(1);

    manager.register(trapB);
    expect(trapA._disable).toHaveBeenCalledTimes(1);
    expect(trapB._enable).toHaveBeenCalledTimes(1);

    manager.deregister(trapB);
    expect(trapB._disable).toHaveBeenCalledTimes(1);
    expect(trapA._enable).toHaveBeenCalledTimes(2);

    manager.deregister(trapA);
    expect(trapA._disable).toHaveBeenCalledTimes(2);
  });

  it('重复注册同一陷阱先去重，不产生重复栈条目', () => {
    const manager = new FocusTrapManager();
    const trap = {
      _enable: vi.fn(),
      _disable: vi.fn(),
      focusInitialElementWhenReady: vi.fn(),
    };

    manager.register(trap);
    manager.register(trap);
    // 与 Angular 一致：重复注册先去重，但每次 register 都会重新启用。
    expect(trap._enable).toHaveBeenCalledTimes(2);

    manager.deregister(trap);
    expect(trap._disable).toHaveBeenCalledTimes(1);
  });
});

describe('EventListenerFocusTrapInertStrategy', () => {
  it('聚焦陷阱外元素时被重定向回陷阱内', async () => {
    const region = createRegion();
    const trap = configurableFocusTrapFactory.create(region.container);
    created.push(trap);

    const outside = document.createElement('button');
    outside.textContent = '外部';
    document.body.appendChild(outside);

    outside.focus();
    expect(document.activeElement).toBe(outside);

    await flushPromises();
    expect(document.activeElement).toBe(region.first);
  });

  it('overlay 面板（.vcdk-overlay-pane）内的聚焦不强制拉回', async () => {
    const region = createRegion();
    const trap = configurableFocusTrapFactory.create(region.container);
    created.push(trap);

    const pane = document.createElement('div');
    pane.className = 'vcdk-overlay-pane';
    const outside = document.createElement('button');
    pane.appendChild(outside);
    document.body.appendChild(pane);

    outside.focus();
    await flushPromises();
    expect(document.activeElement).toBe(outside);
  });

  it('销毁陷阱后监听器被移除，外部聚焦不再被拉回', async () => {
    const region = createRegion();
    const trap = configurableFocusTrapFactory.create(region.container);
    trap.destroy();

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    await flushPromises();
    expect(document.activeElement).toBe(outside);
  });
});
