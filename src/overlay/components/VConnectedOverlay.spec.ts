import {describe, expect, it, vi} from 'vitest';
import {defineComponent, ref} from 'vue';
import {mount} from '@vue/test-utils';
import {VConnectedOverlay} from './VConnectedOverlay';
import {VOverlayOrigin} from './VOverlayOrigin';
import {STANDARD_DROPDOWN_BELOW_POSITIONS} from '../position/flexible-connected-position-strategy';

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('VConnectedOverlay 声明式 API', () => {
  it('open 为 true 时渲染面板内容到容器，false 时卸载', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button>触发</button>
          <VConnectedOverlay :open="open" :positions="positions">
            <div class="panel-content">菜单项</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
      data: () => ({positions: STANDARD_DROPDOWN_BELOW_POSITIONS}),
    });

    const wrapper = mount(Wrapper, {props: {open: false}});
    expect(document.querySelector('.panel-content')).toBeNull();

    await wrapper.setProps({open: true});
    await flush();
    const container = document.querySelector('.vcdk-overlay-container')!;
    expect(container).not.toBeNull();
    expect(container.querySelector('.panel-content')?.textContent).toBe('菜单项');

    await wrapper.setProps({open: false});
    await flush();
    expect(document.querySelector('.panel-content')).toBeNull();
    wrapper.unmount();
  });

  it('随 open 变化派发 attach/detach 事件', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button>触发</button>
          <VConnectedOverlay :open="open" @attach="onAttach" @detach="onDetach">
            <div>内容</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
      methods: {
        onAttach() {},
        onDetach() {},
      },
    });
    const wrapper = mount(Wrapper, {props: {open: false}});
    await wrapper.setProps({open: true});
    await flush();
    const overlay = wrapper.findComponent(VConnectedOverlay);
    expect(overlay.emitted('attach')).toBeTruthy();
    await wrapper.setProps({open: false});
    await flush();
    expect(overlay.emitted('detach')).toBeTruthy();
    wrapper.unmount();
  });

  it('hasBackdrop 时点击遮罩派发 backdropClick', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button>触发</button>
          <VConnectedOverlay :open="open" has-backdrop @backdrop-click="() => 0">
            <div>内容</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
    });
    const wrapper = mount(Wrapper, {props: {open: true}});
    await flush();
    const backdrop = document.querySelector('.vcdk-overlay-backdrop')!;
    expect(backdrop).not.toBeNull();
    backdrop.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(wrapper.findComponent(VConnectedOverlay).emitted('backdropClick')).toBeTruthy();
    wrapper.unmount();
  });

  it('ESC 键关闭 overlay 并派发 update:open=false', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button>触发</button>
          <VConnectedOverlay :open="open">
            <div class="esc-content">内容</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
    });
    const wrapper = mount(Wrapper, {props: {open: true}});
    await flush();
    expect(document.querySelector('.esc-content')).not.toBeNull();
    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    await flush();
    const overlay = wrapper.findComponent(VConnectedOverlay);
    expect(overlay.emitted('overlayKeydown')).toBeTruthy();
    expect(overlay.emitted('update:open')).toEqual([[false]]);
    expect(document.querySelector('.esc-content')).toBeNull();
    wrapper.unmount();
  });

  it('disableClose 时 ESC 只派发事件不关闭', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button>触发</button>
          <VConnectedOverlay :open="open" disable-close>
            <div class="keep-content">内容</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
    });
    const wrapper = mount(Wrapper, {props: {open: true}});
    await flush();
    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    await flush();
    expect(wrapper.findComponent(VConnectedOverlay).emitted('update:open')).toBeFalsy();
    expect(document.querySelector('.keep-content')).not.toBeNull();
    wrapper.unmount();
  });

  it('点击面板外部派发 overlayOutsideClick', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button>触发</button>
          <VConnectedOverlay :open="open">
            <div>内容</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
    });
    const wrapper = mount(Wrapper, {props: {open: true}});
    await flush();
    document.body.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(wrapper.findComponent(VConnectedOverlay).emitted('overlayOutsideClick')).toBeTruthy();
    wrapper.unmount();
  });

  it('点击共享 origin 内的其他触发按钮不会派发 overlayOutsideClick', async () => {
    const Wrapper = defineComponent({
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button class="trigger-a">第一层</button>
          <button class="trigger-b">第二层</button>
          <VConnectedOverlay :open="true">
            <div>第一层面板</div>
          </VConnectedOverlay>
          <VConnectedOverlay :open="true">
            <div>第二层面板</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
    });
    const wrapper = mount(Wrapper);
    await flush();
    const overlays = wrapper.findAllComponents(VConnectedOverlay);

    // 点击另一个触发按钮：目标位于共享 origin 内部，两个 overlay 都不应视为外部点击。
    const triggerB = wrapper.get('button.trigger-b');
    triggerB.element.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    triggerB.element.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(overlays[0].emitted('overlayOutsideClick')).toBeFalsy();
    expect(overlays[1].emitted('overlayOutsideClick')).toBeFalsy();

    // 点击 origin 外部：两个 overlay 都应收到外部点击。
    document.body.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}));
    document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(overlays[0].emitted('overlayOutsideClick')).toHaveLength(1);
    expect(overlays[1].emitted('overlayOutsideClick')).toHaveLength(1);
    wrapper.unmount();
  });

  it('打开后派发 positionChange', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button>触发</button>
          <VConnectedOverlay :open="open">
            <div>内容</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
    });
    const wrapper = mount(Wrapper, {props: {open: true}});
    await flush();
    expect(wrapper.findComponent(VConnectedOverlay).emitted('positionChange')).toBeTruthy();
    wrapper.unmount();
  });

  it('matchWidth 使面板宽度与 origin 一致', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      setup() {
        const origin = ref<HTMLElement | null>(null);
        return {origin};
      },
      template: `
        <VOverlayOrigin ref="origin" tag="span">
          <button>触发</button>
        </VOverlayOrigin>
        <VConnectedOverlay :open="open" :origin="origin?.element" match-width>
          <div>内容</div>
        </VConnectedOverlay>
      `,
    });
    const wrapper = mount(Wrapper, {props: {open: true}});
    await flush();
    // origin 是 VOverlayOrigin 渲染的包装元素（span）。
    const originElement = wrapper.find('.vcdk-overlay-origin').element;
    vi.spyOn(originElement, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 30,
      width: 200,
      height: 30,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    await wrapper.setProps({open: false});
    await wrapper.setProps({open: true});
    await flush();
    const pane = document.querySelector('.vcdk-overlay-pane') as HTMLElement;
    expect(pane.style.width).toBe('200px');
    wrapper.unmount();
  });

  it('缺少 origin 时打开会抛错', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VConnectedOverlay},
      template: `<VConnectedOverlay :open="open"><div>内容</div></VConnectedOverlay>`,
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wrapper = mount(Wrapper, {props: {open: false}});
    await wrapper.setProps({open: true});
    await flush();
    expect(errorSpy).toHaveBeenCalled();
    wrapper.unmount();
    errorSpy.mockRestore();
  });

  it('组件卸载时销毁 overlay', async () => {
    const Wrapper = defineComponent({
      props: {open: Boolean},
      components: {VOverlayOrigin, VConnectedOverlay},
      template: `
        <VOverlayOrigin>
          <button>触发</button>
          <VConnectedOverlay :open="open">
            <div class="unmount-content">内容</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      `,
    });
    const wrapper = mount(Wrapper, {props: {open: true}});
    await flush();
    expect(document.querySelector('.unmount-content')).not.toBeNull();
    wrapper.unmount();
    await flush();
    expect(document.querySelector('.unmount-content')).toBeNull();
  });
});
