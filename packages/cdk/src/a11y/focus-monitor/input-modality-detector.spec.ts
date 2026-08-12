import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {dispatchMouseEvent, dispatchTouchEvent} from '../../../tests/helpers';
import {A, TAB} from '../keycodes';
import {InputModalityDetector, TOUCH_BUFFER_MS, inputModalityDetector} from './input-modality-detector';

let detectors: InputModalityDetector[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
});

afterEach(() => {
  detectors.forEach(detector => detector.destroy());
  detectors = [];
  vi.useRealTimers();
});

function createDetector(options?: ConstructorParameters<typeof InputModalityDetector>[0]) {
  const detector = new InputModalityDetector(options);
  detectors.push(detector);
  return detector;
}

function dispatchKeydown(keyCode: number): void {
  document.dispatchEvent(new KeyboardEvent('keydown', {keyCode, bubbles: true}));
}

describe('InputModalityDetector', () => {
  it('keydown 归类为键盘输入并记录目标', () => {
    const detector = createDetector();
    const onDetected = vi.fn();
    const onChanged = vi.fn();
    detector.modalityDetected.subscribe(onDetected);
    detector.modalityChanged.subscribe(onChanged);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const event = new KeyboardEvent('keydown', {keyCode: TAB, bubbles: true});
    input.dispatchEvent(event);

    expect(detector.mostRecentModality).toBe('keyboard');
    expect(detector._mostRecentTarget).toBe(input);
    expect(onDetected).toHaveBeenCalledWith('keyboard');
    expect(onChanged).toHaveBeenCalledWith('keyboard');
  });

  it('modalityDetected 每次检测都发射，modalityChanged 仅在变化时发射', () => {
    const detector = createDetector();
    const onDetected = vi.fn();
    const onChanged = vi.fn();
    detector.modalityDetected.subscribe(onDetected);
    detector.modalityChanged.subscribe(onChanged);

    dispatchKeydown(TAB);
    dispatchKeydown(TAB);
    expect(onDetected).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('真实 mousedown 归类为鼠标，伪造 mousedown 归类为键盘', () => {
    const detector = createDetector();
    const onDetected = vi.fn();
    detector.modalityDetected.subscribe(onDetected);

    dispatchMouseEvent(document, 'mousedown', {buttons: 1, detail: 1});
    expect(detector.mostRecentModality).toBe('mouse');

    dispatchMouseEvent(document, 'mousedown', {buttons: 0, detail: 0});
    expect(detector.mostRecentModality).toBe('keyboard');
    expect(onDetected).toHaveBeenLastCalledWith('keyboard');
  });

  it('真实 touchstart 归类为触摸，且 TOUCH_BUFFER_MS 内的 mousedown 被忽略', () => {
    const detector = createDetector();
    const onDetected = vi.fn();
    detector.modalityDetected.subscribe(onDetected);

    dispatchTouchEvent(document, [{identifier: 1, radiusX: 1, radiusY: 1}]);
    expect(detector.mostRecentModality).toBe('touch');

    dispatchMouseEvent(document, 'mousedown', {buttons: 1, detail: 1});
    expect(detector.mostRecentModality).toBe('touch');
    expect(onDetected).toHaveBeenCalledTimes(1);
  });

  it('超过 TOUCH_BUFFER_MS 后 mousedown 归类为鼠标', () => {
    const detector = createDetector();

    dispatchTouchEvent(document, [{identifier: 1, radiusX: 1, radiusY: 1}]);
    vi.setSystemTime(1000 + TOUCH_BUFFER_MS + 1);
    dispatchMouseEvent(document, 'mousedown', {buttons: 1, detail: 1});

    expect(detector.mostRecentModality).toBe('mouse');
  });

  it('伪造 touchstart（identifier 为 -1）归类为键盘', () => {
    const detector = createDetector();
    dispatchTouchEvent(document, [{identifier: -1, radiusX: 1, radiusY: 1}]);
    expect(detector.mostRecentModality).toBe('keyboard');
  });

  it('ignoreKeys 配置的按键不触发键盘输入检测', () => {
    const detector = createDetector({ignoreKeys: [A]});
    const onDetected = vi.fn();
    detector.modalityDetected.subscribe(onDetected);

    dispatchKeydown(A);
    expect(onDetected).not.toHaveBeenCalled();

    dispatchKeydown(TAB);
    expect(onDetected).toHaveBeenCalledWith('keyboard');
  });

  it('destroy 移除全局监听并结束事件流', () => {
    const detector = createDetector();
    const onDetected = vi.fn();
    detector.modalityDetected.subscribe(onDetected);
    detector.destroy();

    dispatchKeydown(TAB);
    expect(onDetected).not.toHaveBeenCalled();
    expect(detector.modalityDetected.hasListeners).toBe(false);
  });

  it('导出的单例可正常检测输入', () => {
    const onDetected = vi.fn();
    inputModalityDetector.modalityDetected.subscribe(onDetected);
    dispatchKeydown(TAB);
    expect(inputModalityDetector.mostRecentModality).toBe('keyboard');
  });
});
