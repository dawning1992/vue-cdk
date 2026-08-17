import {computed, defineComponent, h, nextTick, ref} from 'vue';
import {mount, type VueWrapper} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {CdkStep, CdkStepHeader, CdkStepper, CdkStepperNext, CdkStepperPrevious} from './components';
import {STEP_STATE, useStep, useStepper, type CdkStepPublicApi, type StepControl} from './stepper';

function exposed(wrapper: VueWrapper<any>): any {
  return (wrapper.vm as any).$?.exposed;
}

function stepApis(wrapper: VueWrapper<any>): CdkStepPublicApi[] {
  return wrapper.findAllComponents(CdkStep).map(item => exposed(item) as CdkStepPublicApi);
}

describe('CdkStepper 选择与线性流程', () => {
  it('注册步骤、支持初始索引、前进后退和选择事件', async () => {
    const selectionChange = vi.fn();
    const update = vi.fn();
    const wrapper = mount(CdkStepper, {
      props: {selectedIndex: 1, onSelectionChange: selectionChange, 'onUpdate:selectedIndex': update},
      slots: {default: () => [h(CdkStep), h(CdkStep), h(CdkStep)]},
    });
    const api = exposed(wrapper);
    expect(api.selectedIndex.value).toBe(1);
    api.next();
    expect(api.selectedIndex.value).toBe(2);
    expect(selectionChange.mock.calls[0][0]).toMatchObject({selectedIndex: 2, previouslySelectedIndex: 1});
    expect(update).toHaveBeenCalledWith(2);
    api.previous();
    expect(api.selectedIndex.value).toBe(1);
    expect(() => api.setSelectedIndex(4)).toThrow(/越界/);
  });

  it('线性模式阻止无效、pending 或未交互步骤，并允许可选或显式完成步骤', async () => {
    const valid = ref(false);
    const pending = ref(false);
    const optional = ref(false);
    const completed = ref<boolean | undefined>(undefined);
    const control: StepControl = {valid, pending, reset: vi.fn()};
    const wrapper = mount(defineComponent({setup: () => () => h(CdkStepper, {linear: true}, {
      default: () => [h(CdkStep, {stepControl: control, optional: optional.value, completed: completed.value}), h(CdkStep), h(CdkStep)],
    })}));
    const api = exposed(wrapper.findComponent(CdkStepper));
    api.next();
    expect(api.selectedIndex.value).toBe(0);
    valid.value = true;
    api.next();
    expect(api.selectedIndex.value).toBe(1);
    pending.value = true;
    api.setSelectedIndex(0);
    api.next();
    expect(api.selectedIndex.value).toBe(0);
    optional.value = true;
    await nextTick();
    api.setSelectedIndex(1);
    expect(api.selectedIndex.value).toBe(1);
    optional.value = false;
    completed.value = true;
    await nextTick();
    api.setSelectedIndex(0);
    api.next();
    expect(api.selectedIndex.value).toBe(1);
  });

  it('不可编辑步骤阻止返回，动态删除步骤后修正索引', async () => {
    const showLast = ref(true);
    const wrapper = mount(defineComponent({
      setup: () => () => h(CdkStepper, {selectedIndex: 2}, {default: () => [
        h(CdkStep), h(CdkStep, {editable: false}), showLast.value && h(CdkStep),
      ]}),
    }));
    const stepper = wrapper.findComponent(CdkStepper);
    const api = exposed(stepper);
    api.setSelectedIndex(1);
    expect(api.selectedIndex.value).toBe(2);
    showLast.value = false;
    await nextTick();
    expect(api.selectedIndex.value).toBe(1);
  });
});

describe('CdkStep 状态与重置', () => {
  it('推导 interacted、completed、error、indicatorType 并重置控制器', () => {
    const valid = ref(false);
    const reset = vi.fn();
    const interacted = vi.fn();
    const control: StepControl = {valid, invalid: computed(() => !valid.value), reset};
    const wrapper = mount(CdkStepper, {
      props: {showError: true},
      slots: {default: () => [h(CdkStep, {stepControl: control, onInteracted: interacted}), h(CdkStep)]},
    });
    const [step] = stepApis(wrapper);
    step.markAsInteracted();
    step.markAsInteracted();
    expect(interacted).toHaveBeenCalledTimes(1);
    expect(step.completed.value).toBe(false);
    expect(step.hasError.value).toBe(true);
    valid.value = true;
    expect(step.completed.value).toBe(true);
    expect(step.indicatorType.value).toBe(STEP_STATE.NUMBER);
    step.reset();
    expect(step.interacted.value).toBe(false);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('重置整个 Stepper 会重置所有步骤并回到首项', () => {
    const resetA = vi.fn();
    const resetB = vi.fn();
    const wrapper = mount(CdkStepper, {
      props: {selectedIndex: 1},
      slots: {default: () => [
        h(CdkStep, {stepControl: {valid: true, reset: resetA}}),
        h(CdkStep, {stepControl: {valid: true, reset: resetB}}),
      ]},
    });
    exposed(wrapper).reset();
    expect(exposed(wrapper).selectedIndex.value).toBe(0);
    expect(resetA).toHaveBeenCalledOnce();
    expect(resetB).toHaveBeenCalledOnce();
  });

  it('单步重置清除显式完成与错误覆盖', () => {
    const wrapper = mount(CdkStepper, {
      slots: {default: () => [h(CdkStep, {completed: true, hasError: true}), h(CdkStep)]},
    });
    const [step] = stepApis(wrapper);
    expect(step.completed.value).toBe(true);
    expect(step.hasError.value).toBe(true);
    step.reset();
    expect(step.completed.value).toBe(false);
    expect(step.hasError.value).toBe(false);
  });
});

describe('组件、按钮与键盘', () => {
  it('头部补齐 tab 语义，按钮使用兼容默认类型并驱动导航', async () => {
    let steps: readonly CdkStepPublicApi[] = [];
    const wrapper = mount(CdkStepper, {slots: {default: (api: any) => {
      steps = api.steps.value;
      return [
        ...steps.map(step => h(CdkStepHeader, {step}, {default: () => step.label.value || `步骤 ${step.index.value + 1}`})),
        h(CdkStep, {label: '一'}), h(CdkStep, {label: '二'}),
        h(CdkStepperPrevious), h(CdkStepperNext),
      ];
    }}});
    await nextTick();
    await nextTick();
    const headers = wrapper.findAll('[role="tab"]');
    expect(headers).toHaveLength(2);
    expect(headers[0].attributes('aria-selected')).toBe('true');
    const buttons = wrapper.findAll('button');
    expect(buttons[buttons.length - 2].attributes('type')).toBe('button');
    expect(buttons[buttons.length - 1].attributes('type')).toBe('submit');
    await buttons[buttons.length - 1].trigger('click');
    expect(exposed(wrapper).selectedIndex.value).toBe(1);
  });

  it('方向键/Home/End 移动焦点，Enter/Space 选择且修饰键不选择', async () => {
    const wrapper = mount(CdkStepper, {attachTo: document.body, slots: {default: (api: any) => [
      ...api.steps.value.map((step: CdkStepPublicApi) => h(CdkStepHeader, {step})),
      h(CdkStep), h(CdkStep), h(CdkStep),
    ]}});
    await nextTick(); await nextTick();
    const headers = wrapper.findAll('[role="tab"]');
    (headers[0].element as HTMLElement).focus();
    await headers[0].trigger('keydown', {key: 'ArrowRight', keyCode: 39});
    expect(document.activeElement).toBe(headers[1].element);
    await headers[1].trigger('keydown', {key: 'Enter', keyCode: 13});
    expect(exposed(wrapper).selectedIndex.value).toBe(1);
    await headers[1].trigger('keydown', {key: 'End', keyCode: 35});
    expect(document.activeElement).toBe(headers[2].element);
    await headers[2].trigger('keydown', {key: ' ', keyCode: 32, ctrlKey: true});
    expect(exposed(wrapper).selectedIndex.value).toBe(1);
    wrapper.unmount();
  });
});

describe('Composition API', () => {
  it('useStepper/useStep 可直接组成无样式实现并在卸载时清理', async () => {
    let api: ReturnType<typeof useStepper>;
    const Child = defineComponent({setup() { useStep(); return () => h('span'); }});
    const show = ref(true);
    const wrapper = mount(defineComponent({setup() {
      api = useStepper();
      return () => h('div', [show.value && h(Child), h(Child)]);
    }}));
    expect(api!.steps.value).toHaveLength(2);
    show.value = false;
    await nextTick();
    expect(api!.steps.value).toHaveLength(1);
    wrapper.unmount();
  });
});
