import {describe, expect, it} from 'vitest';
import {mockVisible} from '../../../tests/helpers';
import {InteractivityChecker, IsFocusableConfig} from './interactivity-checker';

const checker = new InteractivityChecker();

describe('InteractivityChecker', () => {
  it('isDisabled 识别 disabled 属性', () => {
    const input = document.createElement('input');
    expect(checker.isDisabled(input)).toBe(false);
    input.setAttribute('disabled', '');
    expect(checker.isDisabled(input)).toBe(true);
  });

  it('isVisible 要求有几何尺寸且 visibility 可见', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(checker.isVisible(el)).toBe(false);

    mockVisible(el);
    expect(checker.isVisible(el)).toBe(true);

    el.style.visibility = 'hidden';
    expect(checker.isVisible(el)).toBe(false);
  });

  it('isFocusable 覆盖原生表单元素、带 href 锚点、contenteditable 与 tabindex', () => {
    const input = document.createElement('input');
    mockVisible(input);
    expect(checker.isFocusable(input)).toBe(true);

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    expect(checker.isFocusable(hidden)).toBe(false);

    const disabled = document.createElement('input');
    disabled.disabled = true;
    mockVisible(disabled);
    expect(checker.isFocusable(disabled)).toBe(false);

    const anchor = document.createElement('a');
    mockVisible(anchor);
    expect(checker.isFocusable(anchor)).toBe(false);
    anchor.setAttribute('href', '#');
    expect(checker.isFocusable(anchor)).toBe(true);

    const tabbed = document.createElement('div');
    tabbed.tabIndex = 0;
    mockVisible(tabbed);
    expect(checker.isFocusable(tabbed)).toBe(true);

    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', '');
    mockVisible(editable);
    expect(checker.isFocusable(editable)).toBe(true);
  });

  it('不可见元素默认不可聚焦，ignoreVisibility 可跳过可见性检查', () => {
    const input = document.createElement('input');
    input.style.display = 'none';
    expect(checker.isFocusable(input)).toBe(false);
    expect(checker.isFocusable(input, new IsFocusableConfig())).toBe(false);

    const config = new IsFocusableConfig();
    config.ignoreVisibility = true;
    expect(checker.isFocusable(input, config)).toBe(true);
  });

  it('isTabbable 处理 input、tabindex、iframe/object、audio/video 与 contenteditable', () => {
    const input = document.createElement('input');
    expect(checker.isTabbable(input)).toBe(true);
    input.tabIndex = -1;
    expect(checker.isTabbable(input)).toBe(false);

    const div = document.createElement('div');
    div.tabIndex = 0;
    expect(checker.isTabbable(div)).toBe(true);
    div.tabIndex = -1;
    expect(checker.isTabbable(div)).toBe(false);

    const iframe = document.createElement('iframe');
    expect(checker.isTabbable(iframe)).toBe(false);

    const object = document.createElement('object');
    expect(checker.isTabbable(object)).toBe(false);

    const audio = document.createElement('audio');
    expect(checker.isTabbable(audio)).toBe(false);
    audio.setAttribute('controls', '');
    expect(checker.isTabbable(audio)).toBe(true);
    audio.setAttribute('tabindex', '-1');
    expect(checker.isTabbable(audio)).toBe(false);

    const video = document.createElement('video');
    expect(checker.isTabbable(video)).toBe(false);
    video.setAttribute('controls', '');
    expect(checker.isTabbable(video)).toBe(true);
    video.removeAttribute('controls');
    video.setAttribute('tabindex', '0');
    expect(checker.isTabbable(video)).toBe(true);
    video.setAttribute('tabindex', '-1');
    expect(checker.isTabbable(video)).toBe(false);

    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', '');
    expect(checker.isTabbable(editable)).toBe(true);
    editable.setAttribute('tabindex', '-1');
    expect(checker.isTabbable(editable)).toBe(false);
  });
});
