import {describe, expect, it, vi} from 'vitest';
import {getRtlScrollAxisType, RtlScrollAxisType, supportsScrollBehavior} from './scrolling';

describe('RtlScrollAxisType', () => {
  it('jsdom 中返回合法的轴类型枚举值', () => {
    const type = getRtlScrollAxisType();
    expect([RtlScrollAxisType.NORMAL, RtlScrollAxisType.NEGATED, RtlScrollAxisType.INVERTED]).toContain(
      type,
    );
  });

  it('结果按进程缓存：重复调用返回同一枚举值', () => {
    const first = getRtlScrollAxisType();
    const second = getRtlScrollAxisType();
    expect(second).toBe(first);
  });

  it('探测容器会被移除，不污染 DOM', () => {
    getRtlScrollAxisType();
    const leftovers = document.querySelectorAll('div[dir="rtl"]');
    expect(leftovers.length).toBe(0);
  });
});

describe('supportsScrollBehavior', () => {
  it('jsdom 中支持 scroll-behavior（样式表存在该属性）', () => {
    expect(supportsScrollBehavior()).toBe(true);
  });

  it('结果按进程缓存：重复调用不再探测', () => {
    const first = supportsScrollBehavior();
    const second = supportsScrollBehavior();
    expect(second).toBe(first);
  });

  it('非浏览器环境回退为 false', async () => {
    // 重置模块缓存并替换全局，验证 SSR 环境的回退路径。
    vi.resetModules();
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    const {supportsScrollBehavior: ssb} = await import('./scrolling');
    expect(ssb()).toBe(false);
    vi.unstubAllGlobals();
  });
});
