import {afterEach, describe, expect, it, vi} from 'vitest';
import {defineComponent, h, nextTick} from 'vue';
import {Dialog} from './dialog';
import type {DialogAnimation, DialogAnimationContext, DialogAnimationPreset} from './dialog-animation';
import type {DialogRef} from './dialog-ref';

const Content = defineComponent({setup: () => () => h('button', '关闭')});
let dialog = new Dialog();

afterEach(() => {
  for (const ref of [...dialog.openDialogs]) ref.overlayRef.dispose();
  dialog = new Dialog();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** 提供真实完成信号的可控替身，避免用时长推测动画生命周期。 */
function completion() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

/** 为当前 pane 注入 WAAPI 替身，记录关键帧并显式控制 finished。 */
function mockAnimation(ref: DialogRef<any, any>) {
  const pending = completion();
  const animation = {finished: pending.promise, cancel: vi.fn()} as unknown as Animation;
  const animate = vi.fn((_frames: Keyframe[] | PropertyIndexedKeyframes | null, _options?: number | KeyframeAnimationOptions) => animation);
  ref.overlayRef.overlayElement.animate = animate;
  return {...pending, animation, animate};
}

/** 获取服务持有的唯一共享遮罩。 */
function backdrop(): HTMLElement {
  return document.querySelector('.vcdk-overlay-backdrop')!;
}

describe('Dialog 动画生命周期', () => {
  it('无配置保持同步关闭，窗口显式 false 可覆盖全局动画', () => {
    const ref = dialog.open(Content, {animation: false}, {defaults: {animation: 'scale'}});
    ref.close();
    expect(ref.containerInstance).toBeNull();
    expect(dialog.openDialogs).toHaveLength(0);
  });

  it.each<DialogAnimationPreset>(['fade', 'scale', 'slide-up', 'slide-down'])('%s 使用配置时长并等待真实 finished', async preset => {
    const ref = dialog.open(Content, {animation: {preset, enterDuration: 90, leaveDuration: 140, leaveEasing: 'linear'}});
    const enter = mockAnimation(ref);
    await nextTick();
    if (preset === 'slide-down') {
      expect((enter.animate.mock.calls[0]?.[0] as Keyframe[])[0]).toMatchObject({opacity: 0, transform: 'translateY(-24px)'});
    }
    expect(enter.animate.mock.calls[0]?.[1]).toMatchObject({duration: 90, easing: 'ease-out'});
    enter.resolve();
    await Promise.resolve();
    const leave = mockAnimation(ref);
    const results: unknown[] = [];
    ref.closed.subscribe(value => results.push(value));
    ref.close('首次');
    ref.close('重复');
    expect(leave.animate).toHaveBeenCalledTimes(1);
    if (preset === 'slide-down') {
      expect((leave.animate.mock.calls[0]?.[0] as Keyframe[])[1]).toMatchObject({opacity: 0, transform: 'translateY(-24px)'});
    }
    expect(leave.animate.mock.calls[0]?.[1]).toMatchObject({duration: 140, easing: 'linear'});
    expect(ref.containerInstance).not.toBeNull();
    expect(results).toEqual([]);
    leave.resolve();
    await expect(ref.closedPromise).resolves.toBe('首次');
    expect(results).toEqual(['首次']);
    expect(ref.overlayRef.overlayElement.isConnected).toBe(false);
  });

  it('进场中关闭从当前视觉状态退场，旧进场完成不影响关闭', async () => {
    const ref = dialog.open(Content, {animation: 'scale'});
    const enter = mockAnimation(ref);
    await nextTick();
    ref.overlayRef.overlayElement.style.opacity = '0.4';
    ref.overlayRef.overlayElement.style.transform = 'matrix(0.95, 0, 0, 0.95, 0, 0)';
    const leave = mockAnimation(ref);
    ref.close();
    expect(enter.animation.cancel).toHaveBeenCalledOnce();
    expect((leave.animate.mock.calls[0]?.[0] as Keyframe[])[0]).toMatchObject({opacity: '0.4', transform: 'matrix(0.95, 0, 0, 0.95, 0, 0)'});
    enter.resolve();
    await Promise.resolve();
    expect(ref.containerInstance).not.toBeNull();
    leave.resolve();
    await ref.closedPromise;
  });

  it('关闭谓词拒绝不启动退场，遮罩点击每次仅执行一次谓词', async () => {
    const leave = vi.fn();
    const predicate = vi.fn(() => false);
    const ref = dialog.open(Content, {animation: {leave}, closePredicate: predicate});
    backdrop().click();
    expect(predicate).toHaveBeenCalledTimes(1);
    expect(leave).not.toHaveBeenCalled();
    predicate.mockReturnValue(true);
    backdrop().click();
    await ref.closedPromise;
    expect(predicate).toHaveBeenCalledTimes(2);
    expect(leave).toHaveBeenCalledOnce();
  });

  it('自定义 Promise 完成前保留内容，外部销毁中止信号并忽略旧完成', async () => {
    const pending = completion();
    let context!: DialogAnimationContext;
    const ref = dialog.open(Content, {animation: {leave: value => { context = value; return pending.promise; }}});
    ref.close('结果');
    expect(context.element).toBe(ref.overlayRef.overlayElement);
    expect(context.signal.aborted).toBe(false);
    ref.overlayRef.dispose();
    await expect(ref.closedPromise).resolves.toBe('结果');
    expect(context.signal.aborted).toBe(true);
    pending.resolve();
    await Promise.resolve();
    expect(dialog.openDialogs).toHaveLength(0);
  });

  it.each(['抛错', '拒绝'])('钩子%s 后报告错误并完成清理', async kind => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ref = dialog.open(Content, {animation: {leave: () => {
      if (kind === '抛错') throw new Error('测试错误');
      return Promise.reject(new Error('测试错误'));
    }}});
    ref.close();
    await ref.closedPromise;
    expect(report).toHaveBeenCalledOnce();
    expect(dialog.openDialogs).toHaveLength(0);
  });

  it('WAAPI 外部取消作为正常终止，不悬挂关闭', async () => {
    const ref = dialog.open(Content, {animation: 'fade'});
    const leave = mockAnimation(ref);
    ref.close();
    leave.reject(new DOMException('已取消', 'AbortError'));
    await ref.closedPromise;
    expect(ref.containerInstance).toBeNull();
  });

  it.each(['禁用', '减少动态效果'])('%s 时跳过全部自定义钩子及遮罩动画', async mode => {
    if (mode === '减少动态效果') vi.stubGlobal('matchMedia', () => ({matches: true}));
    const hook = vi.fn();
    const ref = dialog.open(Content, {disableAnimations: mode === '禁用', animation: {enter: hook, leave: hook}});
    expect(backdrop().classList.contains('vcdk-overlay-backdrop-noop-animation')).toBe(true);
    await nextTick();
    ref.close();
    expect(ref.containerInstance).toBeNull();
    expect(hook).not.toHaveBeenCalled();
    expect(backdrop()).toBeNull();
  });

  it('无 WAAPI、零时长及缺省钩子同步完成关闭', () => {
    for (const animation of ['fade', {preset: 'scale', leaveDuration: 0}, {}] as DialogAnimation[]) {
      const ref = dialog.open(Content, {animation});
      ref.close();
      expect(ref.containerInstance).toBeNull();
    }
  });

  it('外部 detach 不受关闭谓词阻止且不启动不可见动画', async () => {
    const leave = vi.fn();
    const ref = dialog.open(Content, {closePredicate: () => false, animation: {leave}});
    ref.overlayRef.detach();
    await ref.closedPromise;
    expect(leave).not.toHaveBeenCalled();
    expect(ref.containerInstance).toBeNull();
  });

  it('最后一个窗口与遮罩同步开始退场，二者可独立完成', async () => {
    const pending = completion();
    const ref = dialog.open(Content, {animation: {leave: () => {
      expect(backdrop().classList.contains('vcdk-overlay-backdrop-showing')).toBe(false);
      return pending.promise;
    }}});
    const element = backdrop();
    element.style.transitionDuration = '500ms';
    ref.close();
    expect(ref.containerInstance).not.toBeNull();
    element.dispatchEvent(new Event('transitionend'));
    expect(backdrop()).toBeNull();
    expect(ref.containerInstance).not.toBeNull();
    pending.resolve();
    await ref.closedPromise;
  });

  it('顶层退场期间保持遮罩层级，销毁后再回落', async () => {
    dialog.open(Content);
    const pending = completion();
    const ref = dialog.open(Content, {animation: {leave: () => pending.promise}});
    const element = backdrop();
    ref.close();
    expect(element.style.zIndex).toBe('1003');
    pending.resolve();
    await ref.closedPromise;
    expect(element.style.zIndex).toBe('1001');
  });

  it('closeAll 部分拒绝时保留遮罩，最后一个获准时同步退出，重开取消旧退场', async () => {
    let allowed = false;
    const first = dialog.open(Content, {closePredicate: () => allowed});
    const pending = completion();
    const second = dialog.open(Content, {animation: {leave: () => pending.promise}});
    const element = backdrop();
    element.style.transitionDuration = '500ms';
    dialog.closeAll();
    expect(first.containerInstance).not.toBeNull();
    expect(second.containerInstance).not.toBeNull();
    expect(element.style.zIndex).toBe('1003');
    allowed = true;
    first.close();
    expect(element.classList.contains('vcdk-overlay-backdrop-showing')).toBe(false);
    const third = dialog.open(Content);
    expect(backdrop()).toBe(element);
    element.dispatchEvent(new Event('transitionend'));
    pending.resolve();
    await second.closedPromise;
    expect(backdrop()).toBe(element);
    third.close();
  });
});
