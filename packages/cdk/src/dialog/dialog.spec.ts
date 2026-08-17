import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createApp, defineComponent, h, inject, nextTick, onUnmounted} from 'vue';
import {dialogService, useDialog} from './dialog';
import {DialogConfig} from './dialog-config';
import {
  DIALOG_DATA,
  DIALOG_REF,
  DEFAULT_DIALOG_CONFIG,
  useDialogData,
  useDialogRef,
} from './dialog-injectors';
import type {DialogRef} from './dialog-ref';
import {
  normalizeDialogContent,
  useDialogContainerCore,
  VDialogContainer,
  type VDialogContainerProps,
} from './dialog-container';
import {
  createKeyboardEvent,
  dispatchMouseEvent,
  flushPromises,
  mockViewport,
} from '../../tests/helpers';
import {scrollStrategies} from '../overlay/scroll/scroll-strategy-options';

/**
 * Dialog 模块测试。
 *
 * 用例间通过 afterEach 关闭全部对话框并依赖 tests/setup.ts 清理 DOM，
 * 保证 dialogService 单例的打开栈不跨用例残留。
 */
afterEach(() => {
  dialogService.closeAll();
});

/** 渲染简单文本内容，用于验证打开与关闭。 */
const SimpleContent = defineComponent({
  name: 'SimpleContent',
  setup() {
    return () => h('div', {class: 'simple-content'}, 'hello dialog');
  },
});

/** 通过 inject 通道读取 DIALOG_DATA 的内容组件。 */
const DataContent = defineComponent({
  name: 'DataContent',
  setup() {
    const data = useDialogData<{name: string}>();
    return () => h('div', {class: 'data-content'}, `hello ${data.name}`);
  },
});

/** 通过 props 通道读取 contentProps 的内容组件。 */
const PropsContent = defineComponent({
  name: 'PropsContent',
  props: {name: {type: String, required: true}},
  setup(props) {
    return () => h('div', {class: 'props-content'}, `hello ${props.name}`);
  },
});

/** 通过 useDialogRef 主动关闭对话框并返回结果的内容组件。 */
const SelfCloseContent = defineComponent({
  name: 'SelfCloseContent',
  setup() {
    const dialogRef = useDialogRef<string>();
    return () =>
      h('button', {class: 'self-close', onClick: () => dialogRef.close('self-closed')}, 'close');
  },
});

/** 暴露公开实例的内容组件，用于验证 componentInstance。 */
const ExposedContent = defineComponent({
  name: 'ExposedContent',
  setup(_props, {expose}) {
    // 运行时须通过 setup 上下文 expose（defineExpose 是编译宏，运行时无效果）。
    expose({answer: 42});
    return () => h('div', {class: 'exposed-content'}, 'exposed');
  },
});

/** 含可 Tab 元素的内容，默认 autoFocus 应聚焦到 input。 */
const FocusableContent = defineComponent({
  name: 'FocusableContent',
  setup() {
    return () =>
      h('div', [
        h('input', {class: 'first-input'}),
        h('button', {class: 'second-btn'}, 'second'),
      ]);
  },
});

/** 标题内容，autoFocus='first-heading' 应聚焦到 h2。 */
const HeadingContent = defineComponent({
  name: 'HeadingContent',
  setup() {
    return () => h('div', [h('h2', {class: 'dialog-title'}, '标题'), h('p', {}, '正文')]);
  },
});

/** 无可 Tab 元素的内容，默认 autoFocus 应回退聚焦对话框根元素。 */
const EmptyContent = defineComponent({
  name: 'EmptyContent',
  setup() {
    return () => h('div', {class: 'empty-content'}, 'no focusable');
  },
});

describe('Dialog 基本打开', () => {
  it('open 组件内容：渲染进 overlay 容器，根元素带 role=dialog', async () => {
    const ref = dialogService.open(SimpleContent);
    await nextTick();
    const container = document.querySelector('.vcdk-dialog-container')!;
    expect(container).toBeTruthy();
    expect(container.getAttribute('role')).toBe('dialog');
    expect(container.getAttribute('tabindex')).toBe('-1');
    expect(container.querySelector('.simple-content')?.textContent).toBe('hello dialog');
    expect(ref.overlayRef.hasAttached()).toBe(true);
  });

  it('open 渲染函数内容并注入 templateContext 与 $implicit/dialogRef', async () => {
    const data = {kind: 'template'};
    const ref = dialogService.open(
      (ctx: Record<string, unknown>) =>
        h(
          'div',
          {class: 'fn-content'},
          `${ctx.name}-${(ctx.$implicit as {kind: string}).kind}`,
        ),
      {data, templateContext: {name: 'Alice'}},
    );
    await nextTick();
    const text = document.querySelector('.fn-content')?.textContent;
    expect(text).toBe('Alice-template');
    // 渲染函数内容不产生组件实例，但上下文可访问 dialogRef。
    expect(ref.componentInstance).toBeNull();
  });

  it('open VNode 内容：原样渲染', async () => {
    const vnode = h('div', {class: 'vnode-content'}, 'vnode');
    dialogService.open(vnode);
    await nextTick();
    expect(document.querySelector('.vnode-content')?.textContent).toBe('vnode');
  });

  it('自动生成唯一 id，且 id 与 Angular 前缀一致', () => {
    const a = dialogService.open(SimpleContent);
    const b = dialogService.open(SimpleContent);
    expect(a.id).toMatch(/^cdk-dialog-/);
    expect(b.id).toMatch(/^cdk-dialog-/);
    expect(a.id).not.toBe(b.id);
  });

  it('支持自定义 id 并可用 getDialogById 查找', () => {
    const ref = dialogService.open(SimpleContent, {id: 'my-dialog'});
    expect(dialogService.getDialogById('my-dialog')).toBe(ref);
    expect(dialogService.getDialogById('missing')).toBeUndefined();
  });

  it('id 重复时抛出错误', () => {
    dialogService.open(SimpleContent, {id: 'dup'});
    expect(() => dialogService.open(SimpleContent, {id: 'dup'})).toThrow(/unique/i);
  });
});

describe('数据与引用通道', () => {
  it('inject 通道：内容组件可通过 useDialogData 读取 data', async () => {
    dialogService.open(DataContent, {data: {name: 'frodo'}});
    await nextTick();
    expect(document.querySelector('.data-content')?.textContent).toBe('hello frodo');
  });

  it('props 通道：内容组件通过 contentProps 接收 props', async () => {
    dialogService.open(PropsContent, {contentProps: {name: 'bilbo'}});
    await nextTick();
    expect(document.querySelector('.props-content')?.textContent).toBe('hello bilbo');
  });

  it('useDialogRef 在内容中可注入并用于关闭对话框', async () => {
    const ref = dialogService.open(SelfCloseContent);
    const results: Array<unknown> = [];
    ref.closed.subscribe(result => results.push(result));
    await nextTick();
    dispatchMouseEvent(document.querySelector('.self-close')!, 'click');
    expect(results).toEqual(['self-closed']);
    expect(ref.overlayRef.hasAttached()).toBe(false);
  });

  it('useDialogRef 在对话框内容之外调用时抛出错误', () => {
    const BadComponent = defineComponent({
      setup() {
        useDialogRef();
        return () => null;
      },
    });
    const app = createApp(BadComponent);
    const host = document.createElement('div');
    document.body.appendChild(host);
    expect(() => app.mount(host)).toThrow(/只能在对话框内容组件中调用/);
    app.unmount();
    host.remove();
  });

  it('DIALOG_DATA / DIALOG_REF 可直接用 inject 读取（与便捷函数等价）', async () => {
    const RawInjectContent = defineComponent({
      setup() {
        const data = inject(DIALOG_DATA) as {name: string};
        const dialogRef = inject(DIALOG_REF) as DialogRef;
        expect(dialogRef).toBeTruthy();
        return () => h('div', {class: 'raw-inject'}, `raw ${data.name}`);
      },
    });
    dialogService.open(RawInjectContent, {data: {name: 'gandalf'}});
    await nextTick();
    expect(document.querySelector('.raw-inject')?.textContent).toBe('raw gandalf');
  });

  it('useDialog 在组件内调用时，内容可访问 app 级 provide', async () => {
    const ProvidedContent = defineComponent({
      setup() {
        const appKey = inject('app-key');
        return () => h('div', {class: 'app-provided'}, String(appKey));
      },
    });
    const Host = defineComponent({
      setup() {
        const dialog = useDialog();
        dialog.open(ProvidedContent);
        return () => null;
      },
    });
    const app = createApp(Host);
    app.provide('app-key', 'app-value-123');
    const host = document.createElement('div');
    document.body.appendChild(host);
    app.mount(host);
    await nextTick();
    expect(document.querySelector('.app-provided')?.textContent).toBe('app-value-123');
    app.unmount();
    host.remove();
  });

  it('DEFAULT_DIALOG_CONFIG 注入作为默认配置生效，单次配置优先', async () => {
    const defaults = new DialogConfig({panelClass: 'from-defaults'});
    const Host = defineComponent({
      setup() {
        const dialog = useDialog();
        dialog.open(SimpleContent);
        dialog.open(SimpleContent, {panelClass: 'from-call'});
        return () => null;
      },
    });
    const app = createApp(Host);
    app.provide(DEFAULT_DIALOG_CONFIG, defaults);
    const host = document.createElement('div');
    document.body.appendChild(host);
    app.mount(host);
    await nextTick();
    const [first, second] = dialogService.openDialogs;
    expect(first.overlayRef.overlayElement.classList.contains('from-defaults')).toBe(true);
    expect(second.overlayRef.overlayElement.classList.contains('from-defaults')).toBe(false);
    expect(second.overlayRef.overlayElement.classList.contains('from-call')).toBe(true);
    app.unmount();
    host.remove();
  });
});

describe('DialogRef 生命周期', () => {
  it('close 返回结果，closed 只触发一次，之后订阅不再触发', () => {
    const ref = dialogService.open(SimpleContent);
    const results: Array<unknown> = [];
    ref.closed.subscribe(result => results.push(result));
    ref.close(7);
    ref.close(8);
    ref.closed.subscribe(result => results.push(result));
    expect(results).toEqual([7]);
    expect(ref.componentInstance).toBeNull();
    expect(ref.containerInstance).toBeNull();
    expect(dialogService.openDialogs).toHaveLength(0);
  });

  it('closedPromise 返回首次成功关闭的结果，且 open 仍返回 DialogRef', async () => {
    const ref = dialogService.open<number>(SimpleContent);
    expect(ref).not.toBeInstanceOf(Promise);
    expect(ref.close).toBeTypeOf('function');

    ref.close(7);
    ref.close(8);

    await expect(ref.closedPromise).resolves.toBe(7);
  });

  it('closedPromise 在无关闭结果时解析为 undefined', async () => {
    const ref = dialogService.open(SimpleContent);
    ref.close();
    await expect(ref.closedPromise).resolves.toBeUndefined();
  });

  it('closePredicate 拒绝关闭时不结算 closedPromise，成功关闭后才解析', async () => {
    let allowClose = false;
    let settled = false;
    const ref = dialogService.open<string>(SimpleContent, {
      closePredicate: () => allowClose,
    });
    void ref.closedPromise.then(() => {
      settled = true;
    });

    ref.close('blocked');
    await Promise.resolve();
    expect(settled).toBe(false);

    allowClose = true;
    ref.close('accepted');
    await expect(ref.closedPromise).resolves.toBe('accepted');
  });

  it('componentInstance 暴露内容组件的公开实例，渲染函数内容为 null', async () => {
    const ref = dialogService.open(ExposedContent);
    await nextTick();
    expect((ref.componentInstance as {answer: number} | null)?.answer).toBe(42);
    expect(ref.containerInstance?.element).toBe(document.querySelector('.vcdk-dialog-container'));
  });

  it('updatePosition / updateSize / addPanelClass / removePanelClass 均可用', async () => {
    const ref = dialogService.open(SimpleContent, {width: '300px', height: '200px'});
    expect(ref.overlayRef.overlayElement.style.width).toBe('300px');
    ref.updateSize(400, 500);
    expect(ref.overlayRef.overlayElement.style.width).toBe('400px');
    expect(ref.overlayRef.overlayElement.style.height).toBe('500px');
    ref.addPanelClass('panel-x');
    expect(ref.overlayRef.overlayElement.classList.contains('panel-x')).toBe(true);
    ref.removePanelClass('panel-x');
    expect(ref.overlayRef.overlayElement.classList.contains('panel-x')).toBe(false);
    expect(() => ref.updatePosition()).not.toThrow();
  });
});

describe('关闭行为', () => {
  it('ESC 关闭对话框并拦截默认行为', () => {
    const ref = dialogService.open(SimpleContent);
    const event = createKeyboardEvent('keydown', 27, {key: 'Escape'});
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(ref.overlayRef.hasAttached()).toBe(false);
    expect(dialogService.openDialogs).toHaveLength(0);
  });

  it('带修饰键的 ESC 不关闭对话框', () => {
    const ref = dialogService.open(SimpleContent);
    document.body.dispatchEvent(createKeyboardEvent('keydown', 27, {key: 'Escape', altKey: true}));
    expect(ref.overlayRef.hasAttached()).toBe(true);
  });

  it('遮罩点击关闭对话框并触发 backdropClick 事件流', () => {
    const ref = dialogService.open(SimpleContent);
    const clicks: MouseEvent[] = [];
    ref.backdropClick.subscribe(event => clicks.push(event));
    dispatchMouseEvent(document.querySelector('.vcdk-overlay-backdrop')!, 'click');
    expect(clicks).toHaveLength(1);
    expect(ref.overlayRef.hasAttached()).toBe(false);
  });

  it('keydownEvents / outsidePointerEvents 事件流可订阅', () => {
    const ref = dialogService.open(SimpleContent);
    const keydowns: KeyboardEvent[] = [];
    const outsideClicks: MouseEvent[] = [];
    ref.keydownEvents.subscribe(event => keydowns.push(event));
    ref.outsidePointerEvents.subscribe(event => outsideClicks.push(event));
    document.body.dispatchEvent(createKeyboardEvent('keydown', 65, {key: 'a'}));
    dispatchMouseEvent(document.body, 'click');
    expect(keydowns).toHaveLength(1);
    expect(outsideClicks).toHaveLength(1);
  });

  it('disableClose 阻止 ESC 与遮罩点击，运行时可更新后恢复关闭', () => {
    const ref = dialogService.open(SimpleContent, {disableClose: true});
    document.body.dispatchEvent(createKeyboardEvent('keydown', 27, {key: 'Escape'}));
    dispatchMouseEvent(document.querySelector('.vcdk-overlay-backdrop')!, 'click');
    expect(ref.overlayRef.hasAttached()).toBe(true);
    ref.disableClose = false;
    document.body.dispatchEvent(createKeyboardEvent('keydown', 27, {key: 'Escape'}));
    expect(ref.overlayRef.hasAttached()).toBe(false);
  });

  it('closePredicate 返回 false 时阻止 close / closeAll / ESC / 遮罩点击并重捕获焦点', async () => {
    let allowClose = false;
    const ref = dialogService.open(SimpleContent, {closePredicate: () => allowClose});
    ref.close('blocked');
    dialogService.closeAll();
    document.body.dispatchEvent(createKeyboardEvent('keydown', 27, {key: 'Escape'}));
    dispatchMouseEvent(document.querySelector('.vcdk-overlay-backdrop')!, 'click');
    expect(ref.overlayRef.hasAttached()).toBe(true);
    expect(dialogService.openDialogs).toHaveLength(1);
    // 放行关闭，保证 afterEach 清理时无残留对话框污染后续用例。
    allowClose = true;
  });

  it('closePredicate 按结果放行：满足条件时才允许关闭', () => {
    const ref = dialogService.open(SimpleContent, {
      closePredicate: result => result === 'ok',
    });
    ref.close('blocked');
    expect(ref.overlayRef.hasAttached()).toBe(true);
    ref.close('ok');
    expect(ref.overlayRef.hasAttached()).toBe(false);
  });

  it('closeAll 按后进先出关闭全部对话框', () => {
    const outer = dialogService.open(SimpleContent);
    const inner = dialogService.open(SimpleContent);
    dialogService.closeAll();
    expect(outer.overlayRef.hasAttached()).toBe(false);
    expect(inner.overlayRef.hasAttached()).toBe(false);
    expect(dialogService.openDialogs).toHaveLength(0);
  });

  it('嵌套对话框按 ESC 只关闭最上层', () => {
    const outer = dialogService.open(SimpleContent);
    const inner = dialogService.open(SimpleContent);
    document.body.dispatchEvent(createKeyboardEvent('keydown', 27, {key: 'Escape'}));
    expect(inner.overlayRef.hasAttached()).toBe(false);
    expect(outer.overlayRef.hasAttached()).toBe(true);
    expect(dialogService.openDialogs).toHaveLength(1);
  });

  it('closeOnNavigation：popstate / hashchange 触发关闭', () => {
    const ref = dialogService.open(SimpleContent);
    window.dispatchEvent(new Event('popstate'));
    expect(ref.overlayRef.hasAttached()).toBe(false);
    const second = dialogService.open(SimpleContent);
    window.dispatchEvent(new Event('hashchange'));
    expect(second.overlayRef.hasAttached()).toBe(false);
  });

  it('外部 detach 默认触发关闭；closeOnOverlayDetachments=false 时不关闭', () => {
    const ref = dialogService.open(SimpleContent);
    ref.overlayRef.detach();
    expect(ref.overlayRef.hasAttached()).toBe(false);
    expect(dialogService.openDialogs).toHaveLength(0);

    const kept = dialogService.open(SimpleContent, {closeOnOverlayDetachments: false});
    kept.overlayRef.detach();
    expect(dialogService.openDialogs).toHaveLength(1);
    kept.close();
  });

  it('afterOpened 在打开时触发；afterAllClosed 在最后一个关闭时触发', () => {
    const opened: DialogRef[] = [];
    const allClosed = vi.fn();
    dialogService.afterOpened.subscribe(ref => opened.push(ref));
    dialogService.afterAllClosed.subscribe(allClosed);
    // 订阅时无打开对话框，afterAllClosed 立即触发一次（对齐 Angular 语义）。
    expect(allClosed).toHaveBeenCalledTimes(1);
    const a = dialogService.open(SimpleContent);
    const b = dialogService.open(SimpleContent);
    expect(opened).toEqual([a, b]);
    expect(allClosed).toHaveBeenCalledTimes(1);
    b.close();
    expect(allClosed).toHaveBeenCalledTimes(1);
    a.close();
    expect(allClosed).toHaveBeenCalledTimes(2);
  });

  it('afterAllClosed 在无打开对话框时订阅立即触发', () => {
    const spy = vi.fn();
    dialogService.afterAllClosed.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('配置项', () => {
  it('width/height/min/max 应用到 overlay 面板', () => {
    dialogService.open(SimpleContent, {
      width: 300,
      height: '200px',
      minWidth: 100,
      minHeight: 80,
      maxWidth: '80vw',
      maxHeight: '90vh',
    });
    const style = dialogService.openDialogs[0]!.overlayRef.overlayElement.style;
    expect(style.width).toBe('300px');
    expect(style.height).toBe('200px');
    expect(style.minWidth).toBe('100px');
    expect(style.minHeight).toBe('80px');
    expect(style.maxWidth).toBe('80vw');
    expect(style.maxHeight).toBe('90vh');
  });

  it('panelClass / backdropClass / hasBackdrop=false 生效', () => {
    const ref = dialogService.open(SimpleContent, {
      panelClass: 'dialog-panel-custom',
      backdropClass: 'dialog-backdrop-custom',
    });
    expect(ref.overlayRef.overlayElement.classList.contains('dialog-panel-custom')).toBe(true);
    const backdrop = document.querySelector('.vcdk-overlay-backdrop')!;
    expect(backdrop.classList.contains('dialog-backdrop-custom')).toBe(true);
    // 未配置 backdropClass 时回退到 overlay 默认深色遮罩。
    ref.close();
    const noBackdrop = dialogService.open(SimpleContent, {hasBackdrop: false});
    expect(noBackdrop.overlayRef.backdropElement).toBeNull();
    expect(document.querySelector('.vcdk-overlay-backdrop')).toBeNull();
  });

  it('direction 应用到宿主元素', () => {
    const ref = dialogService.open(SimpleContent, {direction: 'rtl'});
    expect(ref.overlayRef.hostElement.getAttribute('dir')).toBe('rtl');
  });

  it('默认使用 block 滚动策略，打开时锁定页面滚动、关闭后恢复', () => {
    // jsdom 无真实滚动尺寸，模拟“页面可滚动”以触发滚动锁定。
    mockViewport(800, 600);
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollWidth', {
      value: 1000,
      configurable: true,
    });
    const ref = dialogService.open(SimpleContent);
    expect(document.documentElement.classList.contains('vcdk-overlay-global-scrollblock')).toBe(true);
    ref.close();
    expect(document.documentElement.classList.contains('vcdk-overlay-global-scrollblock')).toBe(false);
    delete (document.documentElement as {scrollHeight?: number}).scrollHeight;
    delete (document.documentElement as {scrollWidth?: number}).scrollWidth;
  });

  it('disableAnimations 时遮罩使用无动画类', () => {
    dialogService.open(SimpleContent, {disableAnimations: true});
    const backdrop = document.querySelector('.vcdk-overlay-backdrop')!;
    expect(backdrop.classList.contains('vcdk-overlay-backdrop-noop-animation')).toBe(true);
  });

  it('默认使用全局居中定位策略', () => {
    const ref = dialogService.open(SimpleContent);
    expect(ref.overlayRef.getConfig().positionStrategy).toBeTruthy();
  });

  it('可注入自定义滚动策略', () => {
    const ref = dialogService.open(SimpleContent, {scrollStrategy: scrollStrategies.noop()});
    expect(ref.overlayRef.hasAttached()).toBe(true);
  });
});

describe('焦点管理', () => {
  // jsdom 无真实几何信息，统一给元素模拟尺寸，保证可聚焦性判断成立。
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 100,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => 100,
    });
  });

  afterEach(() => {
    delete (HTMLElement.prototype as {offsetWidth?: unknown}).offsetWidth;
    delete (HTMLElement.prototype as {offsetHeight?: unknown}).offsetHeight;
  });

  it('默认 autoFocus 聚焦第一个可 Tab 元素', async () => {
    dialogService.open(FocusableContent);
    await flushPromises();
    expect(document.activeElement).toBe(document.querySelector('.first-input'));
  });

  it("autoFocus='dialog' 聚焦对话框根元素", async () => {
    dialogService.open(FocusableContent, {autoFocus: 'dialog'});
    await flushPromises();
    expect(document.activeElement).toBe(document.querySelector('.vcdk-dialog-container'));
  });

  it("autoFocus='first-heading' 聚焦第一个标题元素", async () => {
    dialogService.open(HeadingContent, {autoFocus: 'first-heading'});
    await flushPromises();
    expect(document.activeElement).toBe(document.querySelector('.dialog-title'));
  });

  it('autoFocus 为 CSS 选择器时聚焦匹配的第一个元素', async () => {
    const SelectorContent = defineComponent({
      setup() {
        return () => h('div', [h('p', {class: 'custom-focus'}, 'p'), h('button', {}, 'btn')]);
      },
    });
    dialogService.open(SelectorContent, {autoFocus: '.custom-focus'});
    await flushPromises();
    expect(document.activeElement).toBe(document.querySelector('.custom-focus'));
  });

  it('内容无可 Tab 元素时回退聚焦对话框根元素', async () => {
    dialogService.open(EmptyContent);
    await flushPromises();
    expect(document.activeElement).toBe(document.querySelector('.vcdk-dialog-container'));
  });

  it('restoreFocus 默认恢复打开前的聚焦元素', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'trigger';
    document.body.appendChild(trigger);
    trigger.focus();
    const ref = dialogService.open(EmptyContent);
    await flushPromises();
    expect(document.activeElement).toBe(document.querySelector('.vcdk-dialog-container'));
    ref.close();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('restoreFocus=false 时不恢复焦点', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const ref = dialogService.open(EmptyContent, {restoreFocus: false});
    await flushPromises();
    ref.close();
    expect(document.activeElement).not.toBe(trigger);
    trigger.remove();
  });

  it('restoreFocus 为选择器时恢复聚焦到匹配元素', async () => {
    const target = document.createElement('div');
    target.id = 'restore-target';
    target.tabIndex = -1;
    document.body.appendChild(target);
    const ref = dialogService.open(EmptyContent, {restoreFocus: '#restore-target'});
    await flushPromises();
    ref.close();
    expect(document.activeElement).toBe(target);
    target.remove();
  });

  it('restoreFocus 为元素时恢复聚焦到该元素', async () => {
    const target = document.createElement('button');
    document.body.appendChild(target);
    const ref = dialogService.open(EmptyContent, {restoreFocus: target});
    await flushPromises();
    ref.close();
    expect(document.activeElement).toBe(target);
    target.remove();
  });

  it('遮罩点击被阻止关闭时重捕获焦点到对话框内', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    let allowClose = false;
    const ref = dialogService.open(FocusableContent, {closePredicate: () => allowClose});
    await flushPromises();
    // 手动把焦点移出对话框后点击遮罩，焦点应被拉回第一个可 Tab 元素。
    trigger.focus();
    dispatchMouseEvent(document.querySelector('.vcdk-overlay-backdrop')!, 'click');
    expect(document.activeElement).toBe(document.querySelector('.first-input'));
    expect(ref.overlayRef.hasAttached()).toBe(true);
    // 放行关闭，保证 afterEach 清理时无残留对话框污染后续用例。
    allowClose = true;
    ref.close();
    trigger.remove();
  });
});

describe('无障碍', () => {
  it('role=alertdialog 与 aria-modal 生效', () => {
    dialogService.open(SimpleContent, {role: 'alertdialog', ariaModal: true});
    const container = document.querySelector('.vcdk-dialog-container')!;
    expect(container.getAttribute('role')).toBe('alertdialog');
    expect(container.getAttribute('aria-modal')).toBe('true');
  });

  it('ariaLabel / ariaDescribedBy 生效；配置 ariaLabel 时不设置 aria-labelledby', () => {
    dialogService.open(SimpleContent, {
      ariaLabel: '确认对话框',
      ariaDescribedBy: 'desc-id',
      ariaLabelledBy: 'label-id',
    });
    const container = document.querySelector('.vcdk-dialog-container')!;
    expect(container.getAttribute('aria-label')).toBe('确认对话框');
    expect(container.getAttribute('aria-describedby')).toBe('desc-id');
    expect(container.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('未配置 ariaLabel 时 ariaLabelledBy 生效', () => {
    dialogService.open(SimpleContent, {ariaLabelledBy: 'label-id'});
    const container = document.querySelector('.vcdk-dialog-container')!;
    expect(container.getAttribute('aria-labelledby')).toBe('label-id');
  });

  it('首个对话框打开时隐藏背景兄弟节点，全部关闭后恢复', () => {
    const sibling = document.createElement('div');
    sibling.id = 'background-sibling';
    document.body.appendChild(sibling);
    const ref = dialogService.open(SimpleContent);
    expect(sibling.getAttribute('aria-hidden')).toBe('true');
    ref.close();
    expect(sibling.hasAttribute('aria-hidden')).toBe(false);
    sibling.remove();
  });

  it('aria-live 节点不会被隐藏', () => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveRegion);
    dialogService.open(SimpleContent);
    expect(liveRegion.hasAttribute('aria-hidden')).toBe(false);
    liveRegion.remove();
  });
});

describe('自定义容器与高级场景', () => {
  it('config.container 使用自定义容器，默认焦点/注入行为仍可用', async () => {
    const CustomContainer = defineComponent({
      name: 'CustomContainer',
      props: {
        config: {type: Object, required: true},
        dialogRef: {type: Object, required: true},
        content: {type: [Object, Function], required: true},
        onContainerReady: {type: Function},
      },
      setup(props) {
        const {containerEl} = useDialogContainerCore(props as VDialogContainerProps);
        return () =>
          h('div', {ref: containerEl, class: 'custom-dialog-container'}, [
            h('div', {class: 'custom-header'}, '自定义容器标题'),
            normalizeDialogContent(
              props.content as never,
              props.config as DialogConfig,
              props.dialogRef as DialogRef,
            ),
          ]);
      },
    });
    const ref = dialogService.open(DataContent, {
      container: CustomContainer,
      data: {name: 'custom'},
    });
    await nextTick();
    expect(document.querySelector('.custom-header')?.textContent).toBe('自定义容器标题');
    expect(document.querySelector('.data-content')?.textContent).toBe('hello custom');
    expect(ref.containerInstance?.element?.classList.contains('custom-dialog-container')).toBe(
      true,
    );
  });

  it('自定义容器未暴露实例时抛出错误', () => {
    const BrokenContainer = defineComponent({
      props: {
        config: {type: Object, required: true},
        dialogRef: {type: Object, required: true},
        content: {type: [Object, Function], required: true},
      },
      setup() {
        return () => h('div', {class: 'broken-container'}, 'broken');
      },
    });
    expect(() => dialogService.open(SimpleContent, {container: BrokenContainer})).toThrow(
      /onContainerReady/,
    );
  });

  it('VDialogContainer 可作为自定义容器显式传入（默认容器）', async () => {
    const ref = dialogService.open(SimpleContent, {container: VDialogContainer});
    await nextTick();
    const container = document.querySelector('.vcdk-dialog-container')!;
    expect(container.classList.contains('vcdk-dialog-container')).toBe(true);
    expect(ref.containerInstance?.element).toBe(container);
  });

  it('遮罩关闭后对话框内容组件被卸载（容器 DOM 被移除）', async () => {
    const unmounted = vi.fn();
    const Content = defineComponent({
      setup() {
        onUnmounted(unmounted);
        return () => h('div', {}, 'content');
      },
    });
    const ref = dialogService.open(Content);
    await nextTick();
    ref.close();
    expect(unmounted).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.vcdk-dialog-container')).toBeNull();
  });
});
