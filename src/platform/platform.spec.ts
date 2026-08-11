import {describe, expect, it} from 'vitest';
import {
  getEventTargetPierceShadowDom,
  getFocusedElementPierceShadowDom,
  getShadowRoot,
  hasModifierKey,
  normalizePassiveListenerOptions,
  supportsPassiveEventListeners,
  supportsShadowDom,
} from './platform';

describe('platform 扩展工具', () => {
  it('hasModifierKey 无参数时任意修饰键均为 true，传入名称时按名称判断', () => {
    const shiftOnly = new KeyboardEvent('keydown', {shiftKey: true});
    const ctrlOnly = new KeyboardEvent('keydown', {ctrlKey: true});

    expect(hasModifierKey(shiftOnly)).toBe(true);
    expect(hasModifierKey(ctrlOnly)).toBe(true);
    expect(hasModifierKey(shiftOnly, 'ctrlKey')).toBe(false);
    expect(hasModifierKey(shiftOnly, 'shiftKey')).toBe(true);
    expect(hasModifierKey(ctrlOnly, 'shiftKey', 'ctrlKey')).toBe(true);
  });

  it('supportsShadowDom 在 jsdom 中返回 true（Element 原型存在 attachShadow）', () => {
    expect(supportsShadowDom()).toBe(true);
  });

  it('getShadowRoot 对普通元素返回 null，对 Shadow DOM 内元素返回其根节点', () => {
    const host = document.createElement('div');
    const root = host.attachShadow({mode: 'open'});
    const inner = document.createElement('input');
    root.appendChild(inner);

    expect(getShadowRoot(document.body)).toBeNull();
    expect(getShadowRoot(inner)).toBe(root);
  });

  it('getFocusedElementPierceShadowDom 返回当前聚焦元素', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    expect(getFocusedElementPierceShadowDom()).toBe(input);
  });

  it('getEventTargetPierceShadowDom 返回事件目标（composedPath 不可用时回退 event.target）', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    const event = new MouseEvent('click', {bubbles: true});
    button.dispatchEvent(event);

    expect(getEventTargetPierceShadowDom(event)).toBe(button);
  });

  it('supportsPassiveEventListeners / normalizePassiveListenerOptions 在 jsdom 中可用', () => {
    expect(supportsPassiveEventListeners()).toBe(true);

    const options: AddEventListenerOptions = {passive: true, capture: true};
    expect(normalizePassiveListenerOptions(options)).toBe(options);
  });
});
