import {afterEach, describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent, h, ref} from 'vue';
import {dispatchMouseEvent, mockRect} from '../../tests/helpers';
import {dropListRegistry} from './v-drop-list';
import {VDrag, type VDragPublicApi} from './v-drag';
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

function mockElementFromPoint(element: HTMLElement | null): void {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: () => element,
  });
}

function mountList(options: {props?: Record<string, unknown>} = {}) {
  const items = ref(['a', 'b', 'c']);
  const Wrapper = defineComponent({
    setup() {
      return () =>
        h(
          VDropList,
          {data: items.value, ...options.props} as never,
          {
            default: () =>
              items.value.map(item =>
                h(VDrag, {key: item, data: item, class: `drag-${item}`} as never, {default: () => h('div', item)}),
              ),
          },
        );
    },
  });
  const wrapper = mount(Wrapper);
  mockRect(wrapper.element, rect({top: 0, left: 0, width: 400, height: 400}));
  const dragItems = wrapper.findAll('.vcdk-drag');
  dragItems.forEach((item, index) => {
    mockRect(item.element, rect({top: index * 100, left: 0, width: 200, height: 100}));
  });
  return {wrapper, items, dragItems};
}

async function dragFirstItem(dragItems: ReturnType<typeof mountList>['dragItems']) {
  dispatchMouseEvent(dragItems[0].element, 'mousedown', {
    button: 0,
    buttons: 1,
    detail: 1,
    pageX: 100,
    pageY: 50,
    clientX: 100,
    clientY: 50,
  });
  dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 100, pageY: 150, clientX: 100, clientY: 150});
  dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 100, pageY: 150, clientX: 100, clientY: 150});
  dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 100, pageY: 150, clientX: 100, clientY: 150});
  await new Promise(resolve => setTimeout(resolve, 0));
}

afterEach(() => {
  dropListRegistry.clear();
  document.body.innerHTML = '';
});

describe('VDropList 排序拖拽', () => {
  it('dropped 载荷包含排序后的索引与实例', async () => {
    const {wrapper, dragItems} = mountList();
    await dragFirstItem(dragItems);

    const dropped = wrapper.findComponent(VDropList).emitted('dropped')![0][0] as {
      previousIndex: number;
      currentIndex: number;
      item: VDragPublicApi;
      container: unknown;
    };
    expect(dropped.previousIndex).toBe(0);
    expect(dropped.currentIndex).toBe(1);
    expect(dropped.item).toBeTruthy();
    expect((dropped.container as {id: string}).id).toBeTypeOf('string');
    expect((dropped.container as {dropListRef: unknown}).dropListRef).toBeTruthy();
    wrapper.unmount();
  });

  it('sortingDisabled 时不重排条目', async () => {
    const {wrapper, dragItems} = mountList({props: {sortingDisabled: true}});
    await dragFirstItem(dragItems);

    const dropped = wrapper.findComponent(VDropList).emitted('dropped')![0][0] as {
      previousIndex: number;
      currentIndex: number;
    };
    expect(dropped.currentIndex).toBe(0);
    wrapper.unmount();
  });

  it('disabled 时拖拽不启动', async () => {
    const {wrapper, dragItems} = mountList({props: {disabled: true}});
    await dragFirstItem(dragItems);
    expect(wrapper.findComponent(VDrag).emitted('started')).toBeUndefined();
    wrapper.unmount();
  });

  it('connectedTo 通过 id 连接跨容器拖拽', async () => {
    const itemsA = ref(['a1', 'a2']);
    const itemsB = ref(['b1']);
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h('div', null, [
            h(
              VDropList,
              {id: 'list-a', data: itemsA.value, connectedTo: ['list-b'], class: 'list-a'} as never,
              {
                default: () =>
                  itemsA.value.map(item =>
                    h(VDrag, {key: item, data: item, class: `drag-${item}`} as never, {default: () => h('div', item)}),
                  ),
              },
            ),
            h(
              VDropList,
              {id: 'list-b', data: itemsB.value, class: 'list-b'} as never,
              {
                default: () =>
                  itemsB.value.map(item =>
                    h(VDrag, {key: item, data: item, class: `drag-${item}`} as never, {default: () => h('div', item)}),
                  ),
              },
            ),
          ]);
      },
    });
    const wrapper = mount(Wrapper);
    const lists = wrapper.findAllComponents(VDropList);
    mockRect(lists[0].element, rect({top: 0, left: 0, width: 400, height: 400}));
    mockRect(lists[1].element, rect({top: 0, left: 500, width: 400, height: 400}));
    const dragA = lists[0].findAll('.vcdk-drag');
    dragA.forEach((item, index) => {
      mockRect(item.element, rect({top: index * 100, left: 0, width: 200, height: 100}));
    });
    mockElementFromPoint(lists[1].element);

    dispatchMouseEvent(dragA[0].element, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 100,
      pageY: 50,
      clientX: 100,
      clientY: 50,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 600, pageY: 100, clientX: 600, clientY: 100});
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 600, pageY: 100, clientX: 600, clientY: 100});
    dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 600, pageY: 100, clientX: 600, clientY: 100});
    await new Promise(resolve => setTimeout(resolve, 0));

    const dropped = lists[1].findComponent(VDropList).emitted('dropped')![0][0] as {
      previousIndex: number;
      previousContainer: unknown;
      container: unknown;
    };
    expect((dropped.previousContainer as {id: string}).id).toBe('list-a');
    expect((dropped.container as {id: string}).id).toBe('list-b');
    wrapper.unmount();
  });

  it('卸载后从静态注册表移除', () => {
    const {wrapper} = mountList({props: {id: 'custom-list'}});
    expect(Array.from(dropListRegistry).some(item => item.id === 'custom-list')).toBe(true);
    wrapper.unmount();
    expect(Array.from(dropListRegistry).some(item => item.id === 'custom-list')).toBe(false);
  });
});
