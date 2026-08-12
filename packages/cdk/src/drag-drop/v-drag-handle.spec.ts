import {afterEach, describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {h, withDirectives} from 'vue';
import {dispatchMouseEvent, mockRect} from '../../tests/helpers';
import {vDragHandle} from './v-drag-handle';
import {VDrag} from './v-drag';

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

function mountWithHandle(options: {handleDisabled?: boolean} = {}) {
  const wrapper = mount(VDrag, {
    props: {data: 'item'},
    slots: {
      default: () =>
        h('div', {class: 'drag-body'}, [
          h('div', 'body'),
          withDirectives(h('button', {class: 'drag-handle'}), [
            [vDragHandle, {disabled: options.handleDisabled}],
          ]),
        ]),
    },
  });
  mockRect(wrapper.element, rect({left: 0, top: 0, width: 200, height: 100}));
  return wrapper;
}

function dragFrom(element: HTMLElement) {
  dispatchMouseEvent(element, 'mousedown', {
    button: 0,
    buttons: 1,
    detail: 1,
    pageX: 10,
    pageY: 10,
    clientX: 10,
    clientY: 10,
  });
  dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 40, pageY: 40, clientX: 40, clientY: 40});
  dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 40, pageY: 40, clientX: 40, clientY: 40});
  dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 40, pageY: 40, clientX: 40, clientY: 40});
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('vDragHandle', () => {
  it('只有 handle 可以启动拖拽', async () => {
    const wrapper = mountWithHandle();
    await new Promise(resolve => setTimeout(resolve, 0));

    dragFrom(wrapper.find('.drag-body').element as HTMLElement);
    expect(wrapper.emitted('started')).toBeUndefined();

    dragFrom(wrapper.find('.drag-handle').element as HTMLElement);
    expect(wrapper.emitted('started')).toHaveLength(1);
    wrapper.unmount();
  });

  it('disabled handle 无法启动拖拽', async () => {
    const wrapper = mountWithHandle({handleDisabled: true});
    await new Promise(resolve => setTimeout(resolve, 0));
    dragFrom(wrapper.find('.drag-handle').element as HTMLElement);
    expect(wrapper.emitted('started')).toBeUndefined();
    wrapper.unmount();
  });
});
