import {mount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {defineComponent, nextTick, ref} from 'vue';
import {AutofillMonitor, useAutofill, type AutofillEvent} from './autofill';
import {vAutofill} from './v-autofill';

function animation(element: Element, name: string): void {
  const event = new Event('animationstart') as AnimationEvent;
  Object.defineProperty(event, 'animationName', {value: name});
  element.dispatchEvent(event);
}

describe('AutofillMonitor', () => {
  it('monitor 添加类与单个 passive 监听器，同一元素重复监控时共享监听', () => {
    const monitor = new AutofillMonitor();
    const input = document.createElement('input');
    const spy = vi.spyOn(input, 'addEventListener');
    monitor.monitor(input);
    monitor.monitor(input);
    expect(input.classList).toContain('cdk-text-field-autofill-monitored');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('animationstart', expect.any(Function), {passive: true});
    monitor.destroy();
  });

  it('开始与结束动画切换类并向多个订阅者派发事件', () => {
    const monitor = new AutofillMonitor();
    const input = document.createElement('input');
    const first = vi.fn();
    const second = vi.fn();
    const stream = monitor.monitor(input);
    stream.subscribe(first);
    stream.subscribe(second);
    animation(input, 'cdk-text-field-autofill-start');
    expect(input.classList).toContain('cdk-text-field-autofilled');
    expect(first).toHaveBeenLastCalledWith({target: input, isAutofilled: true});
    animation(input, 'cdk-text-field-autofill-end');
    expect(input.classList).not.toContain('cdk-text-field-autofilled');
    expect(second).toHaveBeenLastCalledWith({target: input, isAutofilled: false});
    monitor.destroy();
  });

  it('忽略无关动画与没有状态变化的重复动画', () => {
    const monitor = new AutofillMonitor();
    const input = document.createElement('input');
    const listener = vi.fn();
    monitor.monitor(input).subscribe(listener);
    animation(input, 'other');
    animation(input, 'cdk-text-field-autofill-end');
    animation(input, 'cdk-text-field-autofill-start');
    animation(input, 'cdk-text-field-autofill-start');
    expect(listener).toHaveBeenCalledTimes(1);
    monitor.destroy();
  });

  it('stopMonitoring 完成流、移除监听器和全部状态类', () => {
    const monitor = new AutofillMonitor();
    const input = document.createElement('input');
    const complete = vi.fn();
    const removeSpy = vi.spyOn(input, 'removeEventListener');
    monitor.monitor(input).subscribe({complete});
    animation(input, 'cdk-text-field-autofill-start');
    monitor.stopMonitoring(input);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(input.className).toBe('');
  });

  it('unsubscribe 幂等且不会完成其他订阅', () => {
    const monitor = new AutofillMonitor();
    const input = document.createElement('input');
    const listener = vi.fn();
    const subscription = monitor.monitor(input).subscribe(listener);
    subscription.unsubscribe();
    subscription.unsubscribe();
    animation(input, 'cdk-text-field-autofill-start');
    expect(subscription.closed).toBe(true);
    expect(listener).not.toHaveBeenCalled();
    monitor.destroy();
  });
});

describe('Vue 入口', () => {
  it('useAutofill 同步响应事件并在目标变化时清理旧元素', async () => {
    const monitor = new AutofillMonitor();
    const first = document.createElement('input');
    const second = document.createElement('input');
    const target = ref<Element | null>(first);
    let api!: ReturnType<typeof useAutofill>;
    const Host = defineComponent({
      setup() {
        api = useAutofill(target, {monitor});
        return () => null;
      },
    });
    const wrapper = mount(Host);
    await nextTick();
    animation(first, 'cdk-text-field-autofill-start');
    expect(api.isAutofilled.value).toBe(true);
    target.value = second;
    await nextTick();
    expect(first.className).toBe('');
    expect(api.isAutofilled.value).toBe(false);
    wrapper.unmount();
    expect(second.className).toBe('');
    monitor.destroy();
  });

  it('vAutofill 派发最新回调并在卸载时清理', async () => {
    const first = vi.fn<(event: AutofillEvent) => void>();
    const second = vi.fn<(event: AutofillEvent) => void>();
    const Host = defineComponent({
      directives: {autofill: vAutofill},
      props: {callback: {type: Function, required: true}},
      template: '<input v-autofill="callback" />',
    });
    const wrapper = mount(Host, {props: {callback: first}, attachTo: document.body});
    const input = wrapper.get('input').element;
    animation(input, 'cdk-text-field-autofill-start');
    expect(first).toHaveBeenCalledTimes(1);
    await wrapper.setProps({callback: second});
    animation(input, 'cdk-text-field-autofill-end');
    expect(second).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    expect(input.className).toBe('');
  });
});
