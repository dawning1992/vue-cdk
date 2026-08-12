import {describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent} from 'vue';
import {flushPromises, mockVisible} from '../../../tests/helpers';
import {vFocusTrap} from './v-focus-trap';

const TrapHost = defineComponent({
  directives: {focusTrap: vFocusTrap},
  props: {enabled: {type: Boolean, default: true}},
  template: `<div class="trap-host" v-focus-trap="enabled"><input class="first" /><input class="second" /></div>`,
});

function anchorsOf(element: HTMLElement): [HTMLElement | null, HTMLElement | null] {
  const children = Array.from(element.parentElement?.children ?? []);
  const index = children.indexOf(element);
  return [
    (children[index - 1] as HTMLElement | undefined) ?? null,
    (children[index + 1] as HTMLElement | undefined) ?? null,
  ];
}

describe('vFocusTrap 指令', () => {
  it('挂载后在元素前后插入锚点，卸载时移除', () => {
    const wrapper = mount(TrapHost, {attachTo: document.body});
    const host = wrapper.element as HTMLElement;
    const [start, end] = anchorsOf(host);

    expect(start?.classList.contains('vcdk-focus-trap-anchor')).toBe(true);
    expect(end?.classList.contains('vcdk-focus-trap-anchor')).toBe(true);
    expect(start?.getAttribute('tabindex')).toBe('0');

    wrapper.unmount();
    expect(document.querySelectorAll('.vcdk-focus-trap-anchor').length).toBe(0);
  });

  it('绑定值为 false 时禁用陷阱，更新后重新启用', async () => {
    const wrapper = mount(TrapHost, {attachTo: document.body, props: {enabled: false}});
    const host = wrapper.element as HTMLElement;
    const [start, end] = anchorsOf(host);

    expect(start?.hasAttribute('tabindex')).toBe(false);
    expect(end?.hasAttribute('tabindex')).toBe(false);

    await wrapper.setProps({enabled: true});
    expect(start?.getAttribute('tabindex')).toBe('0');
    expect(end?.getAttribute('tabindex')).toBe('0');
  });

  it('.autoCapture 挂载时捕获焦点，卸载时恢复', async () => {
    const AutoHost = defineComponent({
      directives: {focusTrap: vFocusTrap},
      template: `<div class="trap-host" v-focus-trap.autoCapture><input class="first" /><input class="second" /></div>`,
    });
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const wrapper = mount(AutoHost, {attachTo: document.body});
    mockVisible(wrapper.element.querySelector('.first') as HTMLElement);
    mockVisible(wrapper.element.querySelector('.second') as HTMLElement);
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.element.querySelector('.first'));

    wrapper.unmount();
    expect(document.activeElement).toBe(outside);
  });
});
