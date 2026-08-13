import {defineComponent, h} from 'vue';
import {mount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {
  CDK_PLATFORM,
  Platform,
  createPlatform,
  getEventTarget,
  getEventTargetPierceShadowDom,
  getFocusedElementPierceShadowDom,
  getShadowRoot,
  hasModifierKey,
  isBrowser,
  normalizePassiveListenerOptions,
  platform,
  providePlatform,
  supportsPassiveEventListeners,
  supportsPopover,
  supportsShadowDom,
  usePlatform,
} from './platform';

/** 各浏览器/引擎识别测试使用的固定 UA，避免依赖运行环境。 */
// 与 Angular 保持一致的 EdgeHTML UA：Angular 用 /(edge)/i 检测，只命中
// "Edge" 完整字样；现代 Chromium Edge 的 UA 为 "Edg/..."，不在检测范围内。
const edgeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393';
const tridentUA = 'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko';
const chromeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const safariUA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const firefoxUA =
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0';
const iosUA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const androidUA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const fakeSafariUA = 'Mozilla/5.0 (X11; Linux x86_64) FooBar Safari/605.1.15';

describe('Platform 浏览器识别', () => {
  it('识别 Edge：EDGE 优先，BLINK/WEBKIT 为 false', () => {
    const edge = createPlatform({userAgent: edgeUA});
    expect(edge.isBrowser).toBe(true);
    expect(edge.EDGE).toBe(true);
    expect(edge.TRIDENT).toBe(false);
    expect(edge.BLINK).toBe(false);
    expect(edge.WEBKIT).toBe(false);
  });

  it('识别 Trident：TRIDENT 为 true，其余引擎标志为 false', () => {
    const trident = createPlatform({userAgent: tridentUA});
    expect(trident.TRIDENT).toBe(true);
    expect(trident.EDGE).toBe(false);
    expect(trident.BLINK).toBe(false);
    expect(trident.WEBKIT).toBe(false);
  });

  it('识别 Blink：window.chrome 存在且非 Edge/Trident 时为 true', () => {
    vi.stubGlobal('chrome', {});
    try {
      const blink = createPlatform({userAgent: chromeUA});
      expect(blink.BLINK).toBe(true);
      expect(blink.WEBKIT).toBe(false);
      expect(blink.EDGE).toBe(false);
      expect(blink.SAFARI).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('识别 Safari：同时命中 Safari 关键字与 WebKit 引擎', () => {
    const safari = createPlatform({userAgent: safariUA});
    expect(safari.WEBKIT).toBe(true);
    expect(safari.SAFARI).toBe(true);
    expect(safari.BLINK).toBe(false);
  });

  it('识别 Firefox：无 AppleWebKit 时 WEBKIT/SAFARI 为 false', () => {
    const firefox = createPlatform({userAgent: firefoxUA});
    expect(firefox.FIREFOX).toBe(true);
    expect(firefox.WEBKIT).toBe(false);
    expect(firefox.SAFARI).toBe(false);
  });

  it('识别 iOS：iPhone UA 命中 IOS/WEBKIT/SAFARI', () => {
    const ios = createPlatform({userAgent: iosUA});
    expect(ios.IOS).toBe(true);
    expect(ios.WEBKIT).toBe(true);
    expect(ios.SAFARI).toBe(true);
  });

  it('识别 Android：ANDROID 为 true 且排除 TRIDENT', () => {
    const android = createPlatform({userAgent: androidUA});
    expect(android.ANDROID).toBe(true);
    expect(android.TRIDENT).toBe(false);
    // 与 Angular 行为一致：Chrome 移动 UA 同时命中 safari 与 AppleWebKit。
    expect(android.SAFARI).toBe(true);
  });

  it('伪造的 Safari UA（无 AppleWebKit）不判定为 Safari/WebKit', () => {
    const fake = createPlatform({userAgent: fakeSafariUA});
    expect(fake.WEBKIT).toBe(false);
    expect(fake.SAFARI).toBe(false);
  });

  it('jsdom 默认 UA：WEBKIT 为 true，SAFARI 无 safari 关键字为 false', () => {
    const current = createPlatform();
    expect(current.isBrowser).toBe(true);
    expect(current.WEBKIT).toBe(true);
    expect(current.SAFARI).toBe(false);
    expect(current.EDGE).toBe(false);
    expect(current.TRIDENT).toBe(false);
    expect(current.FIREFOX).toBe(false);
  });

  it('非浏览器环境：所有标志为 false', async () => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('navigator', undefined);
    try {
      const {Platform: PlatformClass, createPlatform: create} = await import('./platform');
      const server = create();
      expect(server).toBeInstanceOf(PlatformClass);
      expect(server.isBrowser).toBe(false);
      expect(server.EDGE).toBe(false);
      expect(server.TRIDENT).toBe(false);
      expect(server.BLINK).toBe(false);
      expect(server.WEBKIT).toBe(false);
      expect(server.IOS).toBe(false);
      expect(server.FIREFOX).toBe(false);
      expect(server.ANDROID).toBe(false);
      expect(server.SAFARI).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('usePlatform / providePlatform', () => {
  const PlatformConsumer = defineComponent({
    setup() {
      const instance = usePlatform();
      return () => h('div', instance === platform ? 'singleton' : 'injected');
    },
  });

  it('无注入时回退全局单例', () => {
    const wrapper = mount(PlatformConsumer);
    expect(wrapper.text()).toBe('singleton');
  });

  it('组件级 providePlatform 注入的实例优先于单例', () => {
    const custom = createPlatform({userAgent: edgeUA});
    const Parent = defineComponent({
      setup() {
        providePlatform(custom);
        return () => h(PlatformConsumer);
      },
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).toBe('injected');
  });

  it('providePlatform 缺省参数提供全局单例并返回实例', () => {
    let returned: Platform | null = null;
    const Parent = defineComponent({
      setup() {
        returned = providePlatform();
        return () => h('div', 'ok');
      },
    });
    mount(Parent);
    expect(returned).toBe(platform);
  });

  it('App 级 provide（global.provide 注入 CDK_PLATFORM）覆盖单例', () => {
    const custom = createPlatform({userAgent: firefoxUA});
    const wrapper = mount(PlatformConsumer, {
      global: {provide: {[CDK_PLATFORM]: custom}},
    });
    expect(wrapper.text()).toBe('injected');
  });
});

describe('平台基础工具', () => {
  it('isBrowser 在 jsdom 中返回 true', () => {
    expect(isBrowser()).toBe(true);
  });

  it('supportsPopover 默认 false，body.showPopover 存在时返回 true', () => {
    expect(supportsPopover()).toBe(false);
    Object.defineProperty(document.body, 'showPopover', {value: () => {}, configurable: true});
    expect(supportsPopover()).toBe(true);
    delete (document.body as unknown as {showPopover?: unknown}).showPopover;
    expect(supportsPopover()).toBe(false);
  });

  it('getEventTarget 返回派发事件的目标元素', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const event = new MouseEvent('click', {bubbles: true});
    button.dispatchEvent(event);
    expect(getEventTarget(event)).toBe(button);
    button.remove();
  });
});

describe('platform 扩展工具', () => {
  it('hasModifierKey 无参数时任意修饰键均为 true，传入名称时按名称判断', () => {
    const shiftOnly = new KeyboardEvent('keydown', {shiftKey: true});
    const ctrlOnly = new KeyboardEvent('keydown', {ctrlKey: true});

    expect(hasModifierKey(shiftOnly)).toBe(true);
    expect(hasModifierKey(ctrlOnly)).toBe(true);
    expect(hasModifierKey(shiftOnly, 'ctrlKey')).toBe(false);
    expect(hasModifierKey(shiftOnly, 'shiftKey')).toBe(true);
    expect(hasModifierKey(ctrlOnly, 'shiftKey', 'ctrlKey')).toBe(true);
  });

  it('supportsShadowDom 在 jsdom 中返回 true（Element 原型存在 attachShadow）', () => {
    expect(supportsShadowDom()).toBe(true);
  });

  it('getShadowRoot 对普通元素返回 null，对 Shadow DOM 内元素返回其根节点', () => {
    const host = document.createElement('div');
    const root = host.attachShadow({mode: 'open'});
    const inner = document.createElement('input');
    root.appendChild(inner);

    expect(getShadowRoot(document.body)).toBeNull();
    expect(getShadowRoot(inner)).toBe(root);
  });

  it('getFocusedElementPierceShadowDom 返回当前聚焦元素', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    expect(getFocusedElementPierceShadowDom()).toBe(input);
  });

  it('getEventTargetPierceShadowDom 返回事件目标（composedPath 不可用时回退 event.target）', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    const event = new MouseEvent('click', {bubbles: true});
    button.dispatchEvent(event);

    expect(getEventTargetPierceShadowDom(event)).toBe(button);
  });

  it('supportsPassiveEventListeners / normalizePassiveListenerOptions 在 jsdom 中可用', () => {
    expect(supportsPassiveEventListeners()).toBe(true);

    const options: AddEventListenerOptions = {passive: true, capture: true};
    expect(normalizePassiveListenerOptions(options)).toBe(options);
  });
});
