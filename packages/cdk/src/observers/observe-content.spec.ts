import {mount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {defineComponent, nextTick, ref, type PropType} from 'vue';
import {CDK_CONTENT_OBSERVER, ContentObserver, MutationObserverFactory} from './content-observer';
import {vCdkObserveContent, type CdkObserveContentValue} from './observe-content';
import {useObserveContent} from './use-observe-content';

function createService() {
  let callback: MutationCallback | null = null;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const factory = new MutationObserverFactory();
  vi.spyOn(factory, 'create').mockImplementation(cb => {
    callback = cb;
    return {observe, disconnect, takeRecords: () => []} as unknown as MutationObserver;
  });
  return {
    service: new ContentObserver(factory),
    observe,
    disconnect,
    emit(records: MutationRecord[] = [{} as MutationRecord]) {
      callback?.(records, {} as MutationObserver);
    },
  };
}

const DirectiveHost = defineComponent({
  directives: {cdkObserveContent: vCdkObserveContent},
  props: {binding: {type: [Function, Object] as PropType<CdkObserveContentValue>, required: true}},
  template: `<div v-cdk-observe-content="binding"><span>内容</span></div>`,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('vCdkObserveContent', () => {
  it('挂载后订阅宿主元素并派发变更', () => {
    const harness = createService();
    const callback = vi.fn();
    const wrapper = mount(DirectiveHost, {props: {binding: {callback, observer: harness.service}}});
    harness.emit();
    expect(harness.observe).toHaveBeenCalledWith(wrapper.element, expect.any(Object));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('使用应用级 provide 的 ContentObserver', () => {
    const harness = createService();
    const callback = vi.fn();
    mount(DirectiveHost, {
      props: {binding: callback},
      global: {provide: {[CDK_CONTENT_OBSERVER as symbol]: harness.service}},
    });
    harness.emit();
    expect(harness.observe).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('disabled 初始为 true 时不创建观察器，启用与再次禁用会正确切换', async () => {
    const harness = createService();
    const callback = vi.fn();
    const wrapper = mount(DirectiveHost, {
      props: {binding: {callback, observer: harness.service, disabled: true}},
    });
    expect(harness.observe).not.toHaveBeenCalled();

    await wrapper.setProps({binding: {callback, observer: harness.service, disabled: false}});
    expect(harness.observe).toHaveBeenCalledTimes(1);
    await wrapper.setProps({binding: {callback, observer: harness.service, disabled: true}});
    expect(harness.disconnect).toHaveBeenCalledTimes(1);
  });

  it('debounce 合并连续通知并使用最后一批记录', () => {
    const harness = createService();
    const callback = vi.fn();
    mount(DirectiveHost, {props: {binding: {callback, observer: harness.service, debounce: 100}}});
    const first = [{type: 'first'} as unknown as MutationRecord];
    const last = [{type: 'last'} as unknown as MutationRecord];
    harness.emit(first);
    harness.emit(last);
    vi.advanceTimersByTime(99);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(last);
  });

  it('更新回调不重建观察器且后续使用最新回调', async () => {
    const harness = createService();
    const first = vi.fn();
    const second = vi.fn();
    const wrapper = mount(DirectiveHost, {props: {binding: {callback: first, observer: harness.service}}});
    await wrapper.setProps({binding: {callback: second, observer: harness.service}});
    harness.emit();
    expect(harness.observe).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('卸载时断开观察并取消待派发回调', () => {
    const harness = createService();
    const callback = vi.fn();
    const wrapper = mount(DirectiveHost, {
      props: {binding: {callback, observer: harness.service, debounce: 100}},
    });
    harness.emit();
    wrapper.unmount();
    vi.advanceTimersByTime(100);
    expect(harness.disconnect).toHaveBeenCalledOnce();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useObserveContent', () => {
  it('响应元素、disabled 与 debounce，并在组件卸载时清理', async () => {
    const harness = createService();
    const callback = vi.fn();
    const disabled = ref(true);
    const debounce = ref(50);
    const Host = defineComponent({
      setup() {
        const element = ref<Element | null>(null);
        useObserveContent(element, callback, {observer: harness.service, disabled, debounce});
        return {element};
      },
      template: `<div ref="element">内容</div>`,
    });
    const wrapper = mount(Host);
    expect(harness.observe).not.toHaveBeenCalled();
    disabled.value = false;
    await nextTick();
    expect(harness.observe).toHaveBeenCalledTimes(1);
    harness.emit();
    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledOnce();
    wrapper.unmount();
    expect(harness.disconnect).toHaveBeenCalledOnce();
  });
});
