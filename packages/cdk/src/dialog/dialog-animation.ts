import type {DialogConfig} from './dialog-config';

/** 内置窗口动画名称；省略 animation 时不播放窗口动画。 */
export type DialogAnimationPreset = 'fade' | 'scale' | 'slide-up' | 'slide-down';

/** 自定义动画上下文；动画应作用于 element，避免遗漏面板的背景与阴影。 */
export interface DialogAnimationContext {
  /** 已挂载的 overlay pane，坐标与尺寸可直接测量。 */
  element: HTMLElement;
  /** 本次打开时合并后的配置；动画钩子不得修改关闭谓词或关闭方法。 */
  config: DialogConfig;
  /** 动画被替换、关闭或销毁时中止；自定义实现必须据此释放监听与资源。 */
  signal: AbortSignal;
}

/**
 * 自定义动画钩子。返回 Animation 时由库等待 finished 并负责 cancel；返回 Promise 时
 * 必须由真实结束/取消事件或动画库完成回调结算，不得使用定时器模拟结束。
 * 返回 void 表示同步完成。抛错或拒绝会报告错误并继续生命周期清理。
 * 每次调用仅负责一个阶段；signal 中止后旧阶段的完成信号会被忽略。
 */
export type DialogAnimationHook = (context: DialogAnimationContext) => Animation | Promise<void> | void;

/** 内置动画配置；时长单位为毫秒，必须为有限非负数。 */
export interface DialogPresetAnimation {
  /** 内置效果。 */
  preset: DialogAnimationPreset;
  /** 进场时长，默认 200；0 表示同步完成。 */
  enterDuration?: number;
  /** 退场时长，默认 200；0 表示同步完成。 */
  leaveDuration?: number;
  /** 进场 CSS 缓动函数，默认 ease-out。 */
  enterEasing?: string;
  /** 退场 CSS 缓动函数，默认 ease-out。 */
  leaveEasing?: string;
}

/** 自定义进退场钩子；省略某阶段表示该阶段同步完成。 */
export interface DialogCustomAnimation {
  /** 内容挂载且定位就绪后执行。 */
  enter?: DialogAnimationHook;
  /** 首次关闭获准后执行；完成前保留内容、焦点陷阱和 overlay。 */
  leave?: DialogAnimationHook;
}

/** 窗口动画配置；false 可覆盖全局默认动画。 */
export type DialogAnimation = DialogAnimationPreset | DialogPresetAnimation | DialogCustomAnimation | false;

/** 配置禁用或系统要求减少动态效果时跳过窗口和共享遮罩动画。 */
export function dialogAnimationsDisabled(config: DialogConfig, element: HTMLElement): boolean {
  return config.disableAnimations === true ||
    element.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * 单个窗口的动画执行器：同步阶段保持同步，异步阶段仅依赖真实完成信号。
 * 阶段替换先快照当前视觉值，再取消旧动画；版本号阻止旧 Promise 影响新阶段。
 */
export class DialogAnimationRunner {
  private _version = 0;
  private _controller?: AbortController;
  private _animation?: Animation;

  constructor(private readonly _element: HTMLElement, private readonly _config: DialogConfig) {}

  /** 播放一个阶段；完成或失败时调用 done，取消旧阶段不会调用旧 done。 */
  run(phase: 'enter' | 'leave', done: () => void): void {
    const wasAnimating = !!this._controller;
    const style = wasAnimating ? this._element.ownerDocument.defaultView?.getComputedStyle(this._element) : null;
    const current = style ? {opacity: style.opacity, transform: style.transform} : undefined;
    this.cancel();
    const version = this._version;
    const config = this._config.animation;
    if (!config || dialogAnimationsDisabled(this._config, this._element) || !this._element.isConnected) {
      done();
      return;
    }
    const controller = this._controller = new AbortController();
    try {
      let result: Animation | Promise<void> | void;
      if (typeof config === 'string' || 'preset' in config) {
        const preset = typeof config === 'string' ? {preset: config} : config;
        const duration = phase === 'enter' ? preset.enterDuration ?? 200 : preset.leaveDuration ?? 200;
        if (!Number.isFinite(duration) || duration < 0) throw new RangeError('Dialog 动画时长必须为有限非负数。');
        if (!duration || typeof this._element.animate !== 'function') {
          this.cancel();
          done();
          return;
        }
        const hidden: Keyframe = {opacity: 0};
        if (preset.preset === 'scale') hidden.transform = 'scale(0.9)';
        if (preset.preset === 'slide-up') hidden.transform = 'translateY(24px)';
        if (preset.preset === 'slide-down') hidden.transform = 'translateY(-24px)';
        const visible: Keyframe = {opacity: 1, transform: 'none'};
        const frames = phase === 'enter' ? [hidden, visible] : [current ?? visible, hidden];
        result = this._element.animate(frames, {
          duration,
          easing: (phase === 'enter' ? preset.enterEasing : preset.leaveEasing) ?? 'ease-out',
          fill: 'both',
        });
      } else {
        result = config[phase]?.({element: this._element, config: this._config, signal: controller.signal});
      }
      // 钩子允许同步触发 close 或外部销毁，此时不得重新接管旧阶段资源。
      if (version !== this._version) {
        if (result && 'finished' in result) {
          void result.finished.catch(() => undefined);
          result.cancel();
        } else if (result) void result.catch(() => undefined);
        return;
      }
      const finish = () => {
        if (version !== this._version) return;
        this.cancel();
        done();
      };
      if (!result) {
        finish();
        return;
      }
      const isAnimation = 'finished' in result;
      let finished: Promise<unknown>;
      if ('finished' in result) {
        this._animation = result;
        finished = result.finished;
      } else finished = result;
      void finished.then(finish, error => {
        if (version !== this._version) return;
        // 外部取消 WAAPI 动画属于正常终止；业务 Promise 拒绝仍需报告。
        if (!isAnimation || error?.name !== 'AbortError') console.error('Dialog 动画执行失败：', error);
        finish();
      });
    } catch (error) {
      if (version !== this._version) return;
      console.error('Dialog 动画执行失败：', error);
      this.cancel();
      done();
    }
  }

  /** 中止当前阶段并释放库持有的动画；幂等，不结算被取消阶段。 */
  cancel(): void {
    ++this._version;
    const controller = this._controller;
    const animation = this._animation;
    this._controller = undefined;
    this._animation = undefined;
    controller?.abort();
    animation?.cancel();
  }
}
