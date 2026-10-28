import {afterEach, describe, expect, it} from 'vitest';
import {defineComponent, h, nextTick} from 'vue';
import {Dialog} from './dialog';
import {overlayContainer} from '../overlay/overlay-container';

const Content = defineComponent({setup: () => () => h('button', '窗口内容')});
let dialog = new Dialog();

afterEach(() => {
  for (const ref of [...dialog.openDialogs]) ref.overlayRef.dispose();
  document.querySelectorAll('.vcdk-overlay-backdrop').forEach(element => element.remove());
  overlayContainer.dispose();
  dialog = new Dialog();
});

/** 等待样式提交到渲染帧，不以时间延迟推断动画结束。 */
async function renderFrame(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

/** 获取遮罩并等待其真实进场完成，确保随后有可见的退场起点。 */
async function visibleBackdrop(): Promise<HTMLElement> {
  const element = document.querySelector<HTMLElement>('.vcdk-overlay-backdrop')!;
  await renderFrame();
  await Promise.all(element.getAnimations().map(animation => {
    animation.finish();
    return animation.finished;
  }));
  return element;
}

describe('Dialog Chromium 动画集成', () => {
  it('原生 WAAPI finished 前保留窗口与焦点，完成后回传结果', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const ref = dialog.open(Content, {animation: {preset: 'scale', enterDuration: 0, leaveDuration: 10000}});
    await nextTick();
    const pane = ref.overlayRef.overlayElement;
    ref.close('完成');
    const animation = pane.getAnimations()[0]!;
    expect(animation).toBeDefined();
    expect(pane.isConnected).toBe(true);
    expect(pane.contains(document.activeElement)).toBe(true);
    animation.finish();
    await expect(ref.closedPromise).resolves.toBe('完成');
    expect(pane.isConnected).toBe(false);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('Popover 窗口与遮罩同时退场，窗口先结束时遮罩仍连接且完成后移除', async () => {
    const ref = dialog.open(Content, {animation: {preset: 'fade', enterDuration: 0, leaveDuration: 10000}});
    const backdrop = await visibleBackdrop();
    backdrop.style.transition = 'opacity 20s linear';
    void backdrop.offsetWidth;
    expect(ref.overlayRef.hostElement.matches(':popover-open')).toBe(true);
    ref.close();
    const paneAnimation = ref.overlayRef.overlayElement.getAnimations()[0]!;
    const transitions = backdrop.getAnimations();
    expect(transitions.length).toBeGreaterThan(0);
    expect(backdrop.classList.contains('vcdk-overlay-backdrop-showing')).toBe(false);
    expect(ref.containerInstance).not.toBeNull();
    transitions[0]!.currentTime = 1000;
    paneAnimation.finish();
    await ref.closedPromise;
    expect(backdrop.isConnected).toBe(true);
    expect(backdrop.parentElement?.classList.contains('vcdk-overlay-container')).toBe(true);
    await renderFrame();
    expect(backdrop.isConnected).toBe(true);
    const continued = backdrop.getAnimations();
    expect(continued.length).toBeGreaterThan(0);
    expect(continued.every(animation => animation.playState !== 'idle')).toBe(true);
    const continuation = continued.find(animation => !('transitionProperty' in animation))!;
    expect(Number(continuation.currentTime)).toBeGreaterThanOrEqual(1000);
    expect(continuation.effect!.getTiming().duration).toBe(20000);
    await Promise.allSettled(continued.map(animation => {
      animation.finish();
      return animation.finished;
    }));
    await expect.poll(() => backdrop.isConnected).toBe(false);
  });

  it('CSS 多属性过渡等待所有真实完成信号，短属性先结束不移除遮罩', async () => {
    const style = document.createElement('style');
    style.textContent = '.dialog-test-backdrop {opacity:0;transform:scale(.95);transition:all 10s linear} .dialog-test-backdrop.vcdk-overlay-backdrop-showing {opacity:1;transform:scale(1)}';
    document.head.appendChild(style);
    try {
      const ref = dialog.open(Content, {backdropClass: 'dialog-test-backdrop', animation: {leave: ({element}) => element.animate([{opacity: 1}, {opacity: 0}], {duration: 10000})}});
      const backdrop = await visibleBackdrop();
      ref.close();
      const transitions = backdrop.getAnimations() as CSSTransition[];
      expect(transitions.length).toBe(2);
      transitions[0]!.finish();
      await transitions[0]!.finished;
      expect(backdrop.isConnected).toBe(true);
      transitions[1]!.finish();
      await transitions[1]!.finished;
      await expect.poll(() => backdrop.isConnected).toBe(false);
      expect(ref.containerInstance).not.toBeNull();
      ref.overlayRef.overlayElement.getAnimations()[0]!.finish();
      await ref.closedPromise;
    } finally {
      style.remove();
    }
  });

  it('进场前立即关闭不会等待根本未发生的 CSS transition', async () => {
    const ref = dialog.open(Content);
    const backdrop = document.querySelector('.vcdk-overlay-backdrop')!;
    ref.close();
    await ref.closedPromise;
    expect(backdrop.isConnected).toBe(false);
  });

  it('退场期间重开复用遮罩，旧动画结束不能移除新遮罩', async () => {
    const first = dialog.open(Content, {animation: {preset: 'fade', enterDuration: 0, leaveDuration: 10000}});
    const backdrop = await visibleBackdrop();
    first.close();
    const second = dialog.open(Content);
    first.overlayRef.overlayElement.getAnimations()[0]!.finish();
    await first.closedPromise;
    await renderFrame();
    await Promise.allSettled(backdrop.getAnimations().map(animation => {
      animation.finish();
      return animation.finished;
    }));
    expect(backdrop.isConnected).toBe(true);
    expect(document.querySelectorAll('.vcdk-overlay-backdrop')).toHaveLength(1);
    expect(backdrop.parentElement).toBe(second.overlayRef.hostElement);
    second.close();
  });
});
