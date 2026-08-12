import {describe, expect, it, vi} from 'vitest';
import {h, nextTick} from 'vue';
import {createTestOverlay} from '../../../tests/helpers';

describe('OverlayKeyboardDispatcher', () => {
  it('键盘事件只派发给最上层的有订阅 overlay', async () => {
    const first = createTestOverlay();
    const second = createTestOverlay();
    first.attach(h('div'));
    second.attach(h('div'));
    await nextTick();

    const firstKeys: string[] = [];
    const secondKeys: string[] = [];
    first.keydownEvents().subscribe(event => firstKeys.push(event.key));
    second.keydownEvents().subscribe(event => secondKeys.push(event.key));

    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}));
    expect(secondKeys).toEqual(['a']);
    expect(firstKeys).toEqual([]);

    // 最上层卸载后，事件落到下一层。
    second.detach();
    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'b'}));
    expect(firstKeys).toEqual(['b']);
    expect(secondKeys).toEqual(['a']);

    first.dispose();
    second.dispose();
  });

  it('无订阅的 overlay 不阻塞下层', async () => {
    const top = createTestOverlay();
    const bottom = createTestOverlay();
    top.attach(h('div'));
    bottom.attach(h('div'));
    await nextTick();
    const keys: string[] = [];
    bottom.keydownEvents().subscribe(event => keys.push(event.key));
    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'z'}));
    expect(keys).toEqual(['z']);
    top.dispose();
    bottom.dispose();
  });

  it('eventPredicate 过滤事件', async () => {
    const ref = createTestOverlay({
      eventPredicate: event => (event as KeyboardEvent).key === 'x',
    });
    ref.attach(h('div'));
    await nextTick();
    const keys: string[] = [];
    ref.keydownEvents().subscribe(event => keys.push(event.key));
    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}));
    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'x'}));
    expect(keys).toEqual(['x']);
    ref.dispose();
  });

  it('全部卸载后自动移除全局监听', async () => {
    const ref = createTestOverlay();
    ref.attach(h('div'));
    await nextTick();
    ref.dispose();
    ref.detach();
    // 不抛错即通过；监听器随栈清空自动卸载。
    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}));
  });
});

describe('OverlayOutsideClickDispatcher', () => {
  function clickAt(target: Element): void {
    target.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    target.dispatchEvent(new MouseEvent('click', {bubbles: true}));
  }

  it('外部点击派发给所有栈内 overlay，面板内点击截断', async () => {
    const first = createTestOverlay();
    const second = createTestOverlay();
    first.attach(h('div'));
    second.attach(h('div'));
    await nextTick();

    const firstClicks: Event[] = [];
    const secondClicks: Event[] = [];
    first.outsidePointerEvents().subscribe(event => firstClicks.push(event));
    second.outsidePointerEvents().subscribe(event => secondClicks.push(event));

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    clickAt(outside);
    expect(secondClicks).toHaveLength(1);
    expect(firstClicks).toHaveLength(1);

    // 点击最上层面板内部：循环在最上层截断，下层不收到事件。
    clickAt(second.overlayElement);
    expect(secondClicks).toHaveLength(1);
    expect(firstClicks).toHaveLength(1);

    outside.remove();
    first.dispose();
    second.dispose();
  });

  it('pointerdown 在面板内、click 在面板外时视为内部点击', async () => {
    const ref = createTestOverlay();
    ref.attach(h('div'));
    await nextTick();
    const clicks = vi.fn();
    ref.outsidePointerEvents().subscribe(clicks);

    ref.overlayElement.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(clicks).not.toHaveBeenCalled();
    ref.dispose();
  });

  it('contextmenu 视为外部点击', async () => {
    const ref = createTestOverlay();
    ref.attach(h('div'));
    await nextTick();
    const clicks = vi.fn();
    ref.outsidePointerEvents().subscribe(clicks);
    document.body.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true}));
    expect(clicks).toHaveBeenCalledTimes(1);
    ref.dispose();
  });

  it('右键手势后补发的 click/auxclick 不会被误判为外部点击', async () => {
    const ref = createTestOverlay();
    ref.attach(h('div'));
    await nextTick();
    const clicks = vi.fn();
    ref.outsidePointerEvents().subscribe(clicks);

    const outside = document.createElement('div');
    document.body.appendChild(outside);

    // macOS 双指轻点：pointerdown → contextmenu → 补发 click（同一手势）。
    outside.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    outside.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true}));
    // contextmenu 本身作为外部点击派发一次。
    expect(clicks).toHaveBeenCalledTimes(1);
    outside.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    // 同手势补发的 click 不应再触发一次。
    expect(clicks).toHaveBeenCalledTimes(1);

    // Firefox 双指轻点补发 auxclick，同样不应触发。
    outside.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    outside.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true}));
    expect(clicks).toHaveBeenCalledTimes(2);
    outside.dispatchEvent(new MouseEvent('auxclick', {bubbles: true}));
    expect(clicks).toHaveBeenCalledTimes(2);

    // 之后独立的左键手势（新的 pointerdown）应正常派发外部点击。
    outside.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    outside.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(clicks).toHaveBeenCalledTimes(3);

    outside.remove();
    ref.dispose();
  });

  it('首次由 contextmenu 打开的菜单不会被同手势补发的 click/auxclick 立即关闭', async () => {
    const outside = document.createElement('div');
    document.body.appendChild(outside);

    // 真实时序：pointerdown/contextmenu 先发生（此时 overlay 尚未挂载，
    // 分发器仍应记录手势状态），菜单在 contextmenu 处理器中才打开。
    outside.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    outside.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true}));

    const ref = createTestOverlay();
    ref.attach(h('div'));
    await nextTick();
    const clicks = vi.fn();
    ref.outsidePointerEvents().subscribe(clicks);

    // Chrome 在 contextmenu 之后补发 auxclick（macOS 双指轻点/右键）。
    outside.dispatchEvent(new MouseEvent('auxclick', {bubbles: true}));
    expect(clicks).not.toHaveBeenCalled();

    // Safari 在 Control+点击后补发的是普通 click，同样不应关闭刚打开的菜单。
    outside.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    outside.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true}));
    // 此时 overlay 已挂载，contextmenu 本身作为外部点击派发一次；
    // 紧随其后的 click 属于同一手势，不应再触发。
    expect(clicks).toHaveBeenCalledTimes(1);
    outside.dispatchEvent(new MouseEvent('click', {bubbles: true, ctrlKey: true}));
    expect(clicks).toHaveBeenCalledTimes(1);

    // 之后独立的左键手势应正常触发外部点击。
    outside.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    outside.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(clicks).toHaveBeenCalledTimes(2);

    outside.remove();
    ref.dispose();
  });
});
