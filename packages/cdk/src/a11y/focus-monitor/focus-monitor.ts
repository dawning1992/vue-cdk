/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * 本地适配：Observable → Emitter；ElementRef → 元素或 ref；NgZone 移除；
 * FOCUS_MONITOR_DEFAULT_OPTIONS token → 构造参数；DOM 类名使用 vcdk-* 前缀。
 */

/**
 * 焦点来源监视器，移植自 Angular CDK 的 FocusMonitor。
 *
 * 通过 document 级捕获监听把焦点事件归因到 mouse / keyboard / touch /
 * program 四种来源，并给被监视元素添加对应的 `vcdk-*` 焦点类：
 * `vcdk-focused`、`vcdk-mouse-focused`、`vcdk-keyboard-focused`、
 * `vcdk-touch-focused`、`vcdk-program-focused`。
 *
 * 与 Angular 版的差异：事件流使用 Emitter；元素参数接受 HTMLElement 或 ref；
 * NgZone 相关包装移除（Vue 无 zone 概念）。
 */

import {type Ref} from 'vue';
import {Emitter} from '../../emitter';
import {
  getEventTargetPierceShadowDom,
  getShadowRoot,
  isBrowser,
  normalizePassiveListenerOptions,
} from '../../platform';
import {coerceElement} from '../../coercion';
import {
  inputModalityDetector as inputModalityDetectorSingleton,
  TOUCH_BUFFER_MS,
  type InputModalityDetector,
} from './input-modality-detector';

/** 焦点事件的来源。 */
export type FocusOrigin = 'touch' | 'mouse' | 'keyboard' | 'program' | null;

/** 原生 focus 方法支持的可选行为。 */
export interface FocusOptions {
  /** 聚焦时是否阻止浏览器滚动到该元素。 */
  preventScroll?: boolean;
}

/** 焦点来源的归因模式。 */
export enum FocusMonitorDetectionMode {
  /**
   * 前一个 tick（触摸为 TOUCH_BUFFER_MS 内）发生的 mousedown / keydown /
   * touchstart 用于归因当前焦点事件。默认模式。
   */
  IMMEDIATE,
  /** 焦点事件始终归因到最近一次对应交互事件，无论间隔多久。 */
  EVENTUAL,
}

/** FocusMonitor 服务级配置。 */
export interface FocusMonitorOptions {
  detectionMode?: FocusMonitorDetectionMode;
}

/** 默认服务级配置。 */
export const FOCUS_MONITOR_DEFAULT_OPTIONS: FocusMonitorOptions = {
  detectionMode: FocusMonitorDetectionMode.IMMEDIATE,
};

type MonitoredElementInfo = {
  checkChildren: boolean;
  readonly subject: Emitter<FocusOrigin>;
  rootNode: HTMLElement | ShadowRoot | Document;
};

/** 捕获阶段 + passive 的监听选项，保证即使其他代码阻止传播也能检测到。 */
const captureEventListenerOptions = normalizePassiveListenerOptions({
  passive: true,
  capture: true,
});

/** 被监视元素参数：元素或其 ref。 */
export type MonitorTarget<T extends HTMLElement = HTMLElement> = T | Ref<T | null | undefined>;

export class FocusMonitor {
  private readonly _inputModalityDetector: InputModalityDetector;

  /** 下一次焦点事件应归因的来源。 */
  private _origin: FocusOrigin = null;

  /** 最近一次被追踪的焦点来源。 */
  private _lastFocusOrigin: FocusOrigin = null;

  /** 窗口是否刚刚重新获得焦点。 */
  private _windowFocused = false;

  private _windowFocusTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private _originTimeoutId: ReturnType<typeof setTimeout> | undefined;

  /** 来源是否由触摸交互确定（触摸归因需要额外判断）。 */
  private _originFromTouchInteraction = false;

  /** 被监视元素到其信息映射。 */
  private _elementInfo = new Map<HTMLElement, MonitoredElementInfo>();

  /** 当前被监视的元素数量。 */
  private _monitoredElementCount = 0;

  /**
   * 各根节点（document / ShadowRoot）上 focus/blur 监听的绑定计数。
   * Shadow DOM 内的焦点移动不会冒泡到 document，因此需要按根节点分别绑定。
   */
  private _rootNodeFocusListenerCount = new Map<HTMLElement | Document | ShadowRoot, number>();

  private readonly _detectionMode: FocusMonitorDetectionMode;
  private _stopInputModalityDetector?: () => void;
  private _destroyed = false;

  /** window 重新聚焦时记录标志，稍后恢复上次来源。 */
  private _windowFocusListener = (): void => {
    this._windowFocused = true;
    this._windowFocusTimeoutId = setTimeout(() => (this._windowFocused = false));
  };

  private _document: Document;

  /**
   * @param options 检测模式等配置。
   * @param documentRef 文档对象，测试或非标准宿主可显式传入。
   * @param inputModalityDetector 输入方式检测器，测试可注入独立实例隔离状态。
   */
  constructor(
    options?: FocusMonitorOptions,
    documentRef?: Document,
    inputModalityDetector?: InputModalityDetector,
  ) {
    this._document = documentRef ?? (typeof document !== 'undefined' ? document : (undefined as unknown as Document));
    this._inputModalityDetector = inputModalityDetector ?? inputModalityDetectorSingleton;
    this._detectionMode =
      options?.detectionMode ?? FOCUS_MONITOR_DEFAULT_OPTIONS.detectionMode!;
  }

  /**
   * 根节点级 focus/blur 监听：沿祖先链逐个元素上报，
   * 从而支持 checkChildren（子元素聚焦也算父元素聚焦）。
   */
  private _rootNodeFocusAndBlurListener = (event: Event): void => {
    const target = getEventTargetPierceShadowDom<HTMLElement>(event);

    for (let element = target; element; element = element.parentElement) {
      if (event.type === 'focus') {
        this._onFocus(event as FocusEvent, element);
      } else {
        this._onBlur(event as FocusEvent, element);
      }
    }
  };

  /**
   * 开始监视元素的焦点来源。
   * @param element 被监视的元素或其 ref。
   * @param checkChildren 子元素聚焦时是否也视为该元素聚焦。
   * @returns 焦点来源变化时发射的流；元素失焦时发射 null。
   */
  monitor(element: MonitorTarget<HTMLElement>, checkChildren = false): Emitter<FocusOrigin> {
    const nativeElement = coerceElement(element);

    // 非浏览器或非元素节点时返回永不发值的流（与 Angular 的 observableOf() 语义一致）。
    if (!isBrowser() || nativeElement.nodeType !== 1) {
      const noop = new Emitter<FocusOrigin>();
      noop.complete();
      return noop;
    }

    // Shadow DOM 内的元素需要把焦点/失焦监听绑到 ShadowRoot 而非 document。
    const rootNode = getShadowRoot(nativeElement) || this._document;
    const cachedInfo = this._elementInfo.get(nativeElement);

    if (cachedInfo) {
      if (checkChildren) {
        // 已有监视时只能升级为 checkChildren，无法降级（与 Angular 一致的限制）。
        cachedInfo.checkChildren = true;
      }
      return cachedInfo.subject;
    }

    const info: MonitoredElementInfo = {
      checkChildren,
      subject: new Emitter<FocusOrigin>(),
      rootNode,
    };
    this._elementInfo.set(nativeElement, info);
    this._registerGlobalListeners(info);

    return info.subject;
  }

  /** 停止监视元素并清除其焦点类。 */
  stopMonitoring(element: MonitorTarget<HTMLElement>): void {
    const nativeElement = coerceElement(element);
    const elementInfo = this._elementInfo.get(nativeElement);

    if (elementInfo) {
      elementInfo.subject.complete();
      this._setClasses(nativeElement);
      this._elementInfo.delete(nativeElement);
      this._removeGlobalListeners(elementInfo);
    }
  }

  /**
   * 以指定来源聚焦元素。
   * 元素已处于聚焦状态时不会触发 focus 事件，因此直接更新类与来源。
   */
  focusVia(
    element: MonitorTarget<HTMLElement>,
    origin: FocusOrigin,
    options?: FocusOptions,
  ): void {
    const nativeElement = coerceElement(element);
    const focusedElement = this._document.activeElement;

    if (nativeElement === focusedElement) {
      this._getClosestElementsInfo(nativeElement).forEach(([currentElement, info]) =>
        this._originChanged(currentElement, origin, info),
      );
    } else {
      this._setOrigin(origin);

      // 服务端环境没有 focus 方法。
      if (typeof nativeElement.focus === 'function') {
        nativeElement.focus(options);
      }
    }
  }

  /** 停止监视所有元素并清理全局监听。 */
  destroy(): void {
    if (this._destroyed) {
      return;
    }
    this._destroyed = true;
    this._elementInfo.forEach((_info, element) => this.stopMonitoring(element));
  }

  /** 获取 document 所属的 window。 */
  private _getWindow(): Window {
    return this._document.defaultView || window;
  }

  /** 根据内部状态推断焦点事件来源。 */
  private _getFocusOrigin(focusEventTarget: HTMLElement | null): FocusOrigin {
    if (this._origin) {
      // 触摸来源需要进一步判断事件是否真的由触摸触发。
      if (this._originFromTouchInteraction) {
        return this._shouldBeAttributedToTouch(focusEventTarget) ? 'touch' : 'program';
      }
      return this._origin;
    }

    // 窗口刚重新聚焦时恢复失焦前的来源；否则无法区分
    // "程序化聚焦"与"屏幕阅读器导航聚焦"，统一按 program 处理。
    if (this._windowFocused && this._lastFocusOrigin) {
      return this._lastFocusOrigin;
    }

    // 通过 label 点击触发聚焦时，焦点在 click 而非 mousedown 上移动，
    // 需要单独识别为鼠标交互（复选框/单选框常见场景）。
    if (focusEventTarget && this._isLastInteractionFromInputLabel(focusEventTarget)) {
      return 'mouse';
    }

    return 'program';
  }

  /**
   * 判断触摸后发生的焦点事件是否应归因于触摸。
   * IMMEDIATE 模式下触摸来源不会立即清除，可能随后发生程序化聚焦，
   * 因此需要确认焦点事件目标包含最近一次触摸目标。
   */
  private _shouldBeAttributedToTouch(focusEventTarget: HTMLElement | null): boolean {
    return (
      this._detectionMode === FocusMonitorDetectionMode.EVENTUAL ||
      !!focusEventTarget?.contains(this._inputModalityDetector._mostRecentTarget)
    );
  }

  /** 按来源切换焦点类（origin 为空时全部清除）。 */
  private _setClasses(element: HTMLElement, origin?: FocusOrigin): void {
    element.classList.toggle('vcdk-focused', !!origin);
    element.classList.toggle('vcdk-touch-focused', origin === 'touch');
    element.classList.toggle('vcdk-keyboard-focused', origin === 'keyboard');
    element.classList.toggle('vcdk-mouse-focused', origin === 'mouse');
    element.classList.toggle('vcdk-program-focused', origin === 'program');
  }

  /**
   * 记录来源。IMMEDIATE 模式下用定时器清除来源：
   * 普通交互等 1ms（Firefox 在交互事件后一个 tick 才聚焦），
   * 触摸等 TOUCH_BUFFER_MS（触摸后焦点事件尚未进入事件队列）。
   */
  private _setOrigin(origin: FocusOrigin, isFromInteraction = false): void {
    this._origin = origin;
    this._originFromTouchInteraction = origin === 'touch' && isFromInteraction;

    if (this._detectionMode === FocusMonitorDetectionMode.IMMEDIATE) {
      clearTimeout(this._originTimeoutId);
      const ms = this._originFromTouchInteraction ? TOUCH_BUFFER_MS : 1;
      this._originTimeoutId = setTimeout(() => (this._origin = null), ms);
    }
  }

  /** focus 事件处理：目标或被监视元素本身。 */
  private _onFocus(event: FocusEvent, element: HTMLElement): void {
    const elementInfo = this._elementInfo.get(element);
    const focusEventTarget = getEventTargetPierceShadowDom<HTMLElement>(event);

    if (!elementInfo || (!elementInfo.checkChildren && element !== focusEventTarget)) {
      return;
    }

    this._originChanged(element, this._getFocusOrigin(focusEventTarget), elementInfo);
  }

  /** blur 事件处理：checkChildren 时排除在同一元素内部转移焦点的情况。 */
  private _onBlur(event: FocusEvent, element: HTMLElement): void {
    const elementInfo = this._elementInfo.get(element);

    if (
      !elementInfo ||
      (elementInfo.checkChildren &&
        event.relatedTarget instanceof Node &&
        element.contains(event.relatedTarget))
    ) {
      return;
    }

    this._setClasses(element);
    this._emitOrigin(elementInfo, null);
  }

  /** 有订阅者时才发射来源，避免空流消耗。 */
  private _emitOrigin(info: MonitoredElementInfo, origin: FocusOrigin): void {
    if (info.subject.hasListeners) {
      info.subject.next(origin);
    }
  }

  /** 注册根节点监听；第一个元素被监视时注册 window 与输入方式监听。 */
  private _registerGlobalListeners(elementInfo: MonitoredElementInfo): void {
    if (!isBrowser()) {
      return;
    }

    const rootNode = elementInfo.rootNode;
    const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode) || 0;

    if (!rootNodeFocusListeners) {
      rootNode.addEventListener('focus', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
      rootNode.addEventListener('blur', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
    }

    this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);

    if (++this._monitoredElementCount === 1) {
      this._getWindow().addEventListener('focus', this._windowFocusListener);

      this._stopInputModalityDetector = this._inputModalityDetector.modalityDetected.subscribe(
        modality => {
          this._setOrigin(modality, true);
        },
      );
    }
  }

  /** 注销根节点监听；最后一个元素停止监视时清理全局监听。 */
  private _removeGlobalListeners(elementInfo: MonitoredElementInfo): void {
    const rootNode = elementInfo.rootNode;

    if (this._rootNodeFocusListenerCount.has(rootNode)) {
      const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode)!;

      if (rootNodeFocusListeners > 1) {
        this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners - 1);
      } else {
        rootNode.removeEventListener('focus', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
        rootNode.removeEventListener('blur', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
        this._rootNodeFocusListenerCount.delete(rootNode);
      }
    }

    if (!--this._monitoredElementCount) {
      this._getWindow().removeEventListener('focus', this._windowFocusListener);
      this._stopInputModalityDetector?.();
      this._stopInputModalityDetector = undefined;
      clearTimeout(this._windowFocusTimeoutId);
      clearTimeout(this._originTimeoutId);
    }
  }

  /** 来源变化时更新类、发射事件并记录最近来源。 */
  private _originChanged(
    element: HTMLElement,
    origin: FocusOrigin,
    elementInfo: MonitoredElementInfo,
  ): void {
    this._setClasses(element, origin);
    this._emitOrigin(elementInfo, origin);
    this._lastFocusOrigin = origin;
  }

  /** 收集元素自身以及所有开启 checkChildren 的祖先的被监视信息。 */
  private _getClosestElementsInfo(
    element: HTMLElement,
  ): [HTMLElement, MonitoredElementInfo][] {
    const results: [HTMLElement, MonitoredElementInfo][] = [];

    this._elementInfo.forEach((info, currentElement) => {
      if (currentElement === element || (info.checkChildren && currentElement.contains(element))) {
        results.push([currentElement, info]);
      }
    });

    return results;
  }

  /**
   * 判断最近一次交互是否来自 input/textarea 的 label 点击。
   * 点击 label 时焦点在 click 阶段移动，会破坏 mousedown 归因假设。
   */
  private _isLastInteractionFromInputLabel(focusEventTarget: HTMLElement): boolean {
    const {_mostRecentTarget: mostRecentTarget, mostRecentModality} = this._inputModalityDetector;

    if (
      mostRecentModality !== 'mouse' ||
      !mostRecentTarget ||
      mostRecentTarget === focusEventTarget ||
      (focusEventTarget.nodeName !== 'INPUT' && focusEventTarget.nodeName !== 'TEXTAREA') ||
      (focusEventTarget as HTMLInputElement | HTMLTextAreaElement).disabled
    ) {
      return false;
    }

    const labels = (focusEventTarget as HTMLInputElement | HTMLTextAreaElement).labels;
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        if (labels[i].contains(mostRecentTarget)) {
          return true;
        }
      }
    }

    return false;
  }
}

/** 全局单例监视器（默认 IMMEDIATE 模式）。 */
export const focusMonitor = new FocusMonitor();
