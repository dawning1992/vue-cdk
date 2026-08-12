import {describe, expect, it, vi} from 'vitest';
import {h, nextTick} from 'vue';
import {createTestOverlay} from '../../tests/helpers';
import {createGlobalPositionStrategy} from './position/global-position-strategy';
import {createNoopScrollStrategy} from './scroll/noop-scroll-strategy';

describe('OverlayRef 生命周期', () => {
  it('attach 渲染内容到容器面板', async () => {
    const ref = createTestOverlay();
    const vnode = ref.attach(() => h('div', {class: 'content'}, 'hello'));
    await nextTick();
    expect(ref.hasAttached()).toBe(true);
    expect(ref.overlayElement.querySelector('.content')?.textContent).toBe('hello');
    expect(document.querySelector('.vcdk-overlay-container')!.contains(ref.hostElement)).toBe(true);
    expect(vnode).not.toBeNull();
    ref.dispose();
  });

  it('重复 attach 抛错', () => {
    const ref = createTestOverlay();
    ref.attach(h('div'));
    expect(() => ref.attach(h('div'))).toThrow(/已挂载/);
    ref.dispose();
  });

  it('dispose 后的 attach 返回 null', () => {
    const ref = createTestOverlay();
    ref.dispose();
    expect(ref.attach(h('div'))).toBeNull();
    expect(ref.hasAttached()).toBe(false);
  });

  it('detach 卸载内容并触发事件流', async () => {
    const ref = createTestOverlay();
    const onAttach = vi.fn();
    const onDetach = vi.fn();
    ref.attachments().subscribe(onAttach);
    ref.detachments().subscribe(onDetach);

    ref.attach(h('div'));
    await nextTick();
    expect(onAttach).toHaveBeenCalledTimes(1);

    ref.detach();
    expect(ref.hasAttached()).toBe(false);
    expect(ref.overlayElement.children).toHaveLength(0);
    expect(onDetach).toHaveBeenCalledTimes(1);
    // 未挂载时 detach 为空操作。
    ref.detach();
    expect(onDetach).toHaveBeenCalledTimes(1);
    ref.dispose();
  });

  it('detach 移出 host，重新 attach 恢复到原父节点', async () => {
    const ref = createTestOverlay();
    ref.attach(h('div'));
    await nextTick();
    const container = document.querySelector('.vcdk-overlay-container')!;
    expect(container.contains(ref.hostElement)).toBe(true);

    ref.detach();
    expect(container.contains(ref.hostElement)).toBe(false);

    ref.attach(h('div'));
    await nextTick();
    expect(container.contains(ref.hostElement)).toBe(true);
    ref.dispose();
  });

  it('dispose 幂等并结束所有事件流', () => {
    const ref = createTestOverlay();
    const onDetach = vi.fn();
    ref.detachments().subscribe(onDetach);
    ref.attach(h('div'));
    ref.dispose();
    ref.dispose();
    ref.attach(h('div'));
    expect(onDetach).toHaveBeenCalledTimes(1);
  });
});

describe('OverlayRef 交互', () => {
  it('backdrop 点击派发 backdropClick', async () => {
    const ref = createTestOverlay({hasBackdrop: true});
    const onClick = vi.fn();
    ref.backdropClick().subscribe(onClick);
    ref.attach(h('div'));
    await nextTick();
    expect(ref.backdropElement).not.toBeNull();
    expect(ref.backdropElement!.classList.contains('vcdk-overlay-backdrop')).toBe(true);
    ref.backdropElement!.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    ref.dispose();
  });

  it('detachBackdrop 淡出遮罩', async () => {
    const ref = createTestOverlay({hasBackdrop: true});
    ref.attach(h('div'));
    await nextTick();
    const backdrop = ref.backdropElement!;
    ref.detachBackdrop();
    expect(backdrop.classList.contains('vcdk-overlay-backdrop-showing')).toBe(false);
    expect(backdrop.style.pointerEvents).toBe('none');
    ref.dispose();
  });

  it('禁用动画时遮罩立即销毁', async () => {
    const ref = createTestOverlay({hasBackdrop: true, disableAnimations: true});
    ref.attach(h('div'));
    await nextTick();
    const backdrop = ref.backdropElement!;
    expect(backdrop.classList.contains('vcdk-overlay-backdrop-noop-animation')).toBe(true);
    ref.detachBackdrop();
    expect(ref.backdropElement).toBeNull();
    ref.dispose();
  });

  it('updateSize 应用像素尺寸', () => {
    const ref = createTestOverlay();
    ref.updateSize({width: 300, minHeight: 50, maxWidth: '50%'});
    expect(ref.overlayElement.style.width).toBe('300px');
    expect(ref.overlayElement.style.minHeight).toBe('50px');
    expect(ref.overlayElement.style.maxWidth).toBe('50%');
    ref.dispose();
  });

  it('addPanelClass/removePanelClass 维护面板类', () => {
    const ref = createTestOverlay();
    ref.addPanelClass(['a', 'b']);
    expect(ref.overlayElement.classList.contains('a')).toBe(true);
    expect(ref.overlayElement.classList.contains('b')).toBe(true);
    ref.removePanelClass('a');
    expect(ref.overlayElement.classList.contains('a')).toBe(false);
    ref.dispose();
  });

  it('setDirection 同步 host 的 dir 属性', () => {
    const ref = createTestOverlay();
    expect(ref.getDirection()).toBe('ltr');
    ref.setDirection('rtl');
    expect(ref.getDirection()).toBe('rtl');
    expect(ref.hostElement.getAttribute('dir')).toBe('rtl');
    ref.dispose();
  });

  it('updatePosition 调用定位策略', () => {
    const strategy = createGlobalPositionStrategy();
    const applySpy = vi.spyOn(strategy, 'apply');
    const ref = createTestOverlay({positionStrategy: strategy});
    ref.updatePosition();
    expect(applySpy).toHaveBeenCalledTimes(1);
    ref.dispose();
  });

  it('updatePositionStrategy 切换策略并立即应用', () => {
    const oldStrategy = createGlobalPositionStrategy();
    const newStrategy = createGlobalPositionStrategy();
    const attachSpy = vi.spyOn(newStrategy, 'attach');
    const applySpy = vi.spyOn(newStrategy, 'apply');
    const ref = createTestOverlay({positionStrategy: oldStrategy});
    ref.attach(h('div'));
    ref.updatePositionStrategy(newStrategy);
    expect(attachSpy).toHaveBeenCalled();
    expect(applySpy).toHaveBeenCalled();
    ref.dispose();
  });

  it('updateScrollStrategy 切换滚动策略', async () => {
    const ref = createTestOverlay();
    ref.attach(h('div'));
    const strategy = createNoopScrollStrategy();
    const enableSpy = vi.spyOn(strategy, 'enable');
    ref.updateScrollStrategy(strategy);
    expect(enableSpy).toHaveBeenCalled();
    ref.dispose();
  });

  it('disposeOnNavigation 在导航时销毁', async () => {
    const ref = createTestOverlay({disposeOnNavigation: true});
    ref.attach(h('div'));
    await nextTick();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(ref.hasAttached()).toBe(false);
    ref.dispose();
  });
});
