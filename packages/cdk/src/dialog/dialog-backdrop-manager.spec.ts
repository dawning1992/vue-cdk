import {afterEach, describe, expect, it} from 'vitest';
import {defineComponent, h} from 'vue';
import {dialogService} from './dialog';
import {dispatchMouseEvent} from '../../tests/helpers';

/**
 * 对话框共享遮罩测试。
 *
 * 用例间通过 afterEach 关闭全部对话框并依赖 tests/setup.ts 清理 DOM，
 * 与 dialog.spec.ts 保持相同的隔离约定。
 */
afterEach(() => {
  dialogService.closeAll();
});

/** 渲染简单文本内容，用于验证共享遮罩行为。 */
const SimpleContent = defineComponent({
  name: 'SimpleContent',
  setup() {
    return () => h('div', {class: 'simple-content'}, 'hello dialog');
  },
});

/** 断言共享遮罩元素存在并返回。 */
function getSharedBackdrop(): HTMLElement {
  const backdrop = document.querySelector('.vcdk-overlay-backdrop');
  expect(backdrop).not.toBeNull();
  return backdrop as HTMLElement;
}

describe('对话框共享遮罩', () => {
  it('连续打开两个对话框时全文档仅一个遮罩，z-index 顺序为 下层host < 遮罩 < 上层host', () => {
    const first = dialogService.open(SimpleContent);
    const second = dialogService.open(SimpleContent);

    const backdrops = document.querySelectorAll('.vcdk-overlay-backdrop');
    expect(backdrops).toHaveLength(1);
    expect(first.overlayRef.hostElement.style.zIndex).toBe('1002');
    expect(second.overlayRef.hostElement.style.zIndex).toBe('1004');
    const backdrop = backdrops[0] as HTMLElement;
    expect(backdrop.style.zIndex).toBe('1003');
    // 容器渲染模式下遮罩位于 overlay 容器内，覆盖下层窗口。
    expect(backdrop.parentElement?.classList.contains('vcdk-overlay-container')).toBe(true);
  });

  it('关闭顶层后遮罩 z-index 回落到剩余对话框之下', () => {
    const first = dialogService.open(SimpleContent);
    const second = dialogService.open(SimpleContent);

    second.close();

    expect(first.overlayRef.hostElement.style.zIndex).toBe('1002');
    expect(getSharedBackdrop().style.zIndex).toBe('1001');
  });

  it('关闭中间层后栈塌缩重排剩余对话框的 z-index', () => {
    const first = dialogService.open(SimpleContent);
    const middle = dialogService.open(SimpleContent);
    const top = dialogService.open(SimpleContent);

    middle.close();

    expect(first.overlayRef.hostElement.style.zIndex).toBe('1002');
    expect(top.overlayRef.hostElement.style.zIndex).toBe('1004');
    expect(getSharedBackdrop().style.zIndex).toBe('1003');
  });

  it('全部关闭后共享遮罩移除', () => {
    const first = dialogService.open(SimpleContent);
    const second = dialogService.open(SimpleContent);

    first.close();
    second.close();

    expect(document.querySelector('.vcdk-overlay-backdrop')).toBeNull();
  });

  it('存在实际过渡时，最后一个对话框关闭不会立即移除遮罩', () => {
    const dialog = dialogService.open(SimpleContent);
    const backdrop = getSharedBackdrop();
    backdrop.style.transitionDuration = '100ms';

    dialog.close();

    expect(document.querySelector('.vcdk-overlay-backdrop')).toBe(backdrop);
    expect(backdrop.classList.contains('vcdk-overlay-backdrop-showing')).toBe(false);

    backdrop.dispatchEvent(new Event('transitionend'));

    expect(document.querySelector('.vcdk-overlay-backdrop')).toBeNull();
  });

  it('自定义过渡不包含 opacity 时，按自定义属性结束并移除遮罩', () => {
    const dialog = dialogService.open(SimpleContent);
    const backdrop = getSharedBackdrop();
    backdrop.style.transitionProperty = 'transform';
    backdrop.style.transitionDuration = '100ms';

    dialog.close();

    const transitionEnd = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(transitionEnd, 'propertyName', {value: 'transform'});
    backdrop.dispatchEvent(transitionEnd);

    expect(document.querySelector('.vcdk-overlay-backdrop')).toBeNull();
  });

  it('多属性过渡时等待最晚结束的属性，避免遮罩提前移除', () => {
    const dialog = dialogService.open(SimpleContent);
    const backdrop = getSharedBackdrop();
    backdrop.style.transitionProperty = 'transform, opacity';
    backdrop.style.transitionDuration = '100ms, 300ms';

    dialog.close();

    const shortTransitionEnd = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(shortTransitionEnd, 'propertyName', {value: 'transform'});
    backdrop.dispatchEvent(shortTransitionEnd);
    expect(document.querySelector('.vcdk-overlay-backdrop')).toBe(backdrop);

    const longTransitionEnd = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(longTransitionEnd, 'propertyName', {value: 'opacity'});
    backdrop.dispatchEvent(longTransitionEnd);
    expect(document.querySelector('.vcdk-overlay-backdrop')).toBeNull();
  });

  it('遮罩离场期间重新打开对话框时复用遮罩并取消旧离场', async () => {
    const first = dialogService.open(SimpleContent);
    const backdrop = getSharedBackdrop();
    backdrop.style.transitionDuration = '100ms';

    first.close();
    const second = dialogService.open(SimpleContent);

    expect(getSharedBackdrop()).toBe(backdrop);
    expect(backdrop.classList.contains('vcdk-overlay-backdrop-showing')).toBe(false);

    // 旧离场事件不能移除新打开的共享遮罩。
    backdrop.dispatchEvent(new Event('transitionend'));
    expect(getSharedBackdrop()).toBe(backdrop);

    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    // 新一轮淡入完成后，遮罩应保持可见。
    backdrop.dispatchEvent(new Event('transitionend'));
    expect(backdrop.classList.contains('vcdk-overlay-backdrop-showing')).toBe(true);

    second.close();
  });

  it('transitioncancel 后按当前状态收敛，不残留遮罩', () => {
    const dialog = dialogService.open(SimpleContent);
    const backdrop = getSharedBackdrop();
    backdrop.style.transitionDuration = '100ms';

    dialog.close();
    backdrop.dispatchEvent(new Event('transitioncancel'));

    expect(document.querySelector('.vcdk-overlay-backdrop')).toBeNull();
  });

  it('遮罩点击只派发给最上层参与对话框，下层 backdropClick 不触发', () => {
    const first = dialogService.open(SimpleContent);
    const second = dialogService.open(SimpleContent);
    const firstClicks: MouseEvent[] = [];
    const secondClicks: MouseEvent[] = [];
    first.backdropClick.subscribe(event => firstClicks.push(event));
    second.backdropClick.subscribe(event => secondClicks.push(event));

    dispatchMouseEvent(getSharedBackdrop(), 'click');

    expect(secondClicks).toHaveLength(1);
    expect(firstClicks).toHaveLength(0);
  });

  it('顶层无遮罩对话框时共享遮罩沉到所有对话框之下', () => {
    const first = dialogService.open(SimpleContent);
    const second = dialogService.open(SimpleContent, {hasBackdrop: false});

    expect(first.overlayRef.hostElement.style.zIndex).toBe('1002');
    expect(second.overlayRef.hostElement.style.zIndex).toBe('1004');
    expect(getSharedBackdrop().style.zIndex).toBe('1001');
  });

  it('中间层无遮罩对话框仍被顶层遮罩覆盖', () => {
    dialogService.open(SimpleContent);
    dialogService.open(SimpleContent, {hasBackdrop: false});
    const top = dialogService.open(SimpleContent);

    expect(top.overlayRef.hostElement.style.zIndex).toBe('1006');
    expect(getSharedBackdrop().style.zIndex).toBe('1005');
  });

  it('backdropClass 跟随顶层参与对话框并在关闭后切换', () => {
    dialogService.open(SimpleContent, {backdropClass: 'backdrop-first'});
    const second = dialogService.open(SimpleContent, {backdropClass: 'backdrop-second'});
    const backdrop = getSharedBackdrop();

    expect(backdrop.classList.contains('backdrop-second')).toBe(true);
    expect(backdrop.classList.contains('backdrop-first')).toBe(false);

    second.close();

    expect(backdrop.classList.contains('backdrop-first')).toBe(true);
    expect(backdrop.classList.contains('backdrop-second')).toBe(false);
  });

  it('任一参与对话框禁用动画时共享遮罩使用 noop 动画', () => {
    dialogService.open(SimpleContent, {disableAnimations: true});
    dialogService.open(SimpleContent);

    expect(
      getSharedBackdrop().classList.contains('vcdk-overlay-backdrop-noop-animation'),
    ).toBe(true);
  });

  it('popover 模式下共享遮罩迁入顶层对话框 host 内部且无内联 z-index', () => {
    Object.defineProperty(document.body, 'showPopover', {value: () => {}, configurable: true});
    try {
      const first = dialogService.open(SimpleContent);
      const second = dialogService.open(SimpleContent);
      const backdrop = getSharedBackdrop();

      expect(backdrop.parentElement).toBe(second.overlayRef.hostElement);
      expect(backdrop.style.zIndex).toBe('');
      expect(first.overlayRef.hostElement.style.zIndex).toBe('1002');
      expect(second.overlayRef.hostElement.style.zIndex).toBe('1004');

      second.close();

      // 顶层关闭后遮罩迁移到下一层 host 内部，由 top-layer 顺序实现层叠。
      expect(backdrop.parentElement).toBe(first.overlayRef.hostElement);
      expect(backdrop.style.zIndex).toBe('');
    } finally {
      delete (document.body as unknown as {showPopover?: unknown}).showPopover;
    }
  });
});
