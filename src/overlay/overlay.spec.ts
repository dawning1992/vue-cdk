import {describe, expect, it} from 'vitest';
import {createApp, defineComponent, h, nextTick, onUnmounted} from 'vue';
import {
  createOverlayRef,
  useOverlay,
} from './overlay';
import {OverlayConfig} from './overlay-config';

describe('useOverlay 命令式 API', () => {
  it('create 返回可用的 OverlayRef，内容渲染进容器', async () => {
    const overlay = useOverlay();
    const ref = overlay.create({
      positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
      panelClass: 'my-panel',
    });
    ref.attach(() => h('div', {class: 'imperative-content'}, '命令式内容'));
    await nextTick();
    expect(document.querySelector('.imperative-content')?.textContent).toBe('命令式内容');
    expect(ref.overlayElement.classList.contains('my-panel')).toBe(true);
    ref.dispose();
  });

  it('position() 提供全局与连接定位构建器', () => {
    const overlay = useOverlay();
    expect(overlay.position().global()).toBeTruthy();
    const origin = document.createElement('div');
    document.body.appendChild(origin);
    const flexible = overlay.position().flexibleConnectedTo(origin);
    expect(flexible.positions).toEqual([]);
    expect(() => flexible.withPositions([])).toThrow();
    origin.remove();
  });

  it('scrollStrategies 提供四种工厂', () => {
    const overlay = useOverlay();
    expect(overlay.scrollStrategies.noop()).toBeTruthy();
    expect(overlay.scrollStrategies.close({threshold: 10})).toBeTruthy();
    expect(overlay.scrollStrategies.block()).toBeTruthy();
    expect(overlay.scrollStrategies.reposition({scrollThrottle: 10})).toBeTruthy();
  });

  it('组件内调用 useOverlay 时渲染内容可访问 app provide', async () => {
    const ProvidedComp = defineComponent({
      inject: ['test-key'],
      setup() {
        return () => h('div', {class: 'provided-content'}, 'provided');
      },
    });
    const app = createApp({
      components: {
        Demo: defineComponent({
          setup() {
            const overlay = useOverlay();
            const ref = overlay.create({
              positionStrategy: overlay.position().global(),
            });
            ref.attach(() => h(ProvidedComp));
            onUnmounted(() => ref.dispose());
            return () => null;
          },
        }),
      },
      template: '<Demo />',
    });
    app.provide('test-key', 'value-123');
    const host = document.createElement('div');
    document.body.appendChild(host);
    app.mount(host);
    await nextTick();
    // 命令式内容渲染成功。
    expect(document.querySelector('.provided-content')?.textContent).toBe('provided');
    app.unmount();
    host.remove();
  });
});

describe('createOverlayRef 配置处理', () => {
  it('未指定 direction 时回退到 html 根元素的 dir', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const ref = createOverlayRef();
    expect(ref.getDirection()).toBe('rtl');
    ref.dispose();
  });

  it('环境不支持 Popover 时自动降级为容器渲染', () => {
    const ref = createOverlayRef({usePopover: true});
    expect(ref.hostElement.hasAttribute('popover')).toBe(false);
    expect(document.querySelector('.vcdk-overlay-container')!.contains(ref.hostElement)).toBe(true);
    ref.dispose();
  });

  it('OverlayConfig 复制配置并应用默认值', () => {
    const config = new OverlayConfig({hasBackdrop: true});
    expect(config.hasBackdrop).toBe(true);
    expect(config.scrollStrategy).toBeTruthy();
    expect(config.backdropClass).toBe('vcdk-overlay-dark-backdrop');
    expect(config.usePopover).toBe(true);
  });
});
