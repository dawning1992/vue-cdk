import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ref} from 'vue';
import {dispatchMouseEvent, dispatchTouchEvent} from '../../../tests/helpers';
import {TAB} from '../keycodes';
import {
  FocusMonitor,
  FocusMonitorDetectionMode,
  type FocusMonitorOptions,
} from './focus-monitor';
import {InputModalityDetector, TOUCH_BUFFER_MS} from './input-modality-detector';

let monitors: FocusMonitor[] = [];
let detectors: InputModalityDetector[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
});

afterEach(() => {
  monitors.forEach(monitor => monitor.destroy());
  monitors = [];
  detectors.forEach(detector => detector.destroy());
  detectors = [];
  vi.useRealTimers();
});

function createMonitor(options?: FocusMonitorOptions) {
  const detector = new InputModalityDetector();
  detectors.push(detector);
  const monitor = new FocusMonitor(options, document, detector);
  monitors.push(monitor);
  return {monitor, detector};
}

function createButton(): HTMLButtonElement {
  const button = document.createElement('button');
  document.body.appendChild(button);
  return button;
}

function dispatchKeydown(keyCode: number): void {
  document.dispatchEvent(new KeyboardEvent('keydown', {keyCode, bubbles: true}));
}

describe('FocusMonitor', () => {
  it('程序化聚焦归因为 program 并添加对应类', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    button.focus();

    expect(button.classList.contains('vcdk-focused')).toBe(true);
    expect(button.classList.contains('vcdk-program-focused')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('program');
  });

  it('键盘输入后聚焦归因为 keyboard', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    dispatchKeydown(TAB);
    button.focus();

    expect(button.classList.contains('vcdk-keyboard-focused')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('keyboard');
  });

  it('鼠标点击后聚焦归因为 mouse', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    dispatchMouseEvent(button, 'mousedown', {buttons: 1, detail: 1});
    button.focus();

    expect(button.classList.contains('vcdk-mouse-focused')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('mouse');
  });

  it('触摸后聚焦归因为 touch（最近非触摸事件目标包含于焦点目标）', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    // 先制造一个目标为 button 的 mousedown/keydown，供触摸归因判断使用。
    dispatchMouseEvent(button, 'mousedown', {buttons: 1, detail: 1});
    dispatchTouchEvent(button, [{identifier: 1, radiusX: 1, radiusY: 1}]);
    button.focus();

    expect(button.classList.contains('vcdk-touch-focused')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('touch');
  });

  it('EVENTUAL 模式下触摸后任意时间聚焦都归因为 touch', () => {
    const {monitor} = createMonitor({detectionMode: FocusMonitorDetectionMode.EVENTUAL});
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    dispatchTouchEvent(button, [{identifier: 1, radiusX: 1, radiusY: 1}]);
    vi.advanceTimersByTime(TOUCH_BUFFER_MS * 2);
    button.focus();

    expect(button.classList.contains('vcdk-touch-focused')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('touch');
  });

  it('失焦发射 null 并清除焦点类', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    dispatchKeydown(TAB);
    button.focus();
    button.blur();

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(button.classList.contains('vcdk-focused')).toBe(false);
  });

  it('checkChildren 时子元素聚焦也算父元素聚焦', () => {
    const {monitor} = createMonitor();
    const container = document.createElement('div');
    const input = document.createElement('input');
    container.appendChild(input);
    document.body.appendChild(container);
    const onChange = vi.fn();
    monitor.monitor(container, true).subscribe(onChange);

    dispatchKeydown(TAB);
    input.focus();

    expect(container.classList.contains('vcdk-keyboard-focused')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('keyboard');
  });

  it('focusVia 按指定来源聚焦元素', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    monitor.focusVia(button, 'mouse');

    expect(document.activeElement).toBe(button);
    expect(button.classList.contains('vcdk-mouse-focused')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('mouse');
  });

  it('focusVia 已聚焦元素时直接更新来源，无需重新触发事件', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    button.focus();
    monitor.focusVia(button, 'keyboard');

    expect(button.classList.contains('vcdk-keyboard-focused')).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith('keyboard');
  });

  it('focusVia 接受元素 ref', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const elementRef = ref<HTMLElement | null>(button);
    monitor.monitor(elementRef).subscribe(() => undefined);

    monitor.focusVia(elementRef, 'program');
    expect(document.activeElement).toBe(button);
  });

  it('同一元素重复 monitor 返回同一事件流', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const stream1 = monitor.monitor(button);
    const stream2 = monitor.monitor(button);
    expect(stream1).toBe(stream2);
  });

  it('stopMonitoring 结束事件流并清除焦点类', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    dispatchKeydown(TAB);
    button.focus();
    expect(button.classList.contains('vcdk-focused')).toBe(true);

    monitor.stopMonitoring(button);
    expect(button.classList.contains('vcdk-focused')).toBe(false);

    dispatchKeydown(TAB);
    button.focus();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('窗口重新聚焦时恢复失焦前的来源', () => {
    const {monitor} = createMonitor();
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    dispatchKeydown(TAB);
    button.focus();
    button.blur();
    // IMMEDIATE 模式：等待来源清除。
    vi.advanceTimersByTime(10);

    window.dispatchEvent(new Event('focus'));
    button.focus();

    expect(onChange).toHaveBeenLastCalledWith('keyboard');
    expect(button.classList.contains('vcdk-keyboard-focused')).toBe(true);
  });

  it('通过 label 点击聚焦 input 归因为鼠标', () => {
    const {monitor} = createMonitor();
    const label = document.createElement('label');
    const input = document.createElement('input');
    label.appendChild(input);
    document.body.appendChild(label);
    const onChange = vi.fn();
    monitor.monitor(input).subscribe(onChange);

    // 点击 label 时焦点在 click 阶段移动，需要等待 mousedown 来源清除后验证特判路径。
    dispatchMouseEvent(label, 'mousedown', {buttons: 1, detail: 1});
    vi.advanceTimersByTime(10);
    input.focus();

    expect(onChange).toHaveBeenCalledWith('mouse');
    expect(input.classList.contains('vcdk-mouse-focused')).toBe(true);
  });

  it('EVENTUAL 模式下来源不会随时间清除', () => {
    const {monitor} = createMonitor({detectionMode: FocusMonitorDetectionMode.EVENTUAL});
    const button = createButton();
    const onChange = vi.fn();
    monitor.monitor(button).subscribe(onChange);

    dispatchMouseEvent(button, 'mousedown', {buttons: 1, detail: 1});
    vi.advanceTimersByTime(10_000);
    button.focus();

    expect(onChange).toHaveBeenCalledWith('mouse');
  });

  it('Shadow DOM 内元素在根节点上绑定焦点监听', () => {
    const {monitor} = createMonitor();
    const host = document.createElement('div');
    const root = host.attachShadow({mode: 'open'});
    const input = document.createElement('input');
    root.appendChild(input);
    document.body.appendChild(host);
    const onChange = vi.fn();
    monitor.monitor(input).subscribe(onChange);

    dispatchKeydown(TAB);
    input.focus();

    expect(input.classList.contains('vcdk-keyboard-focused')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('keyboard');
  });

  it('停止监视一个元素不影响其他被监视元素', () => {
    const {monitor} = createMonitor();
    const first = createButton();
    const second = createButton();
    monitor.monitor(first).subscribe(() => undefined);
    monitor.monitor(second).subscribe(() => undefined);

    monitor.stopMonitoring(first);

    dispatchKeydown(TAB);
    second.focus();
    expect(second.classList.contains('vcdk-keyboard-focused')).toBe(true);
    expect(first.classList.contains('vcdk-focused')).toBe(false);
  });
});
