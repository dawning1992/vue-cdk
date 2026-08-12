import {describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent, onMounted, ref} from 'vue';
import {TAB} from '../keycodes';
import {FocusMonitorDetectionMode, focusMonitor} from './focus-monitor';
import {useFocusMonitor} from './use-focus-monitor';

const Host = defineComponent({
  setup() {
    const input = ref<HTMLElement | null>(null);
    const monitor = useFocusMonitor();
    const origins: (string | null)[] = [];
    // 元素 ref 在 setup 阶段为空，元素就绪后再开始监视。
    onMounted(() => {
      monitor.monitor(input).subscribe(origin => origins.push(origin));
    });
    return {input, origins};
  },
  template: `<input ref="input" />`,
});

describe('useFocusMonitor', () => {
  it('无配置时返回全局单例', () => {
    const wrapper = mount(Host, {attachTo: document.body});
    const input = wrapper.element as HTMLElement;

    document.dispatchEvent(new KeyboardEvent('keydown', {keyCode: TAB, bubbles: true}));
    input.focus();

    expect(wrapper.vm.origins).toContain('keyboard');
    expect(input.classList.contains('vcdk-keyboard-focused')).toBe(true);
    wrapper.unmount();
  });

  it('传入配置时返回独立实例（EVENTUAL 模式）', () => {
    const HostWithOptions = defineComponent({
      setup() {
        const input = ref<HTMLElement | null>(null);
        const monitor = useFocusMonitor({detectionMode: FocusMonitorDetectionMode.EVENTUAL});
        return {input, monitor};
      },
      template: `<input ref="input" />`,
    });

    const wrapper = mount(HostWithOptions, {attachTo: document.body});
    expect(wrapper.vm.monitor).not.toBe(focusMonitor);
    wrapper.unmount();
  });
});
