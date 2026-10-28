import {afterEach, expect, it, vi} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent, h, inject, nextTick, ref, shallowRef} from 'vue';
import {TemplateRef, type TemplateRefHandle} from '../portal';
import {dialogService} from './dialog';
import type {DialogRef} from './dialog-ref';

afterEach(() => dialogService.closeAll());

it('直接打开模板句柄，合并上下文并保留响应式更新和关闭结果', async () => {
  const template = shallowRef<TemplateRefHandle<{
    $implicit: {name: string}; label: string; dialogRef: DialogRef<string>;
  }> | null>(null);
  const count = ref(0);
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: template}, {
    default: (context: {$implicit: {name: string}; label: string; dialogRef: DialogRef<string>}) =>
      h('button', {onClick: () => context.dialogRef.close('完成')},
        `${context.label}:${context.$implicit.name}:${count.value}`),
  })});
  const dialog = dialogService.open<string>(template.value!, {
    data: {name: '张三'}, templateContext: () => ({label: '计数'}),
  });
  expect(dialog.componentInstance).toBeNull();
  expect(dialog.overlayRef.overlayElement.textContent).toBe('计数:张三:0');
  count.value++;
  await nextTick();
  expect(dialog.overlayRef.overlayElement.textContent).toBe('计数:张三:1');
  dialog.overlayRef.overlayElement.querySelector('button')!.click();
  await expect(dialog.closedPromise).resolves.toBe('完成');
  const reopened = dialogService.open(template.value!, {
    data: {name: '李四'}, templateContext: {label: '再次'},
  });
  expect(reopened.overlayRef.overlayElement.textContent).toBe('再次:李四:1');
  wrapper.unmount();
  expect(dialogService.openDialogs).toHaveLength(0);
});

it('来源卸载同步关闭所有使用者，绕过关闭限制并拒绝再次打开失效句柄', async () => {
  const template = shallowRef<TemplateRefHandle | null>(null);
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: template}, {
    default: () => h('p', '模板内容'),
  })});
  const handle = template.value!;
  const leave = vi.fn(() => new Promise<void>(() => undefined));
  const predicate = vi.fn(() => false);
  const first = dialogService.open(handle, {
    closePredicate: predicate, disableClose: true, closeOnOverlayDetachments: false,
    animation: {enter: () => undefined, leave},
  });
  const second = dialogService.open(handle);
  const closed = vi.fn();
  first.closed.subscribe(closed);
  wrapper.unmount();
  expect(dialogService.openDialogs).toHaveLength(0);
  expect(document.querySelector('.vcdk-dialog-container')).toBeNull();
  expect(first.overlayRef.hostElement.isConnected).toBe(false);
  expect(second.overlayRef.hostElement.isConnected).toBe(false);
  expect(predicate).not.toHaveBeenCalled();
  expect(leave).not.toHaveBeenCalled();
  expect(closed).toHaveBeenCalledTimes(1);
  await expect(first.closedPromise).resolves.toBeUndefined();
  expect(() => dialogService.open(handle)).toThrow('来源已卸载');
  expect(document.querySelector('.vcdk-dialog-container')).toBeNull();
});

it('模板继承来源应用注入；关闭及挂载失败均取消来源订阅', () => {
  const template = shallowRef<TemplateRefHandle | null>(null);
  const Child = defineComponent({setup() {
    const value = inject('template-app');
    return () => h('p', String(value));
  }});
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: template}, {
    default: () => h(Child),
  })}, {global: {provide: {'template-app': '来源应用'}}});
  const unsubscribe = vi.fn();
  const original = template.value!;
  const handle: TemplateRefHandle = {
    ...original,
    subscribe: callback => {
      const stop = original.subscribe(callback);
      return () => { unsubscribe(); stop(); };
    },
  };
  const dialog = dialogService.open(handle);
  expect(dialog.overlayRef.overlayElement.textContent).toBe('来源应用');
  dialog.close();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  const broken = defineComponent({setup: () => () => h('div')});
  expect(() => dialogService.open(handle, {container: broken})).toThrow('onContainerReady');
  expect(unsubscribe).toHaveBeenCalledTimes(2);
  wrapper.unmount();
});

it('来源在退场中卸载时立即清理，并保留已经接受的关闭结果', async () => {
  const template = shallowRef<TemplateRefHandle | null>(null);
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: template}, {
    default: () => h('p', '退场内容'),
  })});
  const dialog = dialogService.open<string>(template.value!, {
    animation: {leave: () => new Promise<void>(() => undefined)},
  });
  dialog.close('已确认');
  wrapper.unmount();
  await expect(dialog.closedPromise).resolves.toBe('已确认');
  expect(dialogService.openDialogs).toHaveLength(0);
});
