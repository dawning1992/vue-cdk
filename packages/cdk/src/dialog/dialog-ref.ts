import {nextTick} from 'vue';
import {DialogAnimationRunner} from './dialog-animation';
import {Emitter} from '../emitter';
import {ESCAPE} from '../a11y/keycodes';
import {hasModifierKey} from '../platform';
import type {FocusOrigin} from '../a11y/focus-monitor/focus-monitor';
import type {OverlayRef} from '../overlay/overlay-ref';
import type {DialogConfig, DialogContainerInstance} from './dialog-config';

/** 关闭对话框时的附加选项。 */
export interface DialogCloseOptions {
  /** 触发关闭的交互来源，用于关闭后恢复焦点时的样式归因。 */
  focusOrigin?: FocusOrigin;
}

/**
 * 已打开对话框的引用，对应 Angular CDK 的 DialogRef。
 *
 * 生命周期约定：
 * - `close()` 幂等：首次关闭获准后再次调用无效果；退场完成前保留容器实例；
 * - `closedPromise` 与 `closed` 携带同一个关闭结果，且只在成功关闭时结算；
 * - 事件流（closed / backdropClick / keydownEvents / outsidePointerEvents）
 *   在关闭时 complete，关闭后不应再订阅；
 * - 关闭后 `componentInstance` 与 `containerInstance` 被置空，避免长引用。
 */
export class DialogRef<R = unknown, C = unknown> {
  /** 打开到对话框中的内容组件实例；TemplateRef / 渲染函数 / VNode 内容时为 null。 */
  componentInstance: C | null = null;

  /** 渲染对话框内容的容器实例。 */
  containerInstance: DialogContainerInstance | null = null;

  /** 是否允许用户关闭对话框；可在运行时更新。 */
  disableClose: boolean | undefined;

  /** 对话框关闭事件流，携带关闭结果。 */
  readonly closed: Emitter<R | undefined> = new Emitter<R | undefined>();

  /** 对话框成功关闭后解析的 Promise，解析值与 closed 事件流携带的结果一致。 */
  readonly closedPromise: Promise<R | undefined>;

  /** 遮罩点击事件流。 */
  readonly backdropClick: Emitter<MouseEvent>;

  /** 对话框内键盘事件流。 */
  readonly keydownEvents: Emitter<KeyboardEvent>;

  /** 对话框外的指针事件流。 */
  readonly outsidePointerEvents: Emitter<MouseEvent>;

  /** 对话框唯一 id。 */
  readonly id: string;

  /** overlay 外部 detach 的订阅；close() 会先行退订，避免 dispose 重入触发二次关闭。 */
  private _detachSubscription: (() => void) | undefined;

  /** 仅由首次成功的 close() 调用，用于结算 closedPromise。 */
  private _resolveClosedPromise!: (result: R | undefined) => void;

  /** 内部关闭通知，供共享遮罩在窗口退场开始时同步更新。 */
  readonly _closing = new Emitter<void>();
  /** 内部销毁前通知，供共享遮罩从即将移除的 Popover host 迁出。 */
  readonly _beforeDisposed = new Emitter<void>();
  private _state: 'open' | 'closing' | 'closed' = 'open';
  private _closeResult: R | undefined;
  private readonly _animation: DialogAnimationRunner;

  /** 是否已获准关闭；关闭中的窗口仍留在 openDialogs，直到真实退场完成。 */
  get _isClosing(): boolean { return this._state !== 'open'; }

  /** 内容与定位就绪后播放进场；立即关闭时不会再启动旧进场。 */
  _startEnter(): void {
    void nextTick(() => {
      if (this._state === 'open') this._animation.run('enter', () => undefined);
    });
  }

  constructor(
    readonly overlayRef: OverlayRef,
    readonly config: DialogConfig<any, DialogRef<R, C>>,
  ) {
    this._animation = new DialogAnimationRunner(overlayRef.overlayElement, config);
    this.closedPromise = new Promise(resolve => {
      this._resolveClosedPromise = resolve;
    });
    this.disableClose = config.disableClose;
    this.backdropClick = overlayRef.backdropClick();
    this.keydownEvents = overlayRef.keydownEvents();
    this.outsidePointerEvents = overlayRef.outsidePointerEvents();
    this.id = config.id!;

    // ESC 关闭：未禁用且未按住修饰键时拦截默认行为并关闭。
    this.keydownEvents.subscribe(event => {
      if (event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event)) {
        event.preventDefault();
        this.close(undefined, {focusOrigin: 'keyboard'});
      }
    });

    // 遮罩点击关闭：被 disableClose 或 closePredicate 阻止时重捕获焦点到对话框内。
    this.backdropClick.subscribe(() => {
      if (!this.disableClose) {
        this.close(undefined, {focusOrigin: 'mouse'});
      } else {
        this.containerInstance?._recaptureFocus?.();
      }
    });

    // 外部 detach（滚动策略、导航等导致）默认同步关闭；内部销毁前先退订以避免重入。
    this._detachSubscription = overlayRef.detachments().subscribe(() => {
      if (this.config.closeOnOverlayDetachments !== false) {
        // 外部已经卸载内容，关闭谓词无法阻止物理销毁，也无需播放不可见动画。
        if (this._state === 'open') {
          this._state = 'closing';
          this._closing.next();
        }
        this._finishClose(false);
      }
    });
  }

  /**
   * 关闭对话框并可携带结果。
   * 有退场动画时保留内容至真实完成；关闭谓词只在首次获准前执行，后续调用忽略。
   * @param result 返回给打开方的结果，经 closed 事件流派发。
   * @param options 附加选项，目前用于指定焦点恢复来源。
   */
  close(result?: R, options?: DialogCloseOptions): void {
    if (this._state !== 'open' || !this.containerInstance) return;
    if (!this._canClose(result)) {
      this.containerInstance?._recaptureFocus?.();
      return;
    }
    this._state = 'closing';
    this._closeResult = result;
    this.containerInstance._closeInteractionType = options?.focusOrigin || 'program';
    // 通知先于窗口动画，保证最后一个遮罩与窗口在同一次关闭流程中退场。
    this._closing.next();
    if (this._state === 'closing') this._animation.run('leave', () => this._finishClose(true));
  }

  /**
   * @internal 模板来源失效时立即销毁，跳过关闭谓词与动画；重复调用无效果。
   * 来源失效后不能继续渲染；若正在退场，保留已接受的关闭结果并取消动画。
   */
  _closeOnTemplateDestroyed(): void {
    if (this._state === 'closed') return;
    if (this._state === 'open') {
      this._state = 'closing';
      this._closing.next();
    }
    this._finishClose(true);
  }

  /** 退场完成或外部已卸载时收敛生命周期，先标记和退订以防 dispose 重入。 */
  private _finishClose(dispose: boolean): void {
    if (this._state === 'closed') return;
    this._state = 'closed';
    this._animation.cancel();
    this._detachSubscription?.();
    this._detachSubscription = undefined;
    this._beforeDisposed.next();
    this._beforeDisposed.complete();
    if (dispose) this.overlayRef.dispose();
    const result = this._closeResult;
    this.closed.next(result);
    this.closed.complete();
    this._closing.complete();
    this._resolveClosedPromise(result);
    this.componentInstance = null;
    this.containerInstance = null;
  }

  /** 依据当前定位策略重新计算位置。 */
  updatePosition(): this {
    this.overlayRef.updatePosition();
    return this;
  }

  /** 更新对话框尺寸；缺省参数表示清空对应维度（回退到配置默认）。 */
  updateSize(width: string | number = '', height: string | number = ''): this {
    this.overlayRef.updateSize({width, height});
    return this;
  }

  /** 向 overlay 面板追加一个或多个 CSS 类。 */
  addPanelClass(classes: string | string[]): this {
    this.overlayRef.addPanelClass(classes);
    return this;
  }

  /** 从 overlay 面板移除一个或多个 CSS 类。 */
  removePanelClass(classes: string | string[]): this {
    this.overlayRef.removePanelClass(classes);
    return this;
  }

  /** 是否允许关闭：容器仍存在且 closePredicate 未阻止。 */
  private _canClose(result?: R): boolean {
    const config = this.config as DialogConfig<unknown, unknown>;
    return (
      !!this.containerInstance &&
      (!config.closePredicate || config.closePredicate(result, config, this.componentInstance))
    );
  }
}
