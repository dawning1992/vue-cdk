import {mount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {defineComponent, nextTick, ref} from 'vue';
import {TextareaAutosize, useTextareaAutosize} from './autosize';
import {vTextareaAutosize} from './v-textarea-autosize';

function createTextarea(scrollHeight = 44, clientHeight = 20): HTMLTextAreaElement {
  const textarea = document.createElement('textarea');
  Object.defineProperty(textarea, 'scrollHeight', {configurable: true, get: () => scrollHeight});
  Object.defineProperty(textarea, 'clientHeight', {configurable: true, get: () => clientHeight});
  document.body.appendChild(textarea);
  return textarea;
}

beforeEach(() => {
  const original = HTMLTextAreaElement.prototype.cloneNode;
  vi.spyOn(HTMLTextAreaElement.prototype, 'cloneNode').mockImplementation(function (this: HTMLTextAreaElement) {
    const clone = original.call(this, false) as HTMLTextAreaElement;
    Object.defineProperty(clone, 'clientHeight', {configurable: true, value: 20});
    return clone;
  });
});

afterEach(() => vi.restoreAllMocks());

describe('TextareaAutosize', () => {
  it('初始化时安装类名、单行 rows 并按 scrollHeight 设置高度', () => {
    const textarea = createTextarea();
    const controller = new TextareaAutosize(textarea);
    expect(textarea.classList).toContain('cdk-textarea-autosize');
    expect(textarea.rows).toBe(1);
    expect(textarea.style.height).toBe('40px');
    controller.destroy();
  });

  it('border-box 宿主补回垂直 padding 与 border，单行文字不会被裁切', () => {
    const textarea = createTextarea();
    textarea.style.boxSizing = 'border-box';
    textarea.style.padding = '6px 4px';
    textarea.style.borderTop = '2px solid';
    textarea.style.borderBottom = '3px solid';
    const controller = new TextareaAutosize(textarea);
    expect(textarea.style.height).toBe('57px');
    controller.minRows = 2;
    controller.maxRows = 5;
    expect(textarea.style.minHeight).toBe('57px');
    expect(textarea.style.maxHeight).toBe('117px');
    controller.destroy();
  });

  it('测量内容时不受 minRows/maxRows 约束污染，并在测量后恢复约束', () => {
    const textarea = createTextarea();
    const controller = new TextareaAutosize(textarea);
    controller.minRows = 2;
    controller.maxRows = 5;
    controller.resizeToFitContent(true);
    expect(textarea.style.height).toBe('40px');
    expect(textarea.style.minHeight).toBe('40px');
    expect(textarea.style.maxHeight).toBe('100px');
    controller.destroy();
  });

  it('内容变化后 input 触发重算，内容不变时跳过测量', () => {
    const textarea = createTextarea();
    const controller = new TextareaAutosize(textarea);
    const classSpy = vi.spyOn(textarea.classList, 'add');
    textarea.value = 'new value';
    textarea.dispatchEvent(new Event('input'));
    expect(classSpy).toHaveBeenCalledWith('cdk-textarea-autosize-measuring');
    classSpy.mockClear();
    textarea.dispatchEvent(new Event('input'));
    expect(classSpy).not.toHaveBeenCalled();
    controller.destroy();
  });

  it('中文输入法组合输入期间暂停测量，并在 compositionend 后统一重算', () => {
    const textarea = createTextarea();
    const controller = new TextareaAutosize(textarea);
    const classSpy = vi.spyOn(textarea.classList, 'add');
    textarea.dispatchEvent(new CompositionEvent('compositionstart', {data: ''}));
    textarea.value = 'zhong';
    textarea.dispatchEvent(new InputEvent('input', {data: 'zhong', isComposing: true}));
    textarea.value = '中文';
    textarea.dispatchEvent(new InputEvent('input', {data: '中文', isComposing: true}));
    expect(classSpy).not.toHaveBeenCalledWith('cdk-textarea-autosize-measuring');

    textarea.dispatchEvent(new CompositionEvent('compositionend', {data: '中文'}));
    expect(classSpy).toHaveBeenCalledTimes(1);
    expect(classSpy).toHaveBeenCalledWith('cdk-textarea-autosize-measuring');
    controller.destroy();
  });

  it('输入法组合被 blur 中断时执行兜底重算', () => {
    const textarea = createTextarea();
    const controller = new TextareaAutosize(textarea);
    const classSpy = vi.spyOn(textarea.classList, 'add');
    textarea.dispatchEvent(new CompositionEvent('compositionstart'));
    textarea.value = '拼音';
    textarea.dispatchEvent(new Event('blur'));
    expect(classSpy).toHaveBeenCalledWith('cdk-textarea-autosize-measuring');
    controller.destroy();
  });

  it('minRows/maxRows 根据单行克隆高度生成约束', () => {
    const textarea = createTextarea();
    const controller = new TextareaAutosize(textarea);
    controller.minRows = 2;
    controller.maxRows = 5;
    expect(textarea.style.minHeight).toBe('40px');
    expect(textarea.style.maxHeight).toBe('100px');
    controller.destroy();
  });

  it('placeholder 高度大于内容时采用 placeholder 高度', () => {
    let height = 24;
    const textarea = createTextarea();
    Object.defineProperty(textarea, 'scrollHeight', {configurable: true, get: () => height});
    const controller = new TextareaAutosize(textarea);
    height = 84;
    controller.setPlaceholder('多行占位文本');
    expect(textarea.style.height).toBe('80px');
    controller.destroy();
  });

  it('关闭时恢复初始高度，重新开启后再次测量', () => {
    const textarea = createTextarea();
    textarea.style.height = '12px';
    const controller = new TextareaAutosize(textarea);
    controller.enabled = false;
    expect(textarea.style.height).toBe('12px');
    controller.enabled = true;
    expect(textarea.style.height).toBe('40px');
    controller.destroy();
  });

  it('destroy 恢复初始样式并移除监听器，且可重复调用', () => {
    const textarea = createTextarea();
    textarea.rows = 3;
    textarea.style.height = '30px';
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const controller = new TextareaAutosize(textarea);
    controller.destroy();
    controller.destroy();
    expect(textarea.rows).toBe(3);
    expect(textarea.style.height).toBe('30px');
    expect(textarea.classList).not.toContain('cdk-textarea-autosize');
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('非 textarea 宿主抛出明确错误', () => {
    expect(() => new TextareaAutosize(document.createElement('input') as never)).toThrow(TypeError);
  });
});

describe('Vue 入口', () => {
  it('useTextareaAutosize 响应配置并在卸载时销毁', async () => {
    const Host = defineComponent({
      setup() {
        const target = ref<HTMLTextAreaElement | null>(null);
        const minRows = ref(2);
        const api = useTextareaAutosize(target, {minRows});
        return {target, minRows, api};
      },
      template: '<textarea ref="target" />',
    });
    const wrapper = mount(Host, {attachTo: document.body});
    await nextTick();
    const controller = wrapper.vm.api.controller.value!;
    expect(controller.minRows).toBe(2);
    wrapper.vm.minRows = 4;
    await nextTick();
    expect(controller.minRows).toBe(4);
    const destroySpy = vi.spyOn(controller, 'destroy');
    wrapper.unmount();
    expect(destroySpy).toHaveBeenCalled();
  });

  it('vTextareaAutosize 更新配置并通过 onReady 暴露控制器', async () => {
    const ready = vi.fn();
    const Host = defineComponent({
      directives: {textareaAutosize: vTextareaAutosize},
      props: {rows: {type: Number, required: true}},
      setup: () => ({ready}),
      template: '<textarea v-textarea-autosize="{minRows: rows, onReady: ready}" />',
    });
    const wrapper = mount(Host, {props: {rows: 2}, attachTo: document.body});
    expect(ready).toHaveBeenCalledTimes(1);
    expect(ready.mock.calls[0][0].minRows).toBe(2);
    await wrapper.setProps({rows: 4});
    expect(ready.mock.calls[0][0].minRows).toBe(4);
    wrapper.unmount();
  });
});
