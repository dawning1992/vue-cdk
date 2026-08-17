import {defineComponent, h, nextTick, ref} from 'vue';
import {mount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {
  CDK_DIRECTIONALITY,
  DIR_DOCUMENT,
  Directionality,
  getDirection,
  provideDirectionality,
  resolveDirectionality,
  useDirectionality,
} from './directionality';

describe('resolveDirectionality', () => {
  it.each([
    ['rtl', 'rtl'],
    ['RTL', 'rtl'],
    ['ltr', 'ltr'],
    ['unknown', 'ltr'],
    ['', 'ltr'],
    [null, 'ltr'],
  ] as const)('将 %s 解析为 %s', (input, expected) => {
    expect(resolveDirectionality(input, 'en-US')).toBe(expected);
  });

  it.each([
    ['ar', 'rtl'],
    ['fa-IR', 'rtl'],
    ['en-Arab', 'rtl'],
    ['en-Arab-Latn', 'ltr'],
    ['en-US', 'ltr'],
    [null, 'ltr'],
  ] as const)('根据 locale %s 解析 auto 为 %s', (language, expected) => {
    expect(resolveDirectionality('auto', language)).toBe(expected);
  });
});

describe('Directionality', () => {
  it('按 body、html、ltr 的顺序读取初始方向', () => {
    const fakeDocument = {
      body: {dir: 'rtl'},
      documentElement: {dir: 'ltr'},
    } as Document;
    expect(new Directionality(fakeDocument).value).toBe('rtl');

    fakeDocument.body.dir = '';
    expect(new Directionality(fakeDocument).value).toBe('ltr');
    fakeDocument.documentElement.dir = '';
    expect(new Directionality(fakeDocument).value).toBe('ltr');
    expect(new Directionality(null).value).toBe('ltr');
  });

  it('只在归一化方向变化时发射，并在销毁后停止', () => {
    const context = new Directionality(null, 'ltr');
    const listener = vi.fn();
    context.change.subscribe(listener);

    context.setDirection('invalid');
    context.setDirection('RTL');
    context.setDirection('rtl');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('rtl');
    expect(context.valueSignal.value).toBe('rtl');

    context.destroy();
    context.setDirection('ltr');
    expect(context.value).toBe('rtl');
    expect(context.change.hasListeners).toBe(false);
  });
});

describe('Composition API', () => {
  it('useDirectionality 读取应用提供的 document', () => {
    const fakeDocument = {
      body: {dir: ''},
      documentElement: {dir: 'rtl'},
    } as Document;
    let context!: Directionality;
    const Consumer = defineComponent({
      setup() {
        context = useDirectionality();
        return () => h('span', context.valueSignal.value);
      },
    });
    const wrapper = mount(Consumer, {global: {provide: {[DIR_DOCUMENT as symbol]: fakeDocument}}});
    expect(wrapper.text()).toBe('rtl');
    wrapper.unmount();
    expect(context.change.hasListeners).toBe(false);
  });

  it('注入最近 provider，并响应 provideDirectionality 的 Ref 更新', async () => {
    const direction = ref('rtl');
    let parent!: Directionality;
    let child!: Directionality;
    const Consumer = defineComponent({
      setup() {
        child = useDirectionality();
        return () => h('span', child.valueSignal.value);
      },
    });
    const Provider = defineComponent({
      setup() {
        parent = provideDirectionality(direction);
        return () => h(Consumer);
      },
    });
    const wrapper = mount(Provider);
    expect(child).toBe(parent);
    expect(wrapper.text()).toBe('rtl');
    direction.value = 'ltr';
    await nextTick();
    expect(wrapper.text()).toBe('ltr');
  });

  it('优先使用显式 CDK_DIRECTIONALITY provider', () => {
    const provided = new Directionality(null, 'rtl');
    let injected!: Directionality;
    const Consumer = defineComponent({
      setup() {
        injected = useDirectionality();
        return () => null;
      },
    });
    mount(Consumer, {global: {provide: {[CDK_DIRECTIONALITY as symbol]: provided}}});
    expect(injected).toBe(provided);
  });

  it('在 setup 外调用时给出明确错误', () => {
    expect(() => useDirectionality()).toThrow('setup()');
  });
});

describe('getDirection', () => {
  it('读取最近祖先并即时反映属性变化', () => {
    document.documentElement.dir = 'ltr';
    const parent = document.createElement('section');
    const child = document.createElement('div');
    parent.appendChild(child);
    document.body.appendChild(parent);

    parent.setAttribute('dir', 'RTL');
    expect(getDirection(child)).toBe('rtl');
    parent.setAttribute('dir', 'ltr');
    expect(getDirection(child)).toBe('ltr');
  });
});
