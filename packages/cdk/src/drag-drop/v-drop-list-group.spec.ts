import {afterEach, describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent, h, ref} from 'vue';
import {dispatchMouseEvent, mockRect} from '../../tests/helpers';
import {dropListRegistry} from './v-drop-list';
import {VDrag} from './v-drag';
import {VDropList} from './v-drop-list';
import {VDropListGroup} from './v-drop-list-group';

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

function mountGroup(options: {groupDisabled?: boolean} = {}) {
  const itemsA = ref(['a1', 'a2']);
  const itemsB = ref(['b1']);
  const Wrapper = defineComponent({
    setup() {
      return () =>
        h(VDropListGroup, {disabled: options.groupDisabled}, {
          default: () => [
            h(
              VDropList,
              {data: itemsA.value, class: 'list-a'} as never,
              {
                default: () =>
                  itemsA.value.map(item =>
                    h(VDrag, {key: item, data: item, class: `drag-${item}`} as never, {default: () => h('div', item)}),
                  ),
              },
            ),
            h(
              VDropList,
              {data: itemsB.value, class: 'list-b'} as never,
              {
                default: () =>
                  itemsB.value.map(item =>
                    h(VDrag, {key: item, data: item, class: `drag-${item}`} as never, {default: () => h('div', item)}),
                  ),
              },
            ),
          ],
        });
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
  return {wrapper, lists, dragA};
}

afterEach(() => {
  dropListRegistry.clear();
  document.body.innerHTML = '';
});

describe('VDropListGroup', () => {
  it('group disabled 传播到组内列表', () => {
    const {wrapper, lists, dragA} = mountGroup({groupDisabled: true});
    expect(lists[0].classes()).toContain('vcdk-drop-list-disabled');

    dispatchMouseEvent(dragA[0].element, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 100,
      pageY: 50,
      clientX: 100,
      clientY: 50,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 100, pageY: 150, clientX: 100, clientY: 150});
    dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 100, pageY: 150, clientX: 100, clientY: 150});
    expect(lists[0].findComponent(VDrag).emitted('started')).toBeUndefined();
    wrapper.unmount();
  });

  it('组内列表自动互联，支持跨容器拖拽', async () => {
    const {wrapper, lists, dragA} = mountGroup();

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

    const dropped = lists[1].emitted('dropped')![0][0] as {container: unknown; previousContainer: unknown};
    expect(dropped.previousContainer).not.toBe(dropped.container);
    expect((dropped.container as {id: string}).id).toBeTypeOf('string');
    wrapper.unmount();
  });
});
