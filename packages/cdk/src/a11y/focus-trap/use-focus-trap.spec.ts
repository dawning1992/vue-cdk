import {describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent, nextTick, ref} from 'vue';
import {flushPromises, mockVisible} from '../../../tests/helpers';
import {useFocusTrap} from './use-focus-trap';

const Host = defineComponent({
  props: {configurable: Boolean, autoCapture: Boolean},
  setup(props) {
    const root = ref<HTMLElement | null>(null);
    const result = useFocusTrap(root, {
      configurable: props.configurable,
      autoCapture: props.autoCapture,
    });
    return {
      ...result,
      root,
      // 测试辅助：setup 返回值中的 ref 会被实例代理解包，暴露 setter 便于断言。
      setEnabled: (value: boolean) => {
        result.enabled.value = value;
      },
    };
  },
  template: `<div ref="root" class="trap-host"><input class="first" /><input class="second" /></div>`,
});

function anchorsOf(element: HTMLElement): [HTMLElement | null, HTMLElement | null] {
  const children = Array.from(element.parentElement?.children ?? []);
  const index = children.indexOf(element);
  return [
    (children[index - 1] as HTMLElement | undefined) ?? null,
    (children[index + 1] as HTMLElement | undefined) ?? null,
  ];
}

describe('useFocusTrap', () => {
  it('目标元素就绪后自动创建陷阱，enabled 双向同步', async () => {
    const wrapper = mount(Host, {attachTo: document.body});
    await nextTick();

    const host = wrapper.element as HTMLElement;
    expect(wrapper.vm.trap).not.toBeNull();
    expect(anchorsOf(host)[0]?.getAttribute('tabindex')).toBe('0');

    wrapper.vm.setEnabled(false);
    await nextTick();
    expect(anchorsOf(host)[0]?.hasAttribute('tabindex')).toBe(false);

    wrapper.vm.setEnabled(true);
    await nextTick();
    expect(anchorsOf(host)[0]?.getAttribute('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('focusInitial/focusFirst/focusLast 聚焦陷阱内元素', async () => {
    const wrapper = mount(Host, {attachTo: document.body});
    mockVisible(wrapper.element.querySelector('.first') as HTMLElement);
    mockVisible(wrapper.element.querySelector('.second') as HTMLElement);
    await nextTick();

    expect(wrapper.vm.focusInitial()).toBe(true);
    expect(document.activeElement).toBe(wrapper.element.querySelector('.first'));
    expect(wrapper.vm.focusLast()).toBe(true);
    expect(document.activeElement).toBe(wrapper.element.querySelector('.second'));
    expect(wrapper.vm.focusFirst()).toBe(true);
    expect(document.activeElement).toBe(wrapper.element.querySelector('.first'));
    wrapper.unmount();
  });

  it('destroy 销毁陷阱并停止后续重建', async () => {
    const wrapper = mount(Host, {attachTo: document.body});
    await nextTick();

    wrapper.vm.destroy();
    expect(wrapper.vm.trap).toBeNull();
    expect(document.querySelectorAll('.vcdk-focus-trap-anchor').length).toBe(0);
    expect(wrapper.vm.focusInitial()).toBe(false);
    wrapper.unmount();
  });

  it('autoCapture 挂载捕获焦点、卸载恢复', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const wrapper = mount(Host, {attachTo: document.body, props: {autoCapture: true}});
    mockVisible(wrapper.element.querySelector('.first') as HTMLElement);
    mockVisible(wrapper.element.querySelector('.second') as HTMLElement);
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.element.querySelector('.first'));
    wrapper.unmount();
    expect(document.activeElement).toBe(outside);
  });

  it('configurable 模式接入栈管理：后创建的陷阱停用前者', async () => {
    const wrapper1 = mount(Host, {attachTo: document.body, props: {configurable: true}});
    await nextTick();
    const host1 = wrapper1.element as HTMLElement;

    const wrapper2 = mount(Host, {attachTo: document.body, props: {configurable: true}});
    await nextTick();
    const host2 = wrapper2.element as HTMLElement;

    expect(anchorsOf(host1)[0]?.hasAttribute('tabindex')).toBe(false);
    expect(anchorsOf(host2)[0]?.getAttribute('tabindex')).toBe('0');

    wrapper2.unmount();
    await nextTick();
    expect(anchorsOf(host1)[0]?.getAttribute('tabindex')).toBe('0');
    wrapper1.unmount();
  });
});
