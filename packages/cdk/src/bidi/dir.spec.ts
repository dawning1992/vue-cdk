import {defineComponent, h, nextTick, ref} from 'vue';
import {mount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {Dir, VDir} from './dir';
import {Directionality, useDirectionality} from './directionality';

describe('VDir', () => {
  it('保留原始属性并通过插槽暴露归一化方向', () => {
    const wrapper = mount(VDir, {
      props: {dir: 'AUTO', as: 'section'},
      slots: {default: ({direction}: {direction: string}) => h('span', direction)},
    });
    expect(wrapper.element.tagName).toBe('SECTION');
    expect(wrapper.attributes('dir')).toBe('AUTO');
    expect(['ltr', 'rtl']).toContain(wrapper.text());
    expect(Dir).toBe(VDir);
  });

  it('初始值不发射，后续只在有效方向变化时发射 dirChange', async () => {
    const direction = ref('rtl');
    const onChange = vi.fn();
    const Host = defineComponent({
      setup: () => () => h(VDir, {dir: direction.value, onDirChange: onChange}),
    });
    mount(Host);
    expect(onChange).not.toHaveBeenCalled();

    direction.value = 'RTL';
    await nextTick();
    expect(onChange).not.toHaveBeenCalled();
    direction.value = 'ltr';
    await nextTick();
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('ltr');
  });

  it('向后代提供最近的嵌套方向上下文', () => {
    const seen: Directionality[] = [];
    const Consumer = defineComponent({
      setup() {
        const directionality = useDirectionality();
        seen.push(directionality);
        return () => h('span', directionality.valueSignal.value);
      },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(VDir, {dir: 'rtl'}, () => [
            h(Consumer),
            h(VDir, {dir: 'ltr'}, () => h(Consumer)),
          ]),
      }),
    );
    expect(wrapper.findAll('span').map(node => node.text())).toEqual(['rtl', 'ltr']);
    expect(seen[0]).not.toBe(seen[1]);
  });

  it('卸载时完成事件流', () => {
    const wrapper = mount(VDir, {props: {dir: 'rtl'}});
    const exposed = wrapper.vm as unknown as Directionality;
    const listener = vi.fn();
    exposed.change.subscribe(listener);
    wrapper.unmount();
    expect(exposed.change.hasListeners).toBe(false);
  });
});
