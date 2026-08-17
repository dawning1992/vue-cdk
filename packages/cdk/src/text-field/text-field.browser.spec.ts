import {afterEach, describe, expect, it} from 'vitest';
import {AutofillMonitor} from './autofill';
import {TextareaAutosize} from './autosize';
import {vcdkTextFieldStyles} from './style-inject';

let cleanup: (() => void)[] = [];

afterEach(() => {
  cleanup.forEach(callback => callback());
  cleanup = [];
  document.body.innerHTML = '';
});

function textarea(): HTMLTextAreaElement {
  const element = document.createElement('textarea');
  element.style.cssText = 'width:300px;line-height:20px;padding:4px;border:1px solid;box-sizing:border-box';
  document.body.appendChild(element);
  return element;
}

describe('text-field Chromium 集成', () => {
  it('真实布局中随多行内容增高并在内容减少后收缩', () => {
    const element = textarea();
    const controller = new TextareaAutosize(element);
    cleanup.push(() => controller.destroy());
    element.value = '第一行';
    controller.resizeToFitContent(true);
    const singleLineHeight = element.getBoundingClientRect().height;
    expect(element.clientHeight).toBeGreaterThanOrEqual(element.scrollHeight);
    element.value = Array.from({length: 8}, (_, index) => `第 ${index + 1} 行`).join('\n');
    controller.resizeToFitContent(true);
    const multilineHeight = element.getBoundingClientRect().height;
    expect(multilineHeight).toBeGreaterThan(singleLineHeight);
    element.value = '恢复一行';
    controller.resizeToFitContent(true);
    expect(element.getBoundingClientRect().height).toBeLessThan(multilineHeight);
  });

  it('minRows/maxRows 与 placeholder 在真实布局中生效', () => {
    const element = textarea();
    const controller = new TextareaAutosize(element);
    cleanup.push(() => controller.destroy());
    controller.minRows = 2;
    controller.maxRows = 4;
    controller.setPlaceholder('第一行\n第二行\n第三行');
    expect(parseFloat(element.style.minHeight)).toBeGreaterThan(0);
    expect(parseFloat(element.style.maxHeight)).toBeGreaterThan(parseFloat(element.style.minHeight));
    expect(parseFloat(element.style.height)).toBeGreaterThanOrEqual(parseFloat(element.style.minHeight));
  });

  it('border-box 下单行内容与 minRows=2 最终严格保持两行最小高度', () => {
    const element = textarea();
    element.value = '一行文字';
    const controller = new TextareaAutosize(element);
    cleanup.push(() => controller.destroy());
    controller.minRows = 2;
    controller.maxRows = 6;
    controller.resizeToFitContent(true);
    expect(element.getBoundingClientRect().height).toBe(parseFloat(getComputedStyle(element).minHeight));
    expect(element.clientHeight).toBeGreaterThanOrEqual(element.scrollHeight);
  });

  it('发布样式包含探针且 animationstart 驱动自动填充状态', () => {
    expect(vcdkTextFieldStyles).toContain(':-webkit-autofill');
    const input = document.createElement('input');
    document.body.appendChild(input);
    const monitor = new AutofillMonitor();
    cleanup.push(() => monitor.destroy());
    const states: boolean[] = [];
    monitor.monitor(input).subscribe(event => states.push(event.isAutofilled));
    input.dispatchEvent(new AnimationEvent('animationstart', {animationName: 'cdk-text-field-autofill-start'}));
    input.dispatchEvent(new AnimationEvent('animationstart', {animationName: 'cdk-text-field-autofill-end'}));
    expect(states).toEqual([true, false]);
    expect(input.classList).not.toContain('cdk-text-field-autofilled');
  });
});
