/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * 本地适配：BehaviorSubject/skip/distinctUntilChanged → Emitter + 值比较；
 * RendererFactory2 监听 → addEventListener；InjectionToken → 构造参数。
 */

/**
 * 输入方式检测器，移植自 Angular CDK 的 InputModalityDetector。
 *
 * 通过 document 级 keydown / mousedown / touchstart 捕获监听判断
 * 用户最近一次交互的输入方式（键盘/鼠标/触摸），供 FocusMonitor
 * 推断焦点事件的来源。
 */

import {Emitter} from '../../emitter';
import {getEventTargetPierceShadowDom, isBrowser} from '../../platform';
import {ALT, CONTROL, MAC_META, META, SHIFT} from '../keycodes';
import {
  isFakeMousedownFromScreenReader,
  isFakeTouchstartFromScreenReader,
} from './fake-event-detection';

/** 检测到的输入方式；null 表示未知。 */
export type InputModality = 'keyboard' | 'mouse' | 'touch' | null;

/** InputModalityDetector 配置项。 */
export interface InputModalityDetectorOptions {
  /** 检测键盘输入方式时忽略的按键码列表。 */
  ignoreKeys?: number[];
}

/** 默认配置：忽略纯修饰键（避免与鼠标组合操作、VoiceOver 线性导航混淆）。 */
export const INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS: InputModalityDetectorOptions = {
  ignoreKeys: [ALT, CONTROL, MAC_META, META, SHIFT],
};

/**
 * touchstart 之后需要经过的时间（毫秒），用于区分由触摸派生的
 * mousedown 与真实鼠标操作；该取值沿用 AngularJS Material 的实测值。
 */
export const TOUCH_BUFFER_MS = 650;

/** 捕获阶段 + passive 的监听选项，保证即使其他代码阻止传播也能检测到。 */
const modalityEventListenerOptions: AddEventListenerOptions = {
  passive: true,
  capture: true,
};

export class InputModalityDetector {
  /** 每次检测到输入方式时发射（含与上次相同的值）。 */
  readonly modalityDetected = new Emitter<InputModality>();

  /** 输入方式发生变化时发射。 */
  readonly modalityChanged = new Emitter<InputModality>();

  /** 最近一次检测到的输入方式。 */
  get mostRecentModality(): InputModality {
    return this._modality;
  }

  /** 最近一次输入事件的目标元素（touch 事件不记录，与 Angular 一致）。 */
  _mostRecentTarget: HTMLElement | null = null;

  private _modality: InputModality = null;
  private readonly _options: InputModalityDetectorOptions;
  private _lastTouchMs = 0;

  constructor(options?: InputModalityDetectorOptions) {
    this._options = {...INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS, ...options};

    if (isBrowser()) {
      document.addEventListener('keydown', this._onKeydown, modalityEventListenerOptions);
      document.addEventListener('mousedown', this._onMousedown, modalityEventListenerOptions);
      document.addEventListener('touchstart', this._onTouchstart, modalityEventListenerOptions);
    }
  }

  /** 移除全局监听并结束事件流。 */
  destroy(): void {
    document.removeEventListener('keydown', this._onKeydown, modalityEventListenerOptions);
    document.removeEventListener('mousedown', this._onMousedown, modalityEventListenerOptions);
    document.removeEventListener('touchstart', this._onTouchstart, modalityEventListenerOptions);
    this.modalityDetected.complete();
    this.modalityChanged.complete();
  }

  /** keydown 处理：忽略配置中的按键，其余归为键盘输入。 */
  private _onKeydown = (event: KeyboardEvent): void => {
    if (this._options?.ignoreKeys?.some(keyCode => keyCode === event.keyCode)) {
      return;
    }

    this._emitDetected('keyboard');
    this._mostRecentTarget = getEventTargetPierceShadowDom(event);
  };

  /** mousedown 处理：触摸派生事件被 TOUCH_BUFFER_MS 过滤，伪造事件归为键盘。 */
  private _onMousedown = (event: MouseEvent): void => {
    if (Date.now() - this._lastTouchMs < TOUCH_BUFFER_MS) {
      return;
    }

    this._emitDetected(isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse');
    this._mostRecentTarget = getEventTargetPierceShadowDom(event);
  };

  /** touchstart 处理：伪造事件归为键盘，真实触摸记录时间戳。 */
  private _onTouchstart = (event: TouchEvent): void => {
    if (isFakeTouchstartFromScreenReader(event)) {
      this._emitDetected('keyboard');
      return;
    }

    this._lastTouchMs = Date.now();
    this._emitDetected('touch');
  };

  /**
   * 记录输入方式：modalityDetected 每次检测都发射；
   * modalityChanged 仅在值变化时发射。
   */
  private _emitDetected(modality: Exclude<InputModality, null>): void {
    if (this._modality !== modality) {
      this._modality = modality;
      this.modalityDetected.next(modality);
      this.modalityChanged.next(modality);
    } else {
      this.modalityDetected.next(modality);
    }
  }
}

/** 全局单例检测器。 */
export const inputModalityDetector = new InputModalityDetector();
