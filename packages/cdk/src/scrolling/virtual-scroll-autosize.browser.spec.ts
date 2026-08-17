import {afterEach, describe, expect, it} from 'vitest';
import {defineComponent, h, nextTick, ref} from 'vue';
import {mount, type VueWrapper} from '@vue/test-utils';
import {VVirtualFor} from './virtual-for';
import {VVirtualScrollViewport} from './virtual-scroll-viewport';

let wrappers: VueWrapper[] = [];

afterEach(() => {
  wrappers.forEach(wrapper => wrapper.unmount());
  wrappers = [];
  document.body.innerHTML = '';
});

async function settleLayout(): Promise<void> {
  await nextTick();
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await nextTick();
}

describe('autosize 虚拟滚动 Chromium 集成', () => {
  it('真实不等高条目和运行时高度变化会更新总内容尺寸', async () => {
    const rows = ref(Array.from({length: 8}, (_, id) => ({id, height: id % 2 ? 70 : 30})));
    const Wrapper = defineComponent({
      setup: () => () => h(
        VVirtualScrollViewport,
        {autosize: true, minBufferPx: 500, maxBufferPx: 500, style: 'height:200px;width:320px'},
        {default: () => h(VVirtualFor, {
          of: rows.value,
          trackBy: (_index: number, row: unknown) => (row as {id: number}).id,
        }, {
          default: ({item}: {item: {id: number; height: number}}) =>
            h('div', {class: 'row', style: `height:${item.height}px`}, String(item.id)),
        })},
      ),
    });
    const wrapper = mount(Wrapper, {attachTo: document.body});
    wrappers.push(wrapper);
    await settleLayout();
    const spacer = wrapper.find('.vcdk-virtual-scroll-spacer').element as HTMLElement;
    expect(parseFloat(spacer.style.height)).toBeCloseTo(400, 0);

    rows.value = rows.value.map((row, index) => index === 0 ? {...row, height: 90} : row);
    await settleLayout();
    expect(parseFloat(spacer.style.height)).toBeCloseTo(460, 0);
  });

  it('大数据量只渲染视口及缓冲区，并在顶部追加后保持锚点', async () => {
    const rows = ref(Array.from({length: 1000}, (_, id) => ({id, height: 30 + id % 4 * 10})));
    const Wrapper = defineComponent({
      setup: () => () => h(
        VVirtualScrollViewport,
        {autosize: true, style: 'height:240px;width:320px'},
        {default: () => h(VVirtualFor, {
          of: rows.value,
          trackBy: (_index: number, row: unknown) => (row as {id: number}).id,
        }, {
          default: ({item}: {item: {id: number; height: number}}) =>
            h('div', {class: 'row', style: `height:${item.height}px`}, String(item.id)),
        })},
      ),
    });
    const wrapper = mount(Wrapper, {attachTo: document.body});
    wrappers.push(wrapper);
    await settleLayout();
    const viewport = wrapper.find('.vcdk-virtual-scroll-viewport').element as HTMLElement;
    expect(wrapper.findAll('.row').length).toBeLessThan(30);

    viewport.scrollTop = 900;
    viewport.dispatchEvent(new Event('scroll'));
    await settleLayout();
    const viewportTop = viewport.getBoundingClientRect().top;
    const anchor = wrapper.findAll('.row').find(row => row.element.getBoundingClientRect().bottom > viewportTop);
    expect(anchor).toBeDefined();
    const anchorText = anchor!.text();
    const anchorOffset = anchor!.element.getBoundingClientRect().top - viewportTop;
    rows.value = [
      {id: -2, height: 40},
      {id: -1, height: 60},
      ...rows.value,
    ];
    await settleLayout();
    const restoredAnchor = wrapper.findAll('.row').find(row => row.text() === anchorText);
    expect(restoredAnchor).toBeDefined();
    expect(restoredAnchor!.element.getBoundingClientRect().top - viewportTop).toBeCloseTo(anchorOffset, 0);
    expect(wrapper.findAll('.row').length).toBeLessThan(30);

    viewport.scrollTop = viewport.scrollHeight;
    viewport.dispatchEvent(new Event('scroll'));
    await settleLayout();
    rows.value = [{id: -3, height: 110}, ...rows.value];
    await settleLayout();
    expect(viewport.scrollTop).toBeCloseTo(viewport.scrollHeight - viewport.clientHeight, 0);
  });
});
