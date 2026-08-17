import {
  getCurrentInstance,
  onScopeDispose,
  onUpdated,
  readonly,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';
import {injectTextFieldStyles} from './style-inject';

/** 自动伸缩 textarea 的配置。行数小于 1 时视为未设置对应限制。 */
export interface TextareaAutosizeOptions {
  /** 是否启用自动伸缩，默认 true。 */
  enabled?: MaybeRefOrGetter<boolean>;
  /** 最小可见行数。 */
  minRows?: MaybeRefOrGetter<number | undefined>;
  /** 最大可见行数。 */
  maxRows?: MaybeRefOrGetter<number | undefined>;
  /** 响应式 placeholder；省略时直接读取元素属性。 */
  placeholder?: MaybeRefOrGetter<string | undefined>;
}

/** useTextareaAutosize 返回的响应式状态和控制方法。 */
export interface UseTextareaAutosizeReturn {
  readonly controller: {readonly value: TextareaAutosize | null};
  readonly enabled: {readonly value: boolean};
  resizeToFitContent(force?: boolean): void;
  reset(): void;
  destroy(): void;
}

/**
 * textarea 自动伸缩控制器，对应 Angular CDK 的 CdkTextareaAutosize。
 *
 * 控制器会写入宿主的 rows、class、height、minHeight 与 maxHeight，并监听 input、
 * composition、focus、blur 和 window.resize。中文、日文等输入法的组合输入期间会暂停
 * 布局测量，在 compositionend 后统一重算，避免高度变化干扰候选框与光标。调用方不再
 * 使用时必须执行 destroy；Composition API 与指令入口会自动完成清理。
 */
export class TextareaAutosize {
  private readonly _textarea: HTMLTextAreaElement;
  private readonly _window: Window;
  private readonly _isFirefox: boolean;
  private readonly _initialRows: string | null;
  private readonly _initialHeight: string;
  private readonly _initialMinHeight: string;
  private readonly _initialMaxHeight: string;
  private _enabled = true;
  private _minRows?: number;
  private _maxRows?: number;
  private _cachedLineHeight?: number;
  private _cachedPlaceholderHeight?: number;
  private _previousValue?: string;
  private _previousPlaceholder?: string;
  private _previousMinRows = -1;
  private _hasFocus = false;
  private _isComposing = false;
  private _destroyed = false;
  private _resizeFrame: number | null = null;
  private _caretFrame: number | null = null;

  /** 创建控制器并立即安装样式与监听器；元素必须已经连接到浏览器文档。 */
  constructor(textarea: HTMLTextAreaElement) {
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new TypeError('TextareaAutosize 只能用于 HTMLTextAreaElement。');
    }
    this._textarea = textarea;
    this._window = textarea.ownerDocument.defaultView ?? window;
    this._isFirefox = /firefox/i.test(this._window.navigator.userAgent);
    this._initialRows = textarea.getAttribute('rows');
    this._initialHeight = textarea.style.height;
    this._initialMinHeight = textarea.style.minHeight;
    this._initialMaxHeight = textarea.style.maxHeight;
    injectTextFieldStyles();
    textarea.classList.add('cdk-textarea-autosize');
    textarea.rows = 1;
    textarea.addEventListener('input', this._handleInput);
    textarea.addEventListener('compositionstart', this._handleCompositionStart);
    textarea.addEventListener('compositionend', this._handleCompositionEnd);
    textarea.addEventListener('focus', this._handleFocus);
    textarea.addEventListener('blur', this._handleBlur);
    this._window.addEventListener('resize', this._handleWindowResize, {passive: true});
    this.resizeToFitContent(true);
  }

  /** 当前是否启用；关闭时恢复创建控制器之前的行内高度。 */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    const next = Boolean(value);
    if (next === this._enabled) return;
    this._enabled = next;
    if (next) this.resizeToFitContent(true);
    else this.reset();
  }

  /** 当前最小行数；undefined 表示不限制。 */
  get minRows(): number | undefined {
    return this._minRows;
  }

  set minRows(value: number | undefined) {
    this._minRows = normalizeRows(value);
    this._setMinHeight();
    this.resizeToFitContent(true);
  }

  /** 当前最大行数；undefined 表示不限制。 */
  get maxRows(): number | undefined {
    return this._maxRows;
  }

  set maxRows(value: number | undefined) {
    this._maxRows = normalizeRows(value);
    this._setMaxHeight();
    this.resizeToFitContent(true);
  }

  /** 更新 placeholder，并使下一次测量重新计算占位文本高度。 */
  setPlaceholder(value: string | undefined): void {
    this._cachedPlaceholderHeight = undefined;
    if (value == null || value === '') this._textarea.removeAttribute('placeholder');
    else this._textarea.placeholder = value;
    this.resizeToFitContent(true);
  }

  /**
   * 将高度调整到完整容纳内容。
   * @param force 是否忽略内容与最小行数缓存强制触发布局测量，默认 false。
   */
  resizeToFitContent(force = false): void {
    if (!this._enabled || this._destroyed || this._isComposing || !this._textarea.isConnected) return;
    if (this._previousPlaceholder !== this._textarea.placeholder) {
      this._cachedPlaceholderHeight = undefined;
      this._previousPlaceholder = this._textarea.placeholder;
    }
    this._cacheLineHeight();
    this._cachePlaceholderHeight();
    if (!this._cachedLineHeight) return;
    const value = this._textarea.value;
    if (!force && value === this._previousValue && this._previousMinRows === (this._minRows ?? -1)) {
      return;
    }
    const contentHeight = Math.max(this._measureScrollHeight(), this._cachedPlaceholderHeight ?? 0);
    // 测量类临时使用 content-box，结果代表内容区高度。若宿主最终采用 border-box，
    // style.height 还必须包含 padding 与 border，否则单行文字最容易被上下裁切。
    const height = contentHeight + this._getBorderBoxAdjustment();
    this._textarea.style.height = `${height}px`;
    this._previousValue = value;
    this._previousMinRows = this._minRows ?? -1;
    this._scheduleCaretRestore();
  }

  /** 恢复创建控制器之前的高度；min/max 高度约束保持当前配置。 */
  reset(): void {
    if (!this._destroyed) this._textarea.style.height = this._initialHeight;
  }

  /** 移除全部监听器、取消待执行任务并恢复宿主初始行内样式；重复调用安全。 */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._textarea.removeEventListener('input', this._handleInput);
    this._textarea.removeEventListener('compositionstart', this._handleCompositionStart);
    this._textarea.removeEventListener('compositionend', this._handleCompositionEnd);
    this._textarea.removeEventListener('focus', this._handleFocus);
    this._textarea.removeEventListener('blur', this._handleBlur);
    this._window.removeEventListener('resize', this._handleWindowResize);
    if (this._resizeFrame != null) this._window.cancelAnimationFrame(this._resizeFrame);
    if (this._caretFrame != null) this._window.cancelAnimationFrame(this._caretFrame);
    this._textarea.classList.remove('cdk-textarea-autosize');
    this._textarea.style.height = this._initialHeight;
    this._textarea.style.minHeight = this._initialMinHeight;
    this._textarea.style.maxHeight = this._initialMaxHeight;
    if (this._initialRows == null) this._textarea.removeAttribute('rows');
    else this._textarea.setAttribute('rows', this._initialRows);
  }

  private _cacheLineHeight(): void {
    if (this._cachedLineHeight) return;
    const clone = this._textarea.cloneNode(false) as HTMLTextAreaElement;
    clone.rows = 1;
    Object.assign(clone.style, {
      position: 'absolute', visibility: 'hidden', border: 'none', padding: '0', height: '',
      minHeight: '', maxHeight: '', top: 'auto', bottom: 'auto', left: 'auto', right: 'auto',
      overflow: 'hidden',
    });
    this._textarea.parentNode?.appendChild(clone);
    this._cachedLineHeight = clone.clientHeight || undefined;
    clone.remove();
    this._setMinHeight();
    this._setMaxHeight();
  }

  private _cachePlaceholderHeight(): void {
    if (this._cachedPlaceholderHeight != null) return;
    if (!this._textarea.placeholder) {
      this._cachedPlaceholderHeight = 0;
      return;
    }
    const value = this._textarea.value;
    this._textarea.value = this._textarea.placeholder;
    this._cachedPlaceholderHeight = this._measureScrollHeight();
    this._textarea.value = value;
  }

  private _measureScrollHeight(): number {
    const previousMargin = this._textarea.style.marginBottom;
    const previousMinHeight = this._textarea.style.minHeight;
    const previousMaxHeight = this._textarea.style.maxHeight;
    if (this._hasFocus) this._textarea.style.marginBottom = `${this._textarea.clientHeight}px`;
    // minRows/maxRows 只应约束最终布局，不能反向污染内容高度测量；否则 minRows=2
    // 会先把 scrollHeight 撑到两行，再叠加一次 border-box 补偿，视觉上接近三行。
    this._textarea.style.minHeight = '0';
    this._textarea.style.maxHeight = 'none';
    const measuringClass = this._isFirefox
      ? 'cdk-textarea-autosize-measuring-firefox'
      : 'cdk-textarea-autosize-measuring';
    this._textarea.classList.add(measuringClass);
    const height = Math.max(0, this._textarea.scrollHeight - 4);
    this._textarea.classList.remove(measuringClass);
    this._textarea.style.minHeight = previousMinHeight;
    this._textarea.style.maxHeight = previousMaxHeight;
    if (this._hasFocus) this._textarea.style.marginBottom = previousMargin;
    return height;
  }

  private _setMinHeight(): void {
    this._textarea.style.minHeight = this._minRows && this._cachedLineHeight
      ? `${this._minRows * this._cachedLineHeight + this._getBorderBoxAdjustment()}px`
      : this._initialMinHeight;
  }

  private _setMaxHeight(): void {
    this._textarea.style.maxHeight = this._maxRows && this._cachedLineHeight
      ? `${this._maxRows * this._cachedLineHeight + this._getBorderBoxAdjustment()}px`
      : this._initialMaxHeight;
  }

  /**
   * 返回 border-box 相对内容区需要补回的垂直尺寸。
   * 每次测量时读取计算样式，确保响应主题、媒体查询或调用方动态样式变化。
   */
  private _getBorderBoxAdjustment(): number {
    const styles = this._window.getComputedStyle(this._textarea);
    if (styles.boxSizing !== 'border-box') return 0;
    return cssPixels(styles.paddingTop) + cssPixels(styles.paddingBottom) +
      cssPixels(styles.borderTopWidth) + cssPixels(styles.borderBottomWidth);
  }

  private readonly _handleInput = (): void => this.resizeToFitContent();
  private readonly _handleCompositionStart = (): void => {
    this._isComposing = true;
  };
  private readonly _handleCompositionEnd = (): void => {
    this._isComposing = false;
    this.resizeToFitContent(true);
  };
  private readonly _handleFocus = (): void => { this._hasFocus = true; };
  private readonly _handleBlur = (): void => {
    this._hasFocus = false;
    // 部分移动端浏览器在输入法被 blur 中断时不派发 compositionend；blur 作为兜底提交。
    if (this._isComposing) {
      this._isComposing = false;
      this.resizeToFitContent(true);
    }
  };
  private readonly _handleWindowResize = (): void => {
    if (this._resizeFrame != null) return;
    this._resizeFrame = this._window.requestAnimationFrame(() => {
      this._resizeFrame = null;
      this._cachedLineHeight = this._cachedPlaceholderHeight = undefined;
      this.resizeToFitContent(true);
    });
  };

  private _scheduleCaretRestore(): void {
    if (!this._hasFocus || this._caretFrame != null) return;
    this._caretFrame = this._window.requestAnimationFrame(() => {
      this._caretFrame = null;
      if (!this._destroyed && this._hasFocus && this._textarea.isConnected) {
        this._textarea.setSelectionRange(this._textarea.selectionStart, this._textarea.selectionEnd);
      }
    });
  }
}

function normalizeRows(value: number | undefined): number | undefined {
  const rows = Number(value);
  return Number.isFinite(rows) && rows >= 1 ? rows : undefined;
}

/** 将计算样式中的像素值转为有限数值；非像素或空值按 0 处理。 */
function cssPixels(value: string): number {
  const result = Number.parseFloat(value);
  return Number.isFinite(result) ? result : 0;
}

/**
 * 在 Vue effect scope 中管理 textarea 自动伸缩。
 * target 可在挂载后才获得元素；元素变化时旧控制器会销毁。作用域外调用时必须手动 destroy。
 */
export function useTextareaAutosize(
  target: Ref<HTMLTextAreaElement | null | undefined>,
  options: TextareaAutosizeOptions = {},
): UseTextareaAutosizeReturn {
  const controller = shallowRef<TextareaAutosize | null>(null);
  const enabled = ref(Boolean(toValue(options.enabled ?? true)));
  let stopped = false;
  const stopWatch = watch(
    [target, () => toValue(options.enabled ?? true), () => toValue(options.minRows),
      () => toValue(options.maxRows), () => toValue(options.placeholder)],
    ([element, nextEnabled, minRows, maxRows, placeholder], previous) => {
      if (stopped) return;
      if (element !== previous?.[0]) {
        controller.value?.destroy();
        controller.value = element ? new TextareaAutosize(element) : null;
      }
      enabled.value = Boolean(nextEnabled);
      const instance = controller.value;
      if (!instance) return;
      instance.minRows = minRows as number | undefined;
      instance.maxRows = maxRows as number | undefined;
      if (options.placeholder !== undefined) instance.setPlaceholder(placeholder as string | undefined);
      instance.enabled = enabled.value;
      instance.resizeToFitContent();
    },
    {immediate: true, flush: 'post'},
  );
  const destroy = (): void => {
    if (stopped) return;
    stopped = true;
    stopWatch();
    controller.value?.destroy();
    controller.value = null;
  };
  onScopeDispose(destroy, true);
  // Vue 通过 v-model 或属性绑定程序化更新 DOM value/placeholder 时不一定触发 input；
  // 在所属组件完成 DOM patch 后补一次缓存式检查，内容未变化时不会产生布局测量。
  if (getCurrentInstance()) onUpdated(() => controller.value?.resizeToFitContent());
  return {
    controller,
    enabled: readonly(enabled),
    resizeToFitContent: force => controller.value?.resizeToFitContent(force),
    reset: () => controller.value?.reset(),
    destroy,
  };
}
