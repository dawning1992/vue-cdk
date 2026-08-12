import {afterEach, describe, expect, it, vi} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent} from 'vue';
import {dispatchMouseEvent} from '../../../tests/helpers';
import {TAB} from '../keycodes';
import {vFocusMonitor} from './v-focus-monitor';

const MonitorHost = defineComponent({
  directives: {FocusMonitor: vFocusMonitor},
  props: {onChange: {type: Function, default: undefined}},
  template: `<div><input class="target" v-focus-monitor="onChange" /><div class="child">子元素</div></div>`,
});

const SubtreeHost = defineComponent({
  directives: {FocusMonitor: vFocusMonitor},
  props: {onChange: {type: Function, default: undefined}},
  template: `<div><div class="subtree" v-focus-monitor.subtree="onChange"><div class="child">子元素</div></div></div>`,
});

let onChange: ReturnType<typeof vi.fn>;

afterEach(() => {
  onChange = undefined as never;
});

describe('vFocusMonitor 指令', () => {
  it('.subtree 修饰符下子元素聚焦也触发回调', () => {
    onChange = vi.fn();
    const wrapper = mount(SubtreeHost, {attachTo: document.body, props: {onChange}});
    const child = wrapper.element.querySelector('.child') as HTMLElement;

    // jsdom 对不可聚焦的 div 调用 focus() 不派发焦点事件，这里手动派发。
    child.dispatchEvent(new FocusEvent('focus', {bubbles: true, composed: true}));
    expect(onChange).toHaveBeenCalledWith('program');
    expect(wrapper.element.querySelector('.subtree')?.classList.contains('vcdk-focused')).toBe(true);
    wrapper.unmount();
  });

  it('焦点变化时触发回调并添加焦点类', () => {
    onChange = vi.fn();
    const wrapper = mount(MonitorHost, {attachTo: document.body, props: {onChange}});
    const target = wrapper.element.querySelector('.target') as HTMLElement;

    document.dispatchEvent(new KeyboardEvent('keydown', {keyCode: TAB, bubbles: true}));
    target.focus();

    expect(onChange).toHaveBeenCalledWith('keyboard');
    expect(target.classList.contains('vcdk-keyboard-focused')).toBe(true);
    wrapper.unmount();
  });

  it('鼠标交互归因为 mouse', () => {
    onChange = vi.fn();
    const wrapper = mount(MonitorHost, {attachTo: document.body, props: {onChange}});
    const target = wrapper.element.querySelector('.target') as HTMLElement;

    dispatchMouseEvent(target, 'mousedown', {buttons: 1, detail: 1});
    target.focus();

    expect(onChange).toHaveBeenCalledWith('mouse');
    wrapper.unmount();
  });

  it('卸载后停止监视并清除焦点类', () => {
    onChange = vi.fn();
    const wrapper = mount(MonitorHost, {attachTo: document.body, props: {onChange}});
    const target = wrapper.element.querySelector('.target') as HTMLElement;
    target.focus();
    expect(target.classList.contains('vcdk-focused')).toBe(true);

    wrapper.unmount();
    expect(target.classList.contains('vcdk-focused')).toBe(false);

    target.focus();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
