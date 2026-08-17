import {defineComponent, h, nextTick, ref} from 'vue';
import {mount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {CdkAccordion, CdkAccordionItem} from './components';
import {useAccordion} from './accordion';
import {useAccordionItem} from './accordion-item';

function items(wrapper: ReturnType<typeof mount>): any[] {
  return wrapper.findAllComponents(CdkAccordionItem).map(item => (item.vm as any).$?.exposed);
}

describe('CdkAccordion', () => {
  it('默认只允许一个子项展开', () => {
    const wrapper = mount({
      render: () =>
        h(CdkAccordion, null, {default: () => [h(CdkAccordionItem), h(CdkAccordionItem)]}),
    });
    const [first, second] = items(wrapper);

    first.open();
    expect(first.expanded.value).toBe(true);
    second.open();
    expect(first.expanded.value).toBe(false);
    expect(second.expanded.value).toBe(true);
  });

  it('多选模式允许同时展开，并支持全部展开和收起', async () => {
    const multi = ref(true);
    const wrapper = mount({
      setup: () => () =>
        h(CdkAccordion, {multi: multi.value}, {
          default: () => [h(CdkAccordionItem), h(CdkAccordionItem, {disabled: true})],
        }),
    });
    const accordion = (wrapper.findComponent(CdkAccordion).vm as any).$?.exposed;
    const [first, disabled] = items(wrapper);

    accordion.openAll();
    expect(first.expanded.value).toBe(true);
    expect(disabled.expanded.value).toBe(false);
    accordion.closeAll();
    expect(first.expanded.value).toBe(false);

    first.open();
    disabled.setExpanded(true);
    accordion.closeAll();
    expect(first.expanded.value).toBe(false);
    expect(disabled.expanded.value).toBe(true);

    multi.value = false;
    await nextTick();
    first.open();
    expect(disabled.expanded.value).toBe(false);
    first.close();
    accordion.openAll();
    expect(first.expanded.value).toBe(false);
  });

  it('隔离独立项目、不同 accordion 与嵌套项目', () => {
    const wrapper = mount({
      render: () =>
        h('main', [
          h(CdkAccordionItem, null, {default: () => h(CdkAccordionItem)}),
          h(CdkAccordion, null, {default: () => h(CdkAccordionItem)}),
          h(CdkAccordion, null, {default: () => h(CdkAccordionItem)}),
        ]),
    });
    const [outerStandalone, innerStandalone, firstGroup, secondGroup] = items(wrapper);

    outerStandalone.open();
    innerStandalone.open();
    firstGroup.open();
    secondGroup.open();
    expect([outerStandalone, innerStandalone, firstGroup, secondGroup].map(i => i.expanded.value)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it('拒绝同一 accordion 内重复的子项 id，卸载后允许重新注册', async () => {
    const showFirst = ref(true);
    const wrapper = mount({
      setup: () => () =>
        h(CdkAccordion, null, {
          default: () => [showFirst.value && h(CdkAccordionItem, {id: 'same'})],
        }),
    });
    showFirst.value = false;
    await nextTick();
    showFirst.value = true;
    await nextTick();
    expect(wrapper.findComponent(CdkAccordionItem).exists()).toBe(true);

    expect(() =>
      mount({
        render: () =>
          h(CdkAccordion, null, {
            default: () => [h(CdkAccordionItem, {id: 'duplicate'}), h(CdkAccordionItem, {id: 'duplicate'})],
          }),
      }),
    ).toThrow(/重复/);
  });
});

describe('CdkAccordionItem', () => {
  it('支持命令式操作、禁用状态及去重事件', async () => {
    const opened = vi.fn();
    const closed = vi.fn();
    const changed = vi.fn();
    const updated = vi.fn();
    const wrapper = mount(CdkAccordionItem, {
      props: {onOpened: opened, onClosed: closed, onExpandedChange: changed, 'onUpdate:expanded': updated},
    });
    const item = wrapper.vm as any;

    item.open();
    item.open();
    item.toggle();
    item.close();
    expect(opened).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls.map(call => call[0])).toEqual([true, false]);
    expect(updated.mock.calls.map(call => call[0])).toEqual([true, false]);

    await wrapper.setProps({disabled: true});
    item.open();
    expect(item.expanded).toBe(false);
  });

  it('响应外部 expanded 更新但不回发 update:expanded', async () => {
    const changed = vi.fn();
    const updated = vi.fn();
    const wrapper = mount(CdkAccordionItem, {
      props: {expanded: false, onExpandedChange: changed, 'onUpdate:expanded': updated},
    });
    await wrapper.setProps({expanded: true});
    expect((wrapper.vm as any).expanded).toBe(true);
    expect(changed).toHaveBeenCalledWith(true);
    expect(updated).not.toHaveBeenCalled();
  });

  it('提供 id、插槽状态、as/attrs 透传和公开方法', async () => {
    const wrapper = mount(CdkAccordionItem, {
      props: {id: 'custom-item', as: 'section'},
      attrs: {'data-test': 'host'},
      slots: {default: ({id, expanded, toggle}: any) => h('button', {onClick: toggle}, `${id}:${expanded}`)},
    });
    expect(wrapper.element.tagName).toBe('SECTION');
    expect(wrapper.attributes('data-test')).toBe('host');
    expect(wrapper.text()).toBe('custom-item:false');
    await wrapper.get('button').trigger('click');
    expect(wrapper.text()).toBe('custom-item:true');
    expect(typeof (wrapper.vm as any).close).toBe('function');
  });

  it('自动 id 唯一，并在卸载时派发 destroyed', () => {
    const destroyed = vi.fn();
    const first = mount(CdkAccordionItem, {props: {onDestroyed: destroyed}});
    const second = mount(CdkAccordionItem);
    expect((first.vm as any).id).not.toBe((second.vm as any).id);
    first.unmount();
    expect(destroyed).toHaveBeenCalledTimes(1);
  });
});

describe('Composition API', () => {
  it('useAccordion 与 useAccordionItem 可直接组成无样式实现并自动清理', () => {
    let accordionApi: ReturnType<typeof useAccordion> | undefined;
    let firstApi: ReturnType<typeof useAccordionItem> | undefined;
    let secondApi: ReturnType<typeof useAccordionItem> | undefined;
    const Child = defineComponent({
      setup() {
        const item = useAccordionItem();
        if (!firstApi) firstApi = item;
        else secondApi = item;
        return () => h('span');
      },
    });
    const wrapper = mount(
      defineComponent({
        setup() {
          accordionApi = useAccordion();
          return () => h('div', [h(Child), h(Child)]);
        },
      }),
    );
    firstApi!.open();
    secondApi!.open();
    expect(firstApi!.expanded.value).toBe(false);
    expect(secondApi!.expanded.value).toBe(true);
    accordionApi!.closeAll();
    expect(secondApi!.expanded.value).toBe(false);
    wrapper.unmount();
  });
});
