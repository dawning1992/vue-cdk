import {expect, expectTypeOf, it, vi} from 'vitest';
import {mount} from '@vue/test-utils';
import {h, ref, nextTick, defineComponent, onMounted, onUnmounted, provide, inject, reactive, type VNode} from 'vue';
import {TemplateRef, TemplatePortal, VPortal, DomPortalOutlet, type TemplateRefHandle} from './index';
import {createTestOverlay} from '../../tests/helpers';

it('捕获模板、传递上下文、追踪状态并随来源卸载失效', async () => {
  const count = ref(0);
  const source = ref<TemplateRefHandle | null>(null);
  const wrapper = mount({
    setup: () => () => h(TemplateRef, {ref: source}, {
      default: (context: {label?: string}) => h('button', {
        onClick: () => count.value++,
      }, `${context.label ?? '缺省'}:${count.value}`),
    }),
  });
  expect(wrapper.find('button').exists()).toBe(false);
  const host = document.createElement('div');
  const outlet = new DomPortalOutlet(host);
  const portal = new TemplatePortal(source.value!, {label: '首次'});
  portal.attach(outlet);
  expect(host.textContent).toBe('首次:0');
  host.querySelector('button')!.click();
  await nextTick();
  expect(host.textContent).toBe('首次:1');
  portal.detach();
  expect(host.textContent).toBe('');
  portal.attach(outlet, {label: '再次'});
  expect(host.textContent).toBe('再次:1');
  wrapper.unmount();
  expect(outlet.hasAttached()).toBe(false);
  expect(host.textContent).toBe('');
  expect(() => portal.attach(outlet)).toThrow('来源已卸载');
  outlet.dispose();
});


it('缺省插槽上下文为空对象，响应式上下文与覆盖遵循旧生命周期', async () => {
  const source = ref<TemplateRefHandle | null>(null);
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: source}, {
    default: ({label}: {label?: string}) => h('p', label ?? '空'),
  })});
  const outlet = new DomPortalOutlet(document.createElement('div'));
  const portal = new TemplatePortal(source.value!);
  const vnode = portal.attach(outlet);
  expect(vnode).toHaveProperty('component');
  expect(outlet.outletElement.textContent).toBe('空');
  outlet.detach();
  const context = reactive({label: '初始'});
  portal.attach(outlet, context);
  context.label = '更新';
  await nextTick();
  expect(outlet.outletElement.textContent).toBe('更新');
  outlet.detach();
  expect(portal.context).toBe(context);
  portal.attach(outlet, {label: '覆盖'});
  expect(outlet.outletElement.textContent).toBe('覆盖');
  portal.detach();
  expect(portal.context).toBeUndefined();
  outlet.dispose();
  wrapper.unmount();
});

it('独立挂载内容具有独立组件生命周期，卸载后停止更新', async () => {
  const mounted = vi.fn();
  const unmounted = vi.fn();
  const rendered = vi.fn();
  const count = ref(0);
  const Child = defineComponent({setup() {
    onMounted(mounted);
    onUnmounted(unmounted);
    return () => { rendered(); return h('p', String(count.value)); };
  }});
  const source = ref<TemplateRefHandle | null>(null);
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: source}, {default: () => h(Child)})});
  const a = new DomPortalOutlet(document.createElement('div'));
  const b = new DomPortalOutlet(document.createElement('div'));
  const first = new TemplatePortal(source.value!);
  const second = new TemplatePortal(source.value!);
  const av = first.attach(a) as VNode;
  const bv = second.attach(b) as VNode;
  expect(av).not.toBe(bv);
  expect(mounted).toHaveBeenCalledTimes(2);
  a.detach();
  b.dispose();
  expect(unmounted).toHaveBeenCalledTimes(2);
  const calls = rendered.mock.calls.length;
  count.value++;
  await nextTick();
  expect(rendered).toHaveBeenCalledTimes(calls);
  first.attach(a);
  expect(mounted).toHaveBeenCalledTimes(3);
  wrapper.unmount();
  expect(unmounted).toHaveBeenCalledTimes(3);
  a.dispose();
});

it('继承应用 provide，但不继承来源组件局部 provide', () => {
  const source = ref<TemplateRefHandle | null>(null);
  const Child = defineComponent({setup() {
    const value = inject('template-test', '缺省');
    return () => h('p', value);
  }});
  const wrapper = mount({setup() {
    provide('template-test', '局部');
    return () => h(TemplateRef, {ref: source}, {default: () => h(Child)});
  }}, {global: {provide: {'template-test': '应用'}}});
  const outlet = new DomPortalOutlet(document.createElement('div'));
  outlet.attach(new TemplatePortal(source.value!));
  expect(outlet.outletElement.textContent).toBe('应用');
  outlet.dispose();
  wrapper.unmount();
});

it('overlay 来源卸载清理完整生命周期且失效挂载可恢复', () => {
  const source = ref<TemplateRefHandle | null>(null);
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: source}, {default: () => h('p', '模板')})});
  const handle = source.value!;
  const overlay = createTestOverlay({hasBackdrop: true});
  const detached = vi.fn();
  overlay.detachments().subscribe(detached);
  overlay.attach(new TemplatePortal(handle));
  expect(overlay.hasAttached()).toBe(true);
  wrapper.unmount();
  expect(overlay.hasAttached()).toBe(false);
  expect(detached).toHaveBeenCalledTimes(1);
  expect(overlay.hostElement.isConnected).toBe(false);
  expect(() => overlay.attach(new TemplatePortal(handle))).toThrow('来源已卸载');
  expect(overlay.hasAttached()).toBe(false);
  overlay.attach(new TemplatePortal(() => h('p', '恢复')));
  expect(overlay.overlayElement.textContent).toBe('恢复');
  overlay.dispose();
});

it('渲染抛错时取消来源订阅并恢复出口，支持错误处理器接管', () => {
  const source = ref<TemplateRefHandle | null>(null);
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: source}, {
    default: () => { throw Error('模板错误'); },
  })});
  const outlet = new DomPortalOutlet(document.createElement('div'));
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const portal = new TemplatePortal(source.value!);
  expect(() => outlet.attach(portal)).toThrow('模板错误');
  expect(outlet.hasAttached()).toBe(false);
  expect(portal.isAttached).toBe(false);
  outlet.attach(new TemplatePortal(() => h('p', '恢复')));
  wrapper.unmount();
  expect(outlet.outletElement.textContent).toBe('恢复');
  outlet.dispose();
  warn.mockRestore();
});


it('VPortal 复用模板来源失效与响应式能力', async () => {
  const source = ref<{portal: TemplatePortal} | null>(null);
  const state = ref('初始');
  const wrapper = mount({setup: () => () => h(VPortal, {ref: source}, {default: () => h('p', state.value)})});
  const portal = source.value!.portal;
  const outlet = new DomPortalOutlet(document.createElement('div'));
  portal.attach(outlet);
  state.value = '更新';
  await nextTick();
  expect(outlet.outletElement.textContent).toBe('更新');
  wrapper.unmount();
  expect(outlet.hasAttached()).toBe(false);
  expect(() => portal.attach(outlet)).toThrow('来源已卸载');
  outlet.dispose();
});

it('空插槽返回空内容，dispose 后不能再次挂载', () => {
  const source = ref<TemplateRefHandle | null>(null);
  const wrapper = mount({setup: () => () => h(TemplateRef, {ref: source})});
  const outlet = new DomPortalOutlet(document.createElement('div'));
  const portal = new TemplatePortal(source.value!);
  portal.attach(outlet);
  expect(outlet.outletElement.textContent).toBe('');
  outlet.dispose();
  expect(() => portal.attach(outlet)).toThrow('已被销毁');
  expect(portal.isAttached).toBe(false);
  wrapper.unmount();
});


it('公开句柄可推导上下文类型并拒绝错误输入', () => {
  const handle = {} as TemplateRefHandle<{label: string}>;
  const portal = new TemplatePortal(handle);
  expectTypeOf(portal.context).toEqualTypeOf<{label: string} | undefined>();
  if (false) {
    // @ts-expect-error 上下文必须遵守句柄的公开类型契约。
    new TemplatePortal<{label: string}>(handle, {label: 1});
    // @ts-expect-error 组件定义不是已就绪的组件 ref 句柄。
    new TemplatePortal(TemplateRef);
  }
});
