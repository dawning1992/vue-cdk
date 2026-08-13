import {mount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {defineComponent, provide, ref, type PropType} from 'vue';
import {clipboard} from './clipboard';
import {CDK_COPY_TO_CLIPBOARD_CONFIG, vCopyToClipboard} from './copy-to-clipboard';
import type {CopyToClipboardOptions} from './copy-to-clipboard';
import type {PendingCopy} from './pending-copy';

/** 字符串简写绑定宿主组件。 */
const StringHost = defineComponent({
  directives: {copyToClipboard: vCopyToClipboard},
  props: {text: String},
  template: `<button v-copy-to-clipboard="text">复制</button>`,
});

/** 对象绑定宿主组件。 */
const OptionsHost = defineComponent({
  directives: {copyToClipboard: vCopyToClipboard},
  props: {
    options: {type: Object as PropType<CopyToClipboardOptions>, required: true},
  },
  template: `<button v-copy-to-clipboard="options">复制</button>`,
});

/**
 * 构造按顺序返回结果的伪 PendingCopy：
 * 结果耗尽后固定返回 false，便于测试重试耗尽与上限场景。
 */
function fakePendingCopySequence(
  results: boolean[],
): {pending: PendingCopy; copy: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn>} {
  let index = 0;
  const copy = vi.fn(() => results[Math.min(index++, results.length - 1)] ?? false);
  const destroy = vi.fn();
  return {pending: {copy, destroy} as unknown as PendingCopy, copy, destroy};
}

describe('vCopyToClipboard 指令', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('字符串简写：点击时调用 clipboard.copy 复制文本', async () => {
    const copySpy = vi.spyOn(clipboard, 'copy').mockReturnValue(true);
    const wrapper = mount(StringHost, {props: {text: 'hello'}});

    await wrapper.get('button').trigger('click');
    expect(copySpy).toHaveBeenCalledWith('hello');

    wrapper.unmount();
  });

  it('对象绑定：复制成功时回调 onCopied(true)', async () => {
    vi.spyOn(clipboard, 'copy').mockReturnValue(true);
    const onCopied = vi.fn();
    const wrapper = mount(OptionsHost, {props: {options: {text: 'hello', onCopied}}});

    await wrapper.get('button').trigger('click');
    expect(onCopied).toHaveBeenCalledWith(true);

    wrapper.unmount();
  });

  it('对象绑定：复制失败时回调 onCopied(false)', async () => {
    vi.spyOn(clipboard, 'copy').mockReturnValue(false);
    const onCopied = vi.fn();
    const wrapper = mount(OptionsHost, {props: {options: {text: 'hello', onCopied}}});

    await wrapper.get('button').trigger('click');
    expect(onCopied).toHaveBeenCalledWith(false);

    wrapper.unmount();
  });

  it('attempts 为 1 时直接调用 clipboard.copy，不创建 PendingCopy', async () => {
    const copySpy = vi.spyOn(clipboard, 'copy').mockReturnValue(true);
    const beginCopySpy = vi.spyOn(clipboard, 'beginCopy');
    const onCopied = vi.fn();
    const wrapper = mount(OptionsHost, {props: {options: {text: 'hello', attempts: 1, onCopied}}});

    await wrapper.get('button').trigger('click');
    expect(copySpy).toHaveBeenCalledWith('hello');
    expect(beginCopySpy).not.toHaveBeenCalled();
    expect(onCopied).toHaveBeenCalledWith(true);

    wrapper.unmount();
  });

  it('attempts 大于 1 时重试直至成功，仅回调一次 onCopied(true)', async () => {
    const {pending, copy, destroy} = fakePendingCopySequence([false, true]);
    vi.spyOn(clipboard, 'beginCopy').mockReturnValue(pending);
    const onCopied = vi.fn();
    const wrapper = mount(OptionsHost, {
      props: {options: {text: 'hello', attempts: 3, onCopied}},
    });

    await wrapper.get('button').trigger('click');
    expect(copy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(copy).toHaveBeenCalledTimes(2);
    expect(onCopied).toHaveBeenCalledTimes(1);
    expect(onCopied).toHaveBeenCalledWith(true);
    expect(destroy).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('attempts 次尝试均失败时回调 onCopied(false)', async () => {
    const {pending, copy, destroy} = fakePendingCopySequence([false]);
    vi.spyOn(clipboard, 'beginCopy').mockReturnValue(pending);
    const onCopied = vi.fn();
    const wrapper = mount(OptionsHost, {
      props: {options: {text: 'hello', attempts: 3, onCopied}},
    });

    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(2);
    expect(copy).toHaveBeenCalledTimes(3);
    expect(onCopied).toHaveBeenCalledTimes(1);
    expect(onCopied).toHaveBeenCalledWith(false);
    expect(destroy).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('attempts 上限为 50', async () => {
    const {pending, copy} = fakePendingCopySequence([false]);
    vi.spyOn(clipboard, 'beginCopy').mockReturnValue(pending);
    const onCopied = vi.fn();
    const wrapper = mount(OptionsHost, {
      props: {options: {text: 'hello', attempts: 100, onCopied}},
    });

    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(100);
    expect(copy).toHaveBeenCalledTimes(50);
    expect(onCopied).toHaveBeenCalledTimes(1);
    expect(onCopied).toHaveBeenCalledWith(false);

    wrapper.unmount();
  });

  it('绑定值响应式更新后复制最新文本', async () => {
    const copySpy = vi.spyOn(clipboard, 'copy').mockReturnValue(true);
    const wrapper = mount(StringHost, {props: {text: 'first'}});

    await wrapper.get('button').trigger('click');
    expect(copySpy).toHaveBeenLastCalledWith('first');

    await wrapper.setProps({text: 'second'});
    await wrapper.get('button').trigger('click');
    expect(copySpy).toHaveBeenLastCalledWith('second');

    wrapper.unmount();
  });

  it('对象中的 text 支持 Ref，点击时解包最新值', async () => {
    const text = ref('hello');
    const copySpy = vi.spyOn(clipboard, 'copy').mockReturnValue(true);
    const wrapper = mount(OptionsHost, {props: {options: {text, onCopied: vi.fn()}}});

    await wrapper.get('button').trigger('click');
    expect(copySpy).toHaveBeenCalledWith('hello');

    text.value = 'world';
    await wrapper.get('button').trigger('click');
    expect(copySpy).toHaveBeenCalledWith('world');

    wrapper.unmount();
  });

  it('卸载时销毁进行中的 PendingCopy 并停止重试', async () => {
    const {pending, copy, destroy} = fakePendingCopySequence([false]);
    vi.spyOn(clipboard, 'beginCopy').mockReturnValue(pending);
    const onCopied = vi.fn();
    const wrapper = mount(OptionsHost, {
      props: {options: {text: 'hello', attempts: 10, onCopied}},
    });

    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(2);
    expect(copy).toHaveBeenCalledTimes(3);

    wrapper.unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(onCopied).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(copy).toHaveBeenCalledTimes(3);
  });

  it('App 级 provide 的默认 attempts 生效', async () => {
    const {pending, copy} = fakePendingCopySequence([false, false, true]);
    vi.spyOn(clipboard, 'beginCopy').mockReturnValue(pending);
    const onCopied = vi.fn();
    const wrapper = mount(OptionsHost, {
      props: {options: {text: 'hello', onCopied}},
      global: {provide: {[CDK_COPY_TO_CLIPBOARD_CONFIG]: {attempts: 3}}},
    });

    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(2);
    expect(copy).toHaveBeenCalledTimes(3);
    expect(onCopied).toHaveBeenCalledWith(true);

    wrapper.unmount();
  });

  it('组件级 provide 的默认 attempts 生效', async () => {
    const {pending, copy} = fakePendingCopySequence([false, true]);
    vi.spyOn(clipboard, 'beginCopy').mockReturnValue(pending);
    const onCopied = vi.fn();
    const Child = defineComponent({
      directives: {copyToClipboard: vCopyToClipboard},
      props: {options: {type: Object as PropType<CopyToClipboardOptions>, required: true}},
      template: `<button v-copy-to-clipboard="options">复制</button>`,
    });
    const Parent = defineComponent({
      components: {Child},
      props: {options: {type: Object as PropType<CopyToClipboardOptions>, required: true}},
      setup() {
        provide(CDK_COPY_TO_CLIPBOARD_CONFIG, {attempts: 2});
      },
      template: `<Child :options="options" />`,
    });
    const wrapper = mount(Parent, {props: {options: {text: 'hello', onCopied}}});

    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(1);
    expect(copy).toHaveBeenCalledTimes(2);
    expect(onCopied).toHaveBeenCalledWith(true);

    wrapper.unmount();
  });
});
