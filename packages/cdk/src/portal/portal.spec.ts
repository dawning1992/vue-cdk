import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  createApp,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  ref,
  type AppContext,
  type Component,
  type ComponentPublicInstance,
  type InjectionKey,
  type Ref,
} from 'vue';
import {mount} from '@vue/test-utils';
import {
  BasePortalOutlet,
  ComponentPortal,
  DomPortal,
  DomPortalOutlet,
  Portal,
  type PortalOutlet,
  TemplatePortal,
  VPortal,
  VPortalOutlet,
} from './index';

/** 注入令牌：验证 appContext 的 provide/inject 通道。 */
const TOKEN: InjectionKey<string> = Symbol('portal-test-token');

/** 测试用最小出口：不渲染真实内容，只记录分发到的 portal 与挂载引用。 */
class TestOutlet extends BasePortalOutlet {
  attachComponentPortal<T extends Component>(portal: ComponentPortal<T>): unknown {
    return {kind: 'component', portal};
  }

  attachTemplatePortal<C>(portal: TemplatePortal<C>): unknown {
    return {kind: 'template', portal};
  }

  attachDomPortal(portal: DomPortal): unknown {
    return {kind: 'dom', portal};
  }
}

/** 无法被识别的 Portal 子类，用于未知类型错误测试。 */
class FakePortal extends Portal<unknown> {}

/** 接收 props 并渲染文本的组件。 */
const PropsComponent = defineComponent({
  name: 'PropsComponent',
  props: {name: {type: String, required: true}},
  setup(props) {
    return () => h('p', {class: 'props-component'}, `hello ${props.name}`);
  },
});

/** 通过 inject 读取令牌的组件。 */
const InjectComponent = defineComponent({
  name: 'InjectComponent',
  setup() {
    const value = inject(TOKEN, 'fallback');
    return () => h('p', {class: 'inject-component'}, `injected: ${value}`);
  },
});

/** 捕获当前 app 上下文并暴露出去，供 DomPortalOutlet 构造使用。 */
function createAppWithProvide(provideValue: string): {
  app: ReturnType<typeof createApp>;
  appContext: AppContext;
  host: HTMLElement;
} {
  const host = document.createElement('div');
  document.body.appendChild(host);
  let appContext!: AppContext;
  const App = defineComponent({
    setup() {
      appContext = getCurrentInstance()!.appContext;
      return () => h('div', 'app');
    },
  });
  const app = createApp(App);
  // 应用级 provide 才会写入 appContext.provides，组件级 provide 只作用于组件子树。
  app.provide(TOKEN, provideValue);
  app.mount(host);
  return {app, appContext, host};
}

/** 卸载全部挂载过的应用，避免用例间 DOM/实例残留。 */
const mountedApps: ReturnType<typeof createApp>[] = [];
afterEach(() => {
  mountedApps.splice(0).forEach(app => app.unmount());
});

function track(app: ReturnType<typeof createApp>): ReturnType<typeof createApp> {
  mountedApps.push(app);
  return app;
}

describe('Portal 基类', () => {
  it('attach 后 isAttached 为 true，detach 后为 false 且出口恢复空闲', () => {
    const outlet = new TestOutlet();
    const portal = new TemplatePortal(() => h('p', 'x'));

    expect(portal.isAttached).toBe(false);
    const ref = portal.attach(outlet);

    expect(portal.isAttached).toBe(true);
    expect(outlet.hasAttached()).toBe(true);
    expect(ref).toEqual({kind: 'template', portal});

    portal.detach();
    expect(portal.isAttached).toBe(false);
    expect(outlet.hasAttached()).toBe(false);
  });

  it('重复 attach 到同一出口抛出「已挂载」错误', () => {
    const outlet = new TestOutlet();
    const first = new TemplatePortal(() => h('p', 'first'));
    const second = new TemplatePortal(() => h('p', 'second'));
    first.attach(outlet);

    expect(() => second.attach(outlet)).toThrowError(/出口已经挂载了一个 portal/);
    expect(first.isAttached).toBe(true);
  });

  it('同一 portal 重复 attach 抛出「已挂载」错误', () => {
    const outlet = new TestOutlet();
    const portal = new TemplatePortal(() => h('p', 'x'));
    portal.attach(outlet);

    expect(() => portal.attach(outlet)).toThrowError(/出口已经挂载了一个 portal/);
  });

  it('未挂载时 detach 抛出「未挂载」错误', () => {
    const portal = new TemplatePortal(() => h('p', 'x'));
    expect(() => portal.detach()).toThrowError(/尚未挂载到出口/);
  });

  it('attach 到 null 出口抛出「null 出口」错误', () => {
    const portal = new TemplatePortal(() => h('p', 'x'));
    expect(() => portal.attach(null as unknown as TestOutlet)).toThrowError(/null 的 PortalOutlet/);
  });

  it('setAttachedHost 直接维护宿主引用，绕过 attach/detach', () => {
    const outlet = new TestOutlet();
    const portal = new TemplatePortal(() => h('p', 'x'));

    portal.setAttachedHost(outlet);
    expect(portal.isAttached).toBe(true);

    portal.setAttachedHost(null);
    expect(portal.isAttached).toBe(false);
    expect(() => portal.detach()).toThrowError(/尚未挂载到出口/);
  });

  it('出口 detach 时同步清空 portal 的宿主引用', () => {
    const outlet = new TestOutlet();
    const portal = new TemplatePortal(() => h('p', 'x'));
    portal.attach(outlet);

    outlet.detach();
    expect(portal.isAttached).toBe(false);
  });
});

describe('BasePortalOutlet', () => {
  it('attach null 抛出「必须提供 portal」错误', () => {
    expect(() => new TestOutlet().attach(null as unknown as Portal<unknown>)).toThrowError(
      /必须提供一个 portal/,
    );
  });

  it('attach 未知 portal 类型抛出「未知类型」错误', () => {
    expect(() => new TestOutlet().attach(new FakePortal())).toThrowError(/未知的 Portal 类型/);
  });

  it('dispose 后再次 attach 抛出「已销毁」错误', () => {
    const outlet = new TestOutlet();
    outlet.dispose();

    expect(() => outlet.attach(new TemplatePortal(() => h('p', 'x')))).toThrowError(/已被销毁/);
  });

  it('dispose 会先卸载已挂载内容并执行一次性清理函数', () => {
    const outlet = new TestOutlet();
    const disposeSpy = vi.fn();
    outlet.setDisposeFn(disposeSpy);
    outlet.attach(new TemplatePortal(() => h('p', 'x')));

    outlet.dispose();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
    expect(outlet.hasAttached()).toBe(false);
    // 二次 dispose 幂等，不再重复执行清理。
    outlet.dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('ComponentPortal + DomPortalOutlet', () => {
  it('挂载组件并返回公共实例，props 生效', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const outlet = new DomPortalOutlet(host);
    const portal = new ComponentPortal(PropsComponent, {props: {name: 'Alice'}});

    const instance = portal.attach(outlet) as ComponentPublicInstance;

    expect(instance).toBeTruthy();
    expect(host.textContent).toContain('hello Alice');
    expect((instance.$props as {name: string}).name).toBe('Alice');
    expect(portal.isAttached).toBe(true);

    portal.detach();
    expect(host.innerHTML).toBe('');
    expect(portal.isAttached).toBe(false);
  });

  it('使用出口的 appContext 支持 provide/inject', () => {
    const {app, appContext, host: appHost} = createAppWithProvide('from-app');
    track(app);
    const outletEl = document.createElement('div');
    document.body.appendChild(outletEl);
    const outlet = new DomPortalOutlet(outletEl, {appContext});
    const portal = new ComponentPortal(InjectComponent);

    portal.attach(outlet);

    expect(outletEl.textContent).toContain('injected: from-app');
    expect(appHost.textContent).toContain('app');
  });

  it('portal 自带 appContext 优先于出口上下文', () => {
    const {app, appContext} = createAppWithProvide('from-app');
    track(app);
    const portalAppHost = document.createElement('div');
    document.body.appendChild(portalAppHost);
    let portalAppContext!: AppContext;
    const PortalApp = defineComponent({
      setup() {
        portalAppContext = getCurrentInstance()!.appContext;
        return () => h('div', 'portal-app');
      },
    });
    const portalApp = createApp(PortalApp);
    portalApp.provide(TOKEN, 'from-portal');
    track(portalApp);
    portalApp.mount(portalAppHost);

    const outletEl = document.createElement('div');
    document.body.appendChild(outletEl);
    const outlet = new DomPortalOutlet(outletEl, {appContext});
    const portal = new ComponentPortal(InjectComponent, {appContext: portalAppContext});

    portal.attach(outlet);

    expect(outletEl.textContent).toContain('injected: from-portal');
  });

  it('dispose 后出口不可再用，且 detach 幂等', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const outlet = new DomPortalOutlet(host);
    const portal = new ComponentPortal(PropsComponent, {props: {name: 'A'}});

    portal.attach(outlet);
    outlet.dispose();

    expect(host.parentNode).toBeNull();
    expect(() => outlet.attach(new ComponentPortal(PropsComponent, {props: {name: 'B'}}))).toThrowError(
      /已被销毁/,
    );
    // dispose 已卸载内容，重复 detach 无副作用。
    expect(() => outlet.detach()).not.toThrow();
  });

  it('重复挂载组件到同一出口抛出「已挂载」错误', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const outlet = new DomPortalOutlet(host);

    outlet.attach(new ComponentPortal(PropsComponent, {props: {name: 'A'}}));
    expect(() =>
      outlet.attach(new ComponentPortal(PropsComponent, {props: {name: 'B'}})),
    ).toThrowError(/出口已经挂载了一个 portal/);
  });
});

describe('TemplatePortal + DomPortalOutlet', () => {
  it('渲染函数接收上下文并输出内容', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const outlet = new DomPortalOutlet(host);
    const portal = new TemplatePortal<{msg: string}>(ctx => h('p', ctx.msg));

    portal.attach(outlet, {msg: 'hello'});

    expect(host.textContent).toContain('hello');
    expect(portal.context).toEqual({msg: 'hello'});
  });

  it('attach 传入的上下文优先于构造上下文，detach 清空上下文', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const outlet = new DomPortalOutlet(host);
    const portal = new TemplatePortal<{status: string} | undefined>(
      ctx => h('p', ctx?.status),
      {status: 'fresh'},
    );

    portal.attach(outlet, {status: 'rotten'});
    expect(host.textContent).toContain('rotten');

    portal.detach();
    expect(portal.context).toBeUndefined();

    // 重新挂载且不传上下文时按当前（已清空）上下文渲染。
    portal.attach(outlet);
    expect(portal.context).toBeUndefined();
    expect(host.textContent).toBe('');
  });

  it('支持多根与空渲染结果', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const outlet = new DomPortalOutlet(host);
    const multi = new TemplatePortal(() => [h('p', 'a'), h('p', 'b')]);
    const empty = new TemplatePortal(() => null);

    multi.attach(outlet);
    expect(host.querySelectorAll('p')).toHaveLength(2);

    outlet.detach();
    empty.attach(outlet);
    // 空 Fragment 可能留下注释占位节点，但不应产生元素内容。
    expect(host.childElementCount).toBe(0);
    expect(host.textContent).toBe('');
  });

  it('父级响应式状态变化可驱动已挂载内容更新', async () => {
    const state = ref('v1');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const outlet = new DomPortalOutlet(host);
    const portal = new TemplatePortal(() => h('p', state.value));

    portal.attach(outlet);
    expect(host.textContent).toContain('v1');

    state.value = 'v2';
    await nextTick();
    expect(host.textContent).toContain('v2');
  });

  it('模板内容可访问出口的 appContext provide 通道', () => {
    const {app, appContext} = createAppWithProvide('from-app');
    track(app);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const outlet = new DomPortalOutlet(host, {appContext});
    const portal = new TemplatePortal(() => h(InjectComponent));

    portal.attach(outlet);

    expect(host.textContent).toContain('injected: from-app');
  });
});

describe('DomPortal + DomPortalOutlet', () => {
  it('挂载时移动到出口，detach 时回到原父节点', () => {
    const originalParent = document.createElement('div');
    originalParent.className = 'original-parent';
    const element = document.createElement('div');
    element.className = 'dom-content';
    element.textContent = 'movable';
    originalParent.appendChild(element);
    document.body.appendChild(originalParent);

    const outletEl = document.createElement('div');
    outletEl.className = 'outlet';
    document.body.appendChild(outletEl);
    const outlet = new DomPortalOutlet(outletEl);
    const portal = new DomPortal(element);

    portal.attach(outlet);

    expect(element.parentNode).toBe(outletEl);
    expect(outletEl.textContent).toContain('movable');

    portal.detach();

    expect(element.parentNode).toBe(originalParent);
    expect(outletEl.textContent).toBe('');
  });

  it('无父节点的元素挂载时抛出错误', () => {
    const outletEl = document.createElement('div');
    document.body.appendChild(outletEl);
    const outlet = new DomPortalOutlet(outletEl);
    const portal = new DomPortal(document.createElement('div'));

    expect(() => portal.attach(outlet)).toThrowError(/必须挂载在父节点上/);
  });

  it('出口被外部清空后 detach 仍能把元素恢复到原位置', () => {
    const originalParent = document.createElement('div');
    const element = document.createElement('div');
    originalParent.appendChild(element);
    document.body.appendChild(originalParent);

    const outletEl = document.createElement('div');
    document.body.appendChild(outletEl);
    const outlet = new DomPortalOutlet(outletEl);
    const portal = new DomPortal(element);

    portal.attach(outlet);
    outletEl.innerHTML = '';

    expect(() => portal.detach()).not.toThrow();
    expect(element.parentNode).toBe(originalParent);
  });
});

describe('VPortal / VPortalOutlet（声明式）', () => {
  it('VPortal 捕获插槽为模板 Portal，可声明式挂载到 VPortalOutlet', async () => {
    const state = ref('v1');
    const activePortal: Ref<Portal<unknown> | null> = ref(null);
    const attachedPayloads: unknown[] = [];
    const wrapper = mount(
      defineComponent({
        components: {VPortal, VPortalOutlet},
        setup() {
          const source = ref<unknown>(null);
          const outlet = ref<unknown>(null);
          return {source, outlet, state, activePortal, attachedPayloads};
        },
        template: `
          <VPortal ref="source" v-slot="{data}">{{ state }} - {{ data }}</VPortal>
          <VPortalOutlet ref="outlet" :portal="activePortal" tag="section" @attached="attachedPayloads.push($event)" />
        `,
      }),
      {attachTo: document.body},
    );

    const vm = wrapper.vm as unknown as {
      source: {portal: Portal<unknown>};
      outlet: {
        attachedRef: unknown;
        hasAttached(): boolean;
      };
      activePortal: Portal<unknown> | null;
      attachedPayloads: unknown[];
    };

    vm.activePortal = vm.source.portal;
    await nextTick();

    // 未传上下文时插槽 props 为 undefined，渲染为空。
    expect(wrapper.find('section').text()).toContain('v1 -');
    expect(vm.outlet.hasAttached()).toBe(true);
    expect(vm.outlet.attachedRef).toBeTruthy();
    expect(vm.attachedPayloads).toHaveLength(1);

    wrapper.unmount();
  });

  it('插槽内容随父级响应式状态更新，attach 上下文进入插槽 props', async () => {
    const state = ref('v1');
    const wrapper = mount(
      defineComponent({
        components: {VPortal, VPortalOutlet},
        setup() {
          const source = ref<unknown>(null);
          const outlet = ref<unknown>(null);
          return {source, outlet, state};
        },
        template: `
          <VPortal ref="source" v-slot="{data}">{{ state }} - {{ data }}</VPortal>
          <VPortalOutlet ref="outlet" />
        `,
      }),
      {attachTo: document.body},
    );
    const vm = wrapper.vm as unknown as {
      source: {portal: TemplatePortal<unknown>};
      outlet: PortalOutlet;
      state: string;
    };

    // 直接以 attach 上下文方式传入插槽 props。
    vm.source.portal.attach(vm.outlet as unknown as PortalOutlet, {data: 'hello'});
    await nextTick();

    expect(wrapper.find('div').text()).toContain('v1 - hello');

    // 父级状态变化驱动已挂载内容更新。
    vm.state = 'v2';
    await nextTick();
    expect(wrapper.find('div').text()).toContain('v2 - hello');

    wrapper.unmount();
  });

  it('portal 置空时卸载内容，切换 portal 时先卸载旧内容再挂载新内容', async () => {
    const activePortal: Ref<Portal<unknown> | null> = ref(null);
    const attachedPayloads: unknown[] = [];
    const wrapper = mount(
      defineComponent({
        components: {VPortal, VPortalOutlet},
        setup() {
          const first = ref<unknown>(null);
          const second = ref<unknown>(null);
          const outlet = ref<unknown>(null);
          return {first, second, outlet, activePortal, attachedPayloads};
        },
        template: `
          <VPortal ref="first">first</VPortal>
          <VPortal ref="second">second</VPortal>
          <VPortalOutlet ref="outlet" :portal="activePortal" @attached="attachedPayloads.push($event)" />
        `,
      }),
      {attachTo: document.body},
    );
    const vm = wrapper.vm as unknown as {
      first: {portal: Portal<unknown>};
      second: {portal: Portal<unknown>};
      outlet: {attachedRef: unknown; hasAttached(): boolean};
      activePortal: Portal<unknown> | null;
      attachedPayloads: unknown[];
    };

    vm.activePortal = vm.first.portal;
    await nextTick();
    expect(wrapper.text()).toContain('first');
    expect(vm.attachedPayloads).toHaveLength(1);

    vm.activePortal = vm.second.portal;
    await nextTick();
    expect(wrapper.text()).toContain('second');
    expect(wrapper.text()).not.toContain('first');
    expect(vm.attachedPayloads).toHaveLength(2);

    vm.activePortal = null;
    await nextTick();
    expect(vm.outlet.hasAttached()).toBe(false);
    expect(vm.outlet.attachedRef).toBeNull();

    wrapper.unmount();
  });

  it('tag 属性控制宿主标签，attrs 透传到宿主元素', async () => {
    const activePortal: Ref<Portal<unknown> | null> = ref(null);
    const wrapper = mount(
      defineComponent({
        components: {VPortal, VPortalOutlet},
        setup() {
          const source = ref<unknown>(null);
          return {source, activePortal};
        },
        template: `
          <VPortal ref="source">content</VPortal>
          <VPortalOutlet ref="outlet" :portal="activePortal" tag="aside" class="portal-host" data-test="host" />
        `,
      }),
      {attachTo: document.body},
    );
    const vm = wrapper.vm as unknown as {
      source: {portal: Portal<unknown>};
      activePortal: Portal<unknown> | null;
    };

    vm.activePortal = vm.source.portal;
    await nextTick();

    const host = wrapper.find('aside.portal-host');
    expect(host.exists()).toBe(true);
    expect(host.attributes('data-test')).toBe('host');
    expect(host.text()).toContain('content');

    wrapper.unmount();
  });

  it('卸载 VPortalOutlet 时自动销毁出口并清空 portal 宿主', async () => {
    const activePortal: Ref<Portal<unknown> | null> = ref(null);
    const wrapper = mount(
      defineComponent({
        components: {VPortal, VPortalOutlet},
        setup() {
          const source = ref<unknown>(null);
          return {source, activePortal};
        },
        template: `
          <VPortal ref="source">content</VPortal>
          <VPortalOutlet :portal="activePortal" />
        `,
      }),
      {attachTo: document.body},
    );
    const vm = wrapper.vm as unknown as {
      source: {portal: Portal<unknown>};
      activePortal: Portal<unknown> | null;
    };

    const portal = vm.source.portal;
    vm.activePortal = portal;
    await nextTick();
    expect(portal.isAttached).toBe(true);

    // 卸载后模板 ref 会被清空，因此先持有 portal 引用再断言。
    wrapper.unmount();
    expect(portal.isAttached).toBe(false);
  });

  it('可通过 exposed 方法编程式挂载模板 Portal 并触发 attached 事件', async () => {
    const wrapper = mount(
      defineComponent({
        components: {VPortalOutlet},
        setup() {
          const outlet = ref<unknown>(null);
          const payloads: unknown[] = [];
          const onAttached = (attachedRef: unknown) => payloads.push(attachedRef);
          return {outlet, payloads, onAttached};
        },
        template: `<VPortalOutlet ref="outlet" @attached="onAttached" />`,
      }),
      {attachTo: document.body},
    );
    const outlet = (wrapper.vm as unknown as {outlet: {attachTemplatePortal(p: TemplatePortal): unknown}})
      .outlet;
    const portal = new TemplatePortal(() => h('p', 'programmatic'));

    outlet.attachTemplatePortal(portal);
    await nextTick();

    expect(wrapper.text()).toContain('programmatic');
    expect((wrapper.vm as unknown as {payloads: unknown[]}).payloads).toHaveLength(1);

    wrapper.unmount();
  });
});
