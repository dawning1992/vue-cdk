import {afterEach, describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {h} from 'vue';
import {dispatchMouseEvent, mockRect} from '../../tests/helpers';
import {VDrag} from './v-drag';
import {VDropList} from './v-drop-list';

function rect(partial: Partial<DOMRect>): DOMRect {
  const full: Record<string, number | (() => object)> = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
  Object.assign(full, partial);
  if (partial.right == null && partial.left != null && partial.width != null) {
    full.right = partial.left + partial.width;
  }
  if (partial.bottom == null && partial.top != null && partial.height != null) {
    full.bottom = partial.top + partial.height;
  }
  if (partial.x == null && partial.left != null) {
    full.x = partial.left;
  }
  if (partial.y == null && partial.top != null) {
    full.y = partial.top;
  }
  return full as unknown as DOMRect;
}

function dragTo(element: HTMLElement, from: {x: number; y: number}, to: {x: number; y: number}) {
  dispatchMouseEvent(element, 'mousedown', {
    button: 0,
    buttons: 1,
    detail: 1,
    pageX: from.x,
    pageY: from.y,
    clientX: from.x,
    clientY: from.y,
  });
  dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: to.x, pageY: to.y, clientX: to.x, clientY: to.y});
  dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: to.x, pageY: to.y, clientX: to.x, clientY: to.y});
  dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: to.x, pageY: to.y, clientX: to.x, clientY: to.y});
}

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('VDrag 自由拖拽', () => {
  it('拖拽时派发 started/ended/moved 并位移根元素', () => {
    const wrapper = mount(VDrag, {props: {data: 'item'}, attrs: {class: 'drag-root'}});
    mockRect(wrapper.element, rect({left: 50, top: 50, width: 100, height: 50}));

    dragTo(wrapper.element, {x: 100, y: 100}, {x: 130, y: 140});

    expect(wrapper.emitted('started')).toHaveLength(1);
    expect(wrapper.emitted('ended')).toHaveLength(1);
    expect(wrapper.emitted('moved')?.length).toBeGreaterThan(0);
    const ended = wrapper.emitted('ended')![0][0] as {distance: {x: number; y: number}};
    expect(ended.distance).toEqual({x: 30, y: 40});
    expect(wrapper.element.style.transform).toBe('translate3d(30px, 40px, 0)');
    wrapper.unmount();
  });

  it('disabled 时按下不启动拖拽', () => {
    const wrapper = mount(VDrag, {props: {disabled: true}});
    mockRect(wrapper.element, rect({left: 0, top: 0, width: 100, height: 50}));
    dragTo(wrapper.element, {x: 10, y: 10}, {x: 40, y: 40});
    expect(wrapper.emitted('started')).toBeUndefined();
    wrapper.unmount();
  });

  it('lockAxis 锁定对应轴', () => {
    const wrapper = mount(VDrag, {props: {lockAxis: 'y'}});
    mockRect(wrapper.element, rect({left: 0, top: 0, width: 100, height: 50}));
    dragTo(wrapper.element, {x: 10, y: 10}, {x: 40, y: 40});
    expect(wrapper.element.style.transform).toBe('translate3d(0px, 30px, 0)');
    wrapper.unmount();
  });

  it('#preview 插槽渲染到 body', async () => {
    const wrapper = mount(VDropList, {
      props: {data: ['a']},
      slots: {
        default: () =>
          h(
            VDrag,
            {data: 'my-data', class: 'drag-a'} as never,
            {
              default: () => h('div', 'a'),
              preview: (ctx: {data: unknown}) =>
                h('div', {class: 'custom-preview'}, String(ctx.data)),
            },
          ),
      },
    });
    mockRect(wrapper.element, rect({top: 0, left: 0, width: 400, height: 400}));
    const item = wrapper.find('.vcdk-drag');
    mockRect(item.element, rect({top: 0, left: 0, width: 200, height: 100}));

    dispatchMouseEvent(item.element, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 100,
      pageY: 50,
      clientX: 100,
      clientY: 50,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 120, pageY: 80, clientX: 120, clientY: 80});

    const preview = document.querySelector('.custom-preview');
    expect(preview).not.toBeNull();
    expect(preview!.textContent).toBe('my-data');
    expect(preview!.closest('.vcdk-drag-preview')).not.toBeNull();

    dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 120, pageY: 80, clientX: 120, clientY: 80});
    await flush();
    wrapper.unmount();
  });

  it('expose 提供 dragRef、getFreeDragPosition 与 reset', () => {
    const wrapper = mount(VDrag, {props: {data: 'item'}});
    mockRect(wrapper.element, rect({left: 0, top: 0, width: 100, height: 50}));
    const vm = wrapper.vm as unknown as {
      dragRef: unknown;
      setFreeDragPosition(value: {x: number; y: number}): void;
      getFreeDragPosition(): {x: number; y: number};
      reset(): void;
    };
    expect(vm.dragRef).toBeTruthy();
    vm.setFreeDragPosition({x: 20, y: 30});
    expect(vm.getFreeDragPosition()).toEqual({x: 20, y: 30});
    vm.reset();
    expect(vm.getFreeDragPosition()).toEqual({x: 0, y: 0});
    wrapper.unmount();
  });
});

describe('VDrag 容器内拖拽', () => {
  it('#placeholder 插槽在拖拽时替换条目', async () => {
    const wrapper = mount(VDropList, {
      props: {data: ['a', 'b']},
      slots: {
        default: () => [
          h(
            VDrag,
            {data: 'a', class: 'drag-a'} as never,
            {
              default: () => h('div', 'a'),
              placeholder: () => h('div', {class: 'custom-placeholder'}, 'placeholder-a'),
            },
          ),
          h(VDrag, {data: 'b', class: 'drag-b'} as never, {default: () => h('div', 'b')}),
        ],
      },
    });

    mockRect(wrapper.element, rect({top: 0, left: 0, width: 400, height: 400}));
    const items = wrapper.findAll('.vcdk-drag');
    mockRect(items[0].element, rect({top: 0, left: 0, width: 200, height: 100}));
    mockRect(items[1].element, rect({top: 100, left: 0, width: 200, height: 100}));

    dispatchMouseEvent(items[0].element, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 100,
      pageY: 50,
      clientX: 100,
      clientY: 50,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 100, pageY: 150, clientX: 100, clientY: 150});

    expect(wrapper.find('.custom-placeholder').exists()).toBe(true);
    expect(wrapper.find('.custom-placeholder').text()).toBe('placeholder-a');

    dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 100, pageY: 150, clientX: 100, clientY: 150});
    await flush();
    wrapper.unmount();
  });

  it('previewContainer=parent 时预览插入条目原父节点', async () => {
    const wrapper = mount(VDropList, {
      props: {data: ['a']},
      slots: {
        default: () =>
          h(
            VDrag,
            {data: 'a', previewContainer: 'parent'},
            {default: () => h('div', 'a')},
          ),
      },
    });
    mockRect(wrapper.element, rect({top: 0, left: 0, width: 400, height: 400}));
    const item = wrapper.find('.vcdk-drag');
    mockRect(item.element, rect({top: 0, left: 0, width: 200, height: 100}));

    dispatchMouseEvent(item.element, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 100,
      pageY: 50,
      clientX: 100,
      clientY: 50,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 120, pageY: 80, clientX: 120, clientY: 80});

    const preview = wrapper.element.querySelector('.vcdk-drag-preview');
    expect(preview).not.toBeNull();
    expect(preview!.parentElement).toBe(wrapper.element);

    dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 120, pageY: 80, clientX: 120, clientY: 80});
    await flush();
    wrapper.unmount();
  });
});
